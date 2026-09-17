from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from .. import models
from ..database import get_session
from ..schemas import BlockCreate, BlockCreateResult, BlockRead, BlockUpdate
from ..services.conflict_service import detect_conflicts
from ..services.ops import log_audit, push_feed

router = APIRouter(prefix="/api/blocks", tags=["blocks"])


@router.get("", response_model=list[BlockRead])
def list_blocks(
    sec: Optional[str] = None,
    dept: Optional[str] = None,
    st: Optional[str] = None,
    session: Session = Depends(get_session),
):
    query = select(models.Block)
    if sec:
        query = query.where(models.Block.sec == sec)
    if dept:
        query = query.where(models.Block.dept == dept)
    if st:
        query = query.where(models.Block.st == st)
    return session.exec(query.order_by(models.Block.sec, models.Block.start)).all()


@router.get("/{block_id}", response_model=BlockRead)
def get_block(block_id: str, session: Session = Depends(get_session)):
    block = session.get(models.Block, block_id)
    if not block:
        raise HTTPException(404, f"Block '{block_id}' not found")
    return block


@router.post("", response_model=BlockCreateResult, status_code=201)
async def create_block(payload: BlockCreate, session: Session = Depends(get_session)):
    if session.get(models.Block, payload.id):
        raise HTTPException(409, f"Block '{payload.id}' already exists")

    block = models.Block(**payload.model_dump())
    session.add(block)
    session.commit()
    session.refresh(block)

    conflicts = detect_conflicts(session, block)
    session.refresh(block)

    if conflicts:
        ids = ", ".join(b.id for b in conflicts)
        await push_feed(
            session,
            f"CONFLICT detected: {block.id} overlaps {ids} on {block.sec}",
            "#BB4430",
        )
    else:
        await push_feed(
            session,
            f"{block.src} push · new block request {block.id} ({block.dept}) added to {block.sec}",
            "#3E8E5B",
        )

    return BlockCreateResult(block=block, conflicts_with=[b.id for b in conflicts])


@router.patch("/{block_id}", response_model=BlockRead)
async def update_block(block_id: str, payload: BlockUpdate, session: Session = Depends(get_session)):
    block = session.get(models.Block, block_id)
    if not block:
        raise HTTPException(404, f"Block '{block_id}' not found")

    changes = payload.model_dump(exclude={"by", "reason"}, exclude_unset=True)
    if not changes:
        return block

    before = {k: getattr(block, k) for k in changes}
    for field, value in changes.items():
        setattr(block, field, value)
    session.add(block)
    session.commit()
    session.refresh(block)

    diff = ", ".join(f"{k}: {before[k]} → {v}" for k, v in changes.items())
    detail = payload.reason or f"{block_id} updated ({diff})"
    await log_audit(session, "MANUAL OVERRIDE", detail, payload.by or "Control User")  # entry, feed_event (unused)

    return block


@router.delete("/{block_id}", status_code=204)
def delete_block(block_id: str, session: Session = Depends(get_session)):
    block = session.get(models.Block, block_id)
    if not block:
        raise HTTPException(404, f"Block '{block_id}' not found")
    session.delete(block)
    session.commit()
