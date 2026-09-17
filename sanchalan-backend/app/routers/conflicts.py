from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from .. import models
from ..database import get_session
from ..schemas import ConflictGroup, ConflictResolveRequest, ConflictResolveResponse
from ..services.conflict_service import KNOWN_CONFLICTS, resolve_known_conflict
from ..services.ops import log_audit, push_feed

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
        # logAudit() already writes a paired "📝 ..." feed row; the AI path
        # additionally gets its own celebratory feed line, same as
        # AppContext.jsx's resolveConflict('ai') branch.
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
