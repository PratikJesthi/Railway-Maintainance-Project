"""CP-SAT conflict optimizer — `services/optimizer.py`

Designed with a single plug-in seam (get_priority_score) so that the
scoring function can be swapped from rule-based heuristic to an ML model
prediction without touching the CP-SAT scheduler, merge detection, or any
calling router.

Today:  get_priority_score = heuristic formula from QueueItem components.
Later:  get_priority_score = ml_model.predict(block_features)
         or a blend:         0.5 * heuristic + 0.5 * ml_model.predict(...)

The CP-SAT NoOverlap scheduling, merge pre-detection, and all constraint
logic are written once here and never need to change when the scoring
function improves.

Dependencies:
  ortools (already added to requirements.txt as `ortools>=9.9`)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Optional

from ortools.sat.python import cp_model

from .. import models

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Fallback priority scores when a block's defect has no QueueItem record.
# Mirrors the severity ordering used in AppContext.jsx's priorityScore helper.
SEVERITY_FALLBACK: dict[str, float] = {
    "Critical": 40.0,
    "High":     28.0,
    "Medium":   16.0,
    "Low":      8.0,
}

# A merge is offered when two conflicting blocks from different departments
# fit within this combined window (hours).  Mirrors the C-1 demo logic.
MERGE_WINDOW_THRESHOLD_HOURS: float = 20.0

# CP-SAT time resolution: 1 unit = 1 minute (converts float hours → int)
MINUTES_PER_UNIT: int = 60

# Optimisation time-limit per section (seconds)
SOLVER_TIME_LIMIT_SECONDS: float = 10.0


# ---------------------------------------------------------------------------
# Priority score — THE SEAM
# ---------------------------------------------------------------------------

def get_priority_score(
    block: models.Block,
    queue_by_defect: dict[str, models.QueueItem],
) -> float:
    """Return a single priority score for a block.

    TODAY — pure heuristic: sum of pre-computed QueueItem component scores
    (sev + ovd + crit + saf), with a severity-table fallback when no queue
    record exists.

    FUTURE — replace this function body with, e.g.:
        features = extract_features(block)
        return ml_model.predict([features])[0]

    Or a gradual blend during cutover:
        h = _heuristic(block, queue_by_defect)
        m = ml_model.predict([extract_features(block)])[0]
        return 0.5 * h + 0.5 * m

    The CP-SAT model below only ever calls this function — it never reads
    severity strings or queue records itself, so nothing else changes when
    the scoring body improves.
    """
    qi = queue_by_defect.get(block.defect)
    if qi is not None:
        return float(qi.sev + qi.ovd + qi.crit + qi.saf)
    # Fallback: severity weight + 2 points per overdue day
    return SEVERITY_FALLBACK.get(block.sev, 8.0) + block.overdue * 2.0


# ---------------------------------------------------------------------------
# Result dataclasses
# ---------------------------------------------------------------------------

@dataclass
class MergeProposal:
    """A pre-step merge suggestion for two compatible overlapping blocks."""
    block_a_id: str
    block_b_id: str
    dept_a: str
    dept_b: str
    merged_start: float          # hours from Mon 00:00
    merged_dur: float
    combined_window: float       # merged_dur (same as merged_dur, kept for clarity)
    rationale: str


@dataclass
class ScheduledBlock:
    """One block's optimized placement returned by the solver."""
    block_id: str
    sec: str
    dept: str
    original_start: float        # hours — original requested start
    scheduled_start: float       # hours — solver's recommendation
    scheduled_end: float         # hours — scheduled_start + dur
    dur: float
    priority_score: float
    delay_hours: float           # scheduled_start - original_start (0 = on time)
    sev: str
    defect: str


@dataclass
class SectionOptimizerResult:
    """Full result for one section's conflict resolution run."""
    sec: str
    status: str                           # "OPTIMAL" | "FEASIBLE" | "INFEASIBLE" | "MERGE_OFFERED"
    merge_proposal: Optional[MergeProposal] = None
    scheduled: list[ScheduledBlock] = field(default_factory=list)
    solver_wall_seconds: float = 0.0
    rationale: str = ""


