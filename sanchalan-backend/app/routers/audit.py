from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from .. import models
from ..database import get_session
from ..schemas import AuditEntryCreate, AuditEntryRead
from ..services.export_service import csv_response
from ..services.ops import log_audit

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("", response_model=list[AuditEntryRead])
def list_audit(limit: int = 200, session: Session = Depends(get_session)):
    rows = session.exec(
        select(models.AuditEntry).order_by(models.AuditEntry.created_at.desc()).limit(limit)
    ).all()
    return rows


@router.post("", response_model=AuditEntryRead, status_code=201)
async def create_audit_entry(payload: AuditEntryCreate, session: Session = Depends(get_session)):
    entry, _feed_event = await log_audit(session, payload.action, payload.detail, payload.by)
    return entry


@router.get("/export.csv")
def export_audit_csv(session: Session = Depends(get_session)):
    rows = session.exec(select(models.AuditEntry).order_by(models.AuditEntry.created_at.desc())).all()
    return csv_response(
        "sanchalan_audit_log.csv",
        ["time", "by", "action", "detail"],
        [[r.t, r.by, r.action, r.detail] for r in rows],
    )
