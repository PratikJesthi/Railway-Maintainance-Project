from typing import Optional

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from .. import models
from ..database import get_session
from ..schemas import QueueItemRead

router = APIRouter(prefix="/api/queue", tags=["queue"])


@router.get("", response_model=list[QueueItemRead])
def list_queue(
    dept: Optional[str] = None,
    st: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """ML-ranked defect queue, sorted by score (severity) descending —
    same ordering PriorityQueue.jsx computes client-side."""
    query = select(models.QueueItem)
    if dept:
        query = query.where(models.QueueItem.dept == dept)
    if st:
        query = query.where(models.QueueItem.st == st)
    rows = session.exec(query).all()
    rows.sort(key=lambda q: q.sev, reverse=True)
    return [QueueItemRead(**row.model_dump(), total=row.total) for row in rows]