# ---------------------------------------------------------------------------
# Merge pre-detection  (rule, not CP-SAT)
# ---------------------------------------------------------------------------

def _try_merge(
    blocks: list[models.Block],
) -> Optional[MergeProposal]:
    """Offer a merge when exactly two blocks from different departments
    both fit within MERGE_WINDOW_THRESHOLD_HOURS.

    This is intentionally a simple pre-step rule, not a CP-SAT decision.
    Merge viability is a domain constraint (shared physical possession),
    not an optimisation variable.
    """
    if len(blocks) != 2:
        return None

    a, b = blocks
    if a.dept == b.dept:
        return None

    merged_start = min(a.start, b.start)
    merged_end = max(a.start + a.dur, b.start + b.dur)
    merged_dur = merged_end - merged_start

    if merged_dur > MERGE_WINDOW_THRESHOLD_HOURS:
        return None

    return MergeProposal(
        block_a_id=a.id,
        block_b_id=b.id,
        dept_a=a.dept,
        dept_b=b.dept,
        merged_start=merged_start,
        merged_dur=merged_dur,
        combined_window=merged_dur,
        rationale=(
            f"Blocks {a.id} ({a.dept}) and {b.id} ({b.dept}) on section "
            f"{a.sec} overlap but fit within a combined {merged_dur:.1f}h window "
            f"(≤ {MERGE_WINDOW_THRESHOLD_HOURS}h threshold). "
            f"A merged possession is recommended to reduce total track occupation time."
        ),
    )


# ---------------------------------------------------------------------------
# CP-SAT scheduler
# ---------------------------------------------------------------------------

def _to_minutes(hours: float) -> int:
    """Convert fractional hours → integer minutes (CP-SAT works with integers)."""
    return int(round(hours * MINUTES_PER_UNIT))


