"""Trains & Timetable router — GET /api/trains

Endpoints:
  GET  /api/trains                         — list all trains (with type filter)
  GET  /api/trains/{number}                — single train detail
  GET  /api/trains/affected?block_id=B-101 — real affected-train count for a block
  GET  /api/trains/timetable?sec=NDLS-MTJ  — all section passes for a section
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import Optional

from .. import models
from ..database import get_session
from ..schemas import (
    TrainRead,
    StationRead,
    TrainSectionPassRead,
    AffectedTrainsResponse,
    TimetableResponse,
)

router = APIRouter(prefix="/api/trains", tags=["trains"])


@router.get("", response_model=list[TrainRead])
def list_trains(
    train_type: Optional[str] = Query(None, description="Filter by type: EXP, SF, PASS, MEMU, DEMU, RAJ"),
    session: Session = Depends(get_session),
):
    """Return all seeded trains, optionally filtered by type."""
    stmt = select(models.Train)
    if train_type:
        stmt = stmt.where(models.Train.train_type == train_type.upper())
    return session.exec(stmt).all()


@router.get("/stations", response_model=list[StationRead])
def list_stations(session: Session = Depends(get_session)):
    """Return all corridor stations."""
    return session.exec(select(models.Station).order_by(models.Station.code)).all()


@router.get("/affected", response_model=AffectedTrainsResponse)
def affected_trains(
    block_id: str = Query(..., description="Block ID to check, e.g. B-101"),
    session: Session = Depends(get_session),
):
    """Return trains whose section-pass window overlaps the given block's window.

    This replaces the guessed `conflictIds.length * 14 path-holds` estimate
    in ScenarioBar with a real count from the TrainSectionPass table.
    """
    block = session.get(models.Block, block_id)
    if block is None:
        raise HTTPException(404, f"Block '{block_id}' not found")

    block_end = block.start + block.dur

    # Find all section passes that overlap [block.start, block_end)
    passes = session.exec(
        select(models.TrainSectionPass).where(models.TrainSectionPass.sec == block.sec)
    ).all()

    overlapping = [
        p for p in passes
        if p.pass_start_h < block_end and (p.pass_start_h + p.pass_dur_h) > block.start
    ]

    # Unique train numbers
    train_numbers = list({p.train_number for p in overlapping})
    trains = session.exec(
        select(models.Train).where(models.Train.number.in_(train_numbers))
    ).all()
    train_map = {t.number: t for t in trains}

    affected = []
    for p in overlapping:
        t = train_map.get(p.train_number)
        if t:
            affected.append({
                "train_number": t.number,
                "train_name": t.name,
                "train_type": t.train_type,
                "from_name": t.from_name,
                "to_name": t.to_name,
                "pass_start_h": p.pass_start_h,
                "pass_dur_h": p.pass_dur_h,
                "overlap_h": round(
                    min(p.pass_start_h + p.pass_dur_h, block_end) - max(p.pass_start_h, block.start), 2
                ),
            })

    affected.sort(key=lambda x: x["pass_start_h"])

    return AffectedTrainsResponse(
        block_id=block_id,
        sec=block.sec,
        block_start_h=block.start,
        block_end_h=block_end,
        affected_count=len(affected),
        trains=affected,
    )


@router.get("/timetable", response_model=TimetableResponse)
def timetable(
    sec: Optional[str] = Query(None, description="Filter by section, e.g. NDLS–MTJ"),
    session: Session = Depends(get_session),
):
    """Return all TrainSectionPass rows (optionally filtered by section)
    joined with train name/type for the Timetable screen."""
    stmt = select(models.TrainSectionPass)
    if sec:
        stmt = stmt.where(models.TrainSectionPass.sec == sec)
    passes = session.exec(stmt.order_by(models.TrainSectionPass.sec, models.TrainSectionPass.pass_start_h)).all()

    train_numbers = list({p.train_number for p in passes})
    trains = session.exec(select(models.Train).where(models.Train.number.in_(train_numbers))).all()
    train_map = {t.number: t for t in trains}

    rows = []
    for p in passes:
        t = train_map.get(p.train_number)
        rows.append({
            "id": p.id,
            "train_number": p.train_number,
            "train_name": t.name if t else p.train_number,
            "train_type": t.train_type if t else "?",
            "from_name": t.from_name if t else "",
            "to_name": t.to_name if t else "",
            "sec": p.sec,
            "pass_start_h": p.pass_start_h,
            "pass_dur_h": p.pass_dur_h,
            "day": p.day,
        })

    sections = sorted({p.sec for p in passes})
    return TimetableResponse(sections=sections, rows=rows)


@router.get("/{number}", response_model=TrainRead)
def get_train(number: str, session: Session = Depends(get_session)):
    train = session.get(models.Train, number)
    if train is None:
        raise HTTPException(404, f"Train '{number}' not found")
    return train

