"""Dynamic conflict resolution — replaces the single hardcoded C-1 path.

Changes vs. original:
  - resolved-state is tracked per conflict group (in the DB via block.conflict
    flag), not as a global boolean.
  - Merge write-back: deletes both original blocks AND creates the merged block.
  - Resequence write-back: updates Block.start for EVERY block CP-SAT moved,
    then re-runs recompute_section_conflicts so flags stay consistent.
"""

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
from ..security import get_current_user, require_role
from ..services.conflict_service import recompute_section_conflicts
from ..services.ops import log_audit, push_feed
from ..services.optimizer import MergeProposal, resolve_section

router = APIRouter(prefix="/api/conflicts", tags=["conflicts"])


# ---------------------------------------------------------------------------
# GET /api/conflicts — list all live conflict groups derived from DB flags
# ---------------------------------------------------------------------------

@router.get("", response_model=list[ConflictGroup])
def list_conflicts(
    session: Session = Depends(get_session),
    _user: models.User = Depends(get_current_user),
):
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


# ---------------------------------------------------------------------------
# POST /api/conflicts/resolve — merge or manual-override any live conflict
# ---------------------------------------------------------------------------

@router.post("/resolve", response_model=ConflictResolveResponse)
async def resolve_conflict(
    payload: ConflictResolveRequest,
    session: Session = Depends(get_session),
    _user: models.User = Depends(require_role("controller", "approver")),
):
    """Resolve an arbitrary live conflict group by merging its two blocks.

    The conflict_id is a transient label (C-1, C-2 …) derived from the live
    /api/conflicts list — we accept the block_ids directly in the payload so
    callers don't have to keep the volatile numbering consistent.

    Merge write-back:
      1. Delete every original block in the group.
      2. Create the merged block (combined start/dur, dept='Merged').
      3. Re-derive conflict flags for the section.
    """
    if not payload.block_ids:
        raise HTTPException(400, "Provide block_ids to resolve")

    blocks = [session.get(models.Block, bid) for bid in payload.block_ids]
    blocks = [b for b in blocks if b is not None]
    if not blocks:
        raise HTTPException(404, "None of the provided block_ids were found")
    if len(blocks) < 2:
        raise HTTPException(409, f"Only one block found — conflict already partially resolved?")

    sec = blocks[0].sec
    merged_start = min(b.start for b in blocks)
    merged_end = max(b.start + b.dur for b in blocks)
    merged_dur = merged_end - merged_start
    dept_labels = "+".join(sorted({b.dept for b in blocks}))
    defect_labels = " / ".join(b.defect for b in blocks)

    # --- delete originals ---
    for b in blocks:
        session.delete(b)
    session.commit()

    # --- create merged block ---
    merged_id = f"M-{'_'.join(sorted(b.id for b in blocks))[:20]}"
    merged = models.Block(
        id=merged_id,
        sec=sec,
        dept="Merged",
        start=merged_start,
        dur=merged_dur,
        defect=defect_labels,
        sev="Critical",
        overdue=max(b.overdue for b in blocks),
        src="COMBINED",
        st="Scheduled",
        note=f"Merged block from conflict {payload.conflict_id or 'unknown'} — {dept_labels}.",
        conflict=False,
    )
    session.add(merged)
    session.commit()
    session.refresh(merged)

    # re-derive flags
    recompute_section_conflicts(session, sec)
    session.refresh(merged)

    action = "AI AUTO-RESOLVED" if payload.method == "ai" else "MANUAL OVERRIDE"
    detail = (
        f"{payload.conflict_id or 'conflict'} merged: "
        f"{' + '.join(b.id for b in blocks)} → {merged_id} on {sec}."
    )
    audit_entry, _ = await log_audit(session, action, detail, payload.by or _user.name)
    feed_event = await push_feed(
        session,
        f"{'🤖 AI' if payload.method == 'ai' else '✅ Manual'} resolved {payload.conflict_id or 'conflict'} → {merged_id} on {sec}",
        "#3E8E5B",
    )

    return ConflictResolveResponse(
        resolved=True,
        message=f"Conflict resolved — {merged_id} created, timeline updated, audit written.",
        merged_block=merged,
        audit_entry=audit_entry,
        feed_event=feed_event,
    )


# ---------------------------------------------------------------------------
# POST /api/conflicts/optimize — CP-SAT optimizer for any section
# ---------------------------------------------------------------------------

@router.post("/optimize", response_model=SectionOptimizerOut)
async def optimize_section(
    payload: OptimizerRequest,
    session: Session = Depends(get_session),
    _user: models.User = Depends(require_role("controller", "approver")),
):
    """Run the CP-SAT conflict optimizer on a section.

    Accepts either:
      • `sec`       — resolves all conflict-flagged blocks on that section.
      • `block_ids` — resolves the explicitly listed blocks (takes precedence).

    Resequence write-back (OPTIMAL/FEASIBLE):
      Updates Block.start for EVERY block CP-SAT moved, then re-derives the
      conflict flags for the section so the timeline stays consistent.
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

    # ── Resequence write-back for OPTIMAL/FEASIBLE ────────────────────────
    if result.status in ("OPTIMAL", "FEASIBLE"):
        for s in result.scheduled:
            if s.delay_hours > 0:
                blk = session.get(models.Block, s.block_id)
                if blk:
                    blk.start = s.scheduled_start
                    session.add(blk)
        session.commit()
        # re-derive conflict flags after all start times updated
        recompute_section_conflicts(session, sec)

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
            + (f"{len(delayed)} delayed & written back: " + ", ".join(f"{s.block_id}+{s.delay_hours:.1f}h" for s in delayed)
               if delayed else "All blocks on time.")
        )
        await log_audit(session, "OPTIMIZER RUN", detail, _user.name)
        await push_feed(
            session,
            f"📐 Optimizer {result.status.lower()} for {sec} — {len(result.scheduled)} blocks scheduled"
            + (f", {len(delayed)} resequenced" if delayed else ""),
            "#7C5AA6",
        )

    elif result.status == "MERGE_OFFERED":
        mp = result.merge_proposal
        await log_audit(
            session,
            "MERGE PROPOSED",
            f"Merge offer for {mp.block_a_id} + {mp.block_b_id} on {sec} ({mp.merged_dur:.1f}h combined window)",
            _user.name,
        )
        await push_feed(
            session,
            f"🔀 Merge proposed for {sec}: {mp.block_a_id} + {mp.block_b_id}",
            "#B9812C",
        )

    elif result.status == "INFEASIBLE":
        await log_audit(
            session,
            "OPTIMIZER INFEASIBLE",
            f"CP-SAT could not schedule {len(blocks)} blocks on {sec} within SLA caps — manual escalation required.",
            _user.name,
        )
        await push_feed(
            session,
            f"⚠️ Optimizer INFEASIBLE for {sec} — manual escalation required",
            "#BB4430",
        )

    return SectionOptimizerOut(
        sec=result.sec,
        status=result.status,
        merge_proposal=merge_out,
        scheduled=scheduled_out,
        solver_wall_seconds=result.solver_wall_seconds,
        rationale=result.rationale,
    )
