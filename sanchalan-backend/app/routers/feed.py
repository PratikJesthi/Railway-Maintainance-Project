from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from .. import models
from ..config import settings
from ..database import get_session
from ..schemas import FeedEventCreate, FeedEventRead
from ..services.ops import push_feed

router = APIRouter(prefix="/api/feed", tags=["feed"])


@router.get("", response_model=list[FeedEventRead])
def list_feed(limit: int = settings.feed_default_limit, session: Session = Depends(get_session)):
    rows = session.exec(
        select(models.FeedEvent).order_by(models.FeedEvent.created_at.desc()).limit(limit)
    ).all()
    return rows


@router.post("", response_model=FeedEventRead, status_code=201)
async def create_feed_event(payload: FeedEventCreate, session: Session = Depends(get_session)):
    return await push_feed(session, payload.text, payload.color)
