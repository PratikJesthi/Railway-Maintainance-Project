from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from .. import models
from ..database import get_session
from ..schemas import (
    ConflictGroup,
    ConflictResolveRequest,
    ConflictResolveResponse,
    MergeProposalOut,
    OptimizerRequest,
    ScheduledBlockOut,
    SectionOptimizerOut,
)
from ..services.conflict_service import KNOWN_CONFLICTS, resolve_known_conflict
from ..services.ops import log_audit, push_feed
from ..services.optimizer import MergeProposal, resolve_section

router = APIRouter(prefix="/api/conflicts", tags=["conflicts"])


@router.get("", response_model=list[ConflictGroup])
def list_conflicts(session: Session = Depends(get_session)):
    """Groups every block currently flagged conflict=True by section."""
    flagged = session.exec(select(models.Block).where(models.Block.conflict.is_(True))).all()
    by_section: dict[str, list[models.Block]] = defaultdict(list)
    for b in flagged:
        by_section[b.sec].append(b)

    groups = []
    for i, (sec, blocks) in enumerate(by_section.items(), start=1):
        groups.append(
            ConflictGroup(
                conflict_id=f"C-{i}",
                sec=sec,
                block_ids=[b.id for b in blocks],
                blocks=blocks,
            )
        )
    return groups


@router.post("/resolve", response_model=ConflictResolveResponse)
async def resolve_conflict(payload: ConflictResolveRequest, session: Session = Depends(get_session)):
    if payload.conflict_id not in KNOWN_CONFLICTS:
        raise HTTPException(404, f"Unknown conflict id '{payload.conflict_id}'")

    spec = KNOWN_CONFLICTS[payload.conflict_id]
    still_open = any(session.get(models.Block, bid) for bid in spec["block_ids"])
    if not still_open:
        raise HTTPException(409, f"Conflict '{payload.conflict_id}' is already resolved")

    merged = resolve_known_conflict(session, payload.conflict_id)

    if payload.method == "ai":
        audit_entry, _ = await log_audit(
            session,
            "AI AUTO-RESOLVED",
            f"{payload.conflict_id} merged: {' + '.join(spec['block_ids'])} → "
            f"{merged.id} on {merged.sec}, per optimiser recommendation.",
            "SANCHALAN Optimiser",
        )
        feed_event = await push_feed(
            session,
            f"🤖 AI auto-resolved {payload.conflict_id} — merged {merged.id} without human input",
            "#3E8E5B",
        )
    else:
        audit_entry, feed_event = await log_audit(
            session,
            "MANUAL OVERRIDE",
            f"{payload.conflict_id} resolved by override: {payload.method}",
            payload.by or "Control User",
        )

    return ConflictResolveResponse(
        resolved=True,
        message="Conflict resolved — timeline updated, entry written to audit log",
        merged_block=merged,
        audit_entry=audit_entry,
        feed_event=feed_event,
    )


@router.post("/optimize", response_model=SectionOptimizerOut)
async def optimize_section(
    payload: OptimizerRequest,
    session: Session = Depends(get_session),
):
    """Run the CP-SAT conflict optimizer on a section.

    Accepts either:
      • `sec`       — resolves all conflict-flagged blocks on that section.
      • `block_ids` — resolves the explicitly listed blocks (takes precedence).

    Resolution pipeline per section:
      1. Merge pre-check (rule): if exactly 2 cross-dept blocks fit within
         the merge-window threshold, return a MergeProposal and skip CP-SAT.
      2. CP-SAT NoOverlap scheduler: finds the minimum-weighted-tardiness
         non-overlapping schedule, where weights come from get_priority_score()
         — today a heuristic, swappable for an ML model without changing
         anything else here.

    Writes an audit log entry and feed event for any OPTIMAL or FEASIBLE result.
    """
    # ── Resolve the block list ─────────────────────────────────────────────
    if payload.block_ids:
        blocks = [session.get(models.Block, bid) for bid in payload.block_ids]
        blocks = [b for b in blocks if b is not None]
        if not blocks:
            raise HTTPException(404, "None of the requested block_ids were found")
    elif payload.sec:
        blocks = session.exec(
            select(models.Block).where(
                models.Block.sec == payload.sec,
                models.Block.conflict.is_(True),
            )
        ).all()
        if not blocks:
            raise HTTPException(404, f"No conflicting blocks found on section '{payload.sec}'")
    else:
        raise HTTPException(400, "Provide either 'sec' or 'block_ids'")

    sec = blocks[0].sec

    # ── Load queue data for priority scoring ──────────────────────────────
    defect_ids = list({b.defect for b in blocks})
    queue_items = session.exec(
        select(models.QueueItem).where(models.QueueItem.id.in_(defect_ids))
    ).all()
    queue_by_defect: dict[str, models.QueueItem] = {q.id: q for q in queue_items}

    # ── Run optimizer ─────────────────────────────────────────────────────
    result = resolve_section(blocks, queue_by_defect)

    # ── Build response ────────────────────────────────────────────────────
    merge_out = None
    if result.merge_proposal is not None:
        mp: MergeProposal = result.merge_proposal
        merge_out = MergeProposalOut(
            block_a_id=mp.block_a_id,
            block_b_id=mp.block_b_id,
            dept_a=mp.dept_a,
            dept_b=mp.dept_b,
            merged_start=mp.merged_start,
            merged_dur=mp.merged_dur,
            rationale=mp.rationale,
        )

    scheduled_out = [
        ScheduledBlockOut(
            block_id=s.block_id,
            sec=s.sec,
            dept=s.dept,
            original_start=s.original_start,
            scheduled_start=s.scheduled_start,
            scheduled_end=s.scheduled_end,
            dur=s.dur,
            priority_score=s.priority_score,
            delay_hours=s.delay_hours,
            sev=s.sev,
            defect=s.defect,
        )
        for s in result.scheduled
    ]

    # ── Audit + feed for successful runs ──────────────────────────────────
    if result.status in ("OPTIMAL", "FEASIBLE"):
        delayed = [s for s in result.scheduled if s.delay_hours > 0]
        detail = (
            f"CP-SAT {result.status}: {len(result.scheduled)} blocks on {sec}. "
            + (f"{len(delayed)} delayed: " + ", ".join(f"{s.block_id}+{s.delay_hours:.1f}h" for s in delayed)
               if delayed else "All blocks on time.")
        )
        await log_audit(session, "OPTIMIZER RUN", detail, "SANCHALAN Optimiser")
        await push_feed(
            session,
            f"📐 Optimizer {result.status.lower()} for {sec} — {len(result.scheduled)} blocks scheduled",
            "#7C5AA6",
        )

    elif result.status == "MERGE_OFFERED":
        mp = result.merge_proposal
        await log_audit(
            session,
            "MERGE PROPOSED",
            f"Merge offer for {mp.block_a_id} + {mp.block_b_id} on {sec} ({mp.merged_dur:.1f}h combined window)",
            "SANCHALAN Optimiser",
        )
        await push_feed(
            session,
            f"🔀 Merge proposed for {sec}: {mp.block_a_id} + {mp.block_b_id}",
            "#B9812C",
        )

    return SectionOptimizerOut(
        sec=result.sec,
        status=result.status,
        merge_proposal=merge_out,
        scheduled=scheduled_out,
        solver_wall_seconds=result.solver_wall_seconds,
        rationale=result.rationale,
    )