def resolve_section(
    blocks: list[models.Block],
    queue_by_defect: dict[str, models.QueueItem],
) -> SectionOptimizerResult:
    """CP-SAT NoOverlap scheduler for a single section.

    Steps:
      1. Score each block using get_priority_score() (the ML-swappable seam).
      2. Pre-check for a merge (rule-based, not CP-SAT).
      3. Build a CP-SAT model:
         - One interval variable per block: [start, start+dur).
         - AddNoOverlap across all intervals.
         - Objective: minimise weighted tardiness
           (higher priority → heavier penalty for delay).
      4. Solve and return the scheduled placements.

    Args:
        blocks:          All blocks currently in conflict on the section.
        queue_by_defect: Dict mapping defect_id → QueueItem, used by
                         get_priority_score(). Pass an empty dict if queue
                         data is unavailable — fallback scoring kicks in.

    Returns:
        SectionOptimizerResult with status, optional merge proposal, and
        the solver's recommended schedule.
    """
    if not blocks:
        return SectionOptimizerResult(sec="", status="INFEASIBLE", rationale="No blocks provided.")

    sec = blocks[0].sec

    # ── Step 1: score every block ──────────────────────────────────────────
    scores = {b.id: get_priority_score(b, queue_by_defect) for b in blocks}

    # ── Step 2: merge pre-check ────────────────────────────────────────────
    merge = _try_merge(blocks)
    if merge is not None:
        log.info("Optimizer: merge proposal generated for %s (%s + %s)", sec, merge.block_a_id, merge.block_b_id)
        return SectionOptimizerResult(
            sec=sec,
            status="MERGE_OFFERED",
            merge_proposal=merge,
            rationale=merge.rationale,
        )

    # ── Step 3: build CP-SAT model ─────────────────────────────────────────
    model = cp_model.CpModel()

    # Planning horizon: 1 week in minutes (168 h)
    horizon_min = _to_minutes(168.0)

    intervals: dict[str, cp_model.IntervalVar] = {}
    start_vars: dict[str, cp_model.IntVar] = {}

    for b in blocks:
        dur_min = max(1, _to_minutes(b.dur))
        start_min = _to_minutes(b.start)

        # Start variable: can shift right (delay) but not left (cannot start
        # before the originally requested time — block crews are pre-allocated).
        sv = model.new_int_var(start_min, horizon_min - dur_min, f"start_{b.id}")
        iv = model.new_fixed_size_interval_var(sv, dur_min, f"iv_{b.id}")

        start_vars[b.id] = sv
        intervals[b.id] = iv

    # No two blocks may overlap on the section
    model.add_no_overlap(list(intervals.values()))

    # Objective: minimise weighted tardiness
    # Delay = start_var - original_start (in minutes).
    # Weight = priority score (higher priority → delay is more expensive).
    # Normalise scores to int weights (multiply by 10, round) so CP-SAT
    # can work with integers while preserving relative ordering.
    penalty_terms: list[cp_model.LinearExpr] = []
    for b in blocks:
        original_min = _to_minutes(b.start)
        delay_var = model.new_int_var(0, horizon_min, f"delay_{b.id}")
        model.add(delay_var == start_vars[b.id] - original_min)
        weight = max(1, int(round(scores[b.id] * 10)))
        penalty_terms.append(weight * delay_var)

    model.minimize(sum(penalty_terms))

    # ── Step 4: solve ──────────────────────────────────────────────────────
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = SOLVER_TIME_LIMIT_SECONDS
    solver.parameters.log_search_progress = False

    status_code = solver.solve(model)
    wall_secs = solver.wall_time

    status_map = {
        cp_model.OPTIMAL:   "OPTIMAL",
        cp_model.FEASIBLE:  "FEASIBLE",
        cp_model.INFEASIBLE: "INFEASIBLE",
        cp_model.UNKNOWN:   "UNKNOWN",
    }
    status_str = status_map.get(status_code, "UNKNOWN")

    if status_code not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        log.warning("Optimizer: %s for section %s (%.2fs)", status_str, sec, wall_secs)
        return SectionOptimizerResult(
            sec=sec,
            status=status_str,
            solver_wall_seconds=wall_secs,
            rationale=f"CP-SAT returned {status_str} for section {sec}. Manual review required.",
        )

    # ── Step 5: build result ───────────────────────────────────────────────
    scheduled: list[ScheduledBlock] = []
    for b in blocks:
        sched_start_min = solver.value(start_vars[b.id])
        sched_start_h = sched_start_min / MINUTES_PER_UNIT
        delay_h = sched_start_h - b.start

        scheduled.append(ScheduledBlock(
            block_id=b.id,
            sec=b.sec,
            dept=b.dept,
            original_start=b.start,
            scheduled_start=sched_start_h,
            scheduled_end=sched_start_h + b.dur,
            dur=b.dur,
            priority_score=scores[b.id],
            delay_hours=round(delay_h, 2),
            sev=b.sev,
            defect=b.defect,
        ))

    # Sort output highest-priority first (score descending)
    scheduled.sort(key=lambda s: s.priority_score, reverse=True)

    on_time = [s for s in scheduled if s.delay_hours == 0]
    delayed = [s for s in scheduled if s.delay_hours > 0]
    rationale_parts = [
        f"CP-SAT {status_str} ({wall_secs:.2f}s) — {len(blocks)} blocks on {sec}.",
        f"{len(on_time)} scheduled on time, {len(delayed)} delayed.",
    ]
    if delayed:
        rationale_parts.append(
            "Delayed blocks (lowest priority moved right): "
            + ", ".join(f"{s.block_id}+{s.delay_hours:.1f}h" for s in delayed)
        )

    log.info("Optimizer: %s for %s — %d scheduled (%ds)", status_str, sec, len(scheduled), wall_secs)

    return SectionOptimizerResult(
        sec=sec,
        status=status_str,
        merge_proposal=None,
        scheduled=scheduled,
        solver_wall_seconds=wall_secs,
        rationale=" ".join(rationale_parts),
    )
