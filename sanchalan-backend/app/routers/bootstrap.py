from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from .. import models
from ..config import settings
from ..database import get_session
from ..schemas import BootstrapResponse
from ..seed_data import DEPTS, SECTIONS
from .kpis import list_kpis
from .queue import list_queue

router = APIRouter(prefix="/api", tags=["bootstrap"])


@router.get("/bootstrap", response_model=BootstrapResponse)
def bootstrap(session: Session = Depends(get_session)):
    """Everything AppContext.jsx needs to hydrate on first load, in one
    round trip: depts, sections, blocks, queue, feed, audit, kpis, the
    sim clock, and whether the C-1 conflict has been resolved.
    """
    blocks = session.exec(select(models.Block).order_by(models.Block.sec, models.Block.start)).all()
    feed = session.exec(
        select(models.FeedEvent).order_by(models.FeedEvent.created_at.desc()).limit(settings.feed_default_limit)
    ).all()
    audit = session.exec(select(models.AuditEntry).order_by(models.AuditEntry.created_at.desc())).all()
    resolved = session.get(models.Block, "B-301+302") is not None

    return BootstrapResponse(
        depts=DEPTS,
        sections=SECTIONS,
        blocks=blocks,
        queue=list_queue(session=session),
        feed=feed,
        audit=audit,
        kpis=list_kpis(),
        now_h=settings.now_h,
        resolved=resolved,
    )
