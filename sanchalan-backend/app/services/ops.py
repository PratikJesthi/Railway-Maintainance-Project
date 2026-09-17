import re
from datetime import datetime

from sqlmodel import Session, select

from .. import models
from ..config import settings
from ..ws_manager import manager

IST_TIME_FMT = "%H:%M"
IST_AUDIT_FMT = "%d %b, %H:%M"


def _now_time_str() -> str:
    return datetime.now().strftime(IST_TIME_FMT)


def _now_audit_str() -> str:
    return datetime.now().strftime(IST_AUDIT_FMT)


async def push_feed(session: Session, text: str, color: str = "#0F7A73") -> models.FeedEvent:
    """Insert a feed row and broadcast it to any connected WebSocket clients.

    Mirrors AppContext.jsx's pushFeed(): newest first, trimmed to a max
    number of rows so the table doesn't grow forever.
    """
    event = models.FeedEvent(time=_now_time_str(), color=color, text=text)
    session.add(event)
    session.commit()
    session.refresh(event)

    # trim oldest rows beyond the cap
    rows = session.exec(
        select(models.FeedEvent).order_by(models.FeedEvent.created_at.desc())
    ).all()
    for stale in rows[settings.feed_max_rows:]:
        session.delete(stale)
    session.commit()

    await manager.broadcast({
        "channel": "feed",
        "time": event.time,
        "color": event.color,
        "text": event.text,
    })
    return event


async def log_audit(
    session: Session, action: str, detail: str, by: str = "Control User"
) -> tuple[models.AuditEntry, models.FeedEvent]:
    """Insert an audit row and mirror it into the feed, exactly like
    AppContext.jsx's logAudit() -> pushFeed() chain. Returns (entry, feed_event)
    since every audit write always produces a paired feed row.
    """
    entry_type = "warn" if re.search("OVERRIDE", action, re.IGNORECASE) else "ok"
    entry = models.AuditEntry(
        t=_now_audit_str(), by=by, action=action, detail=detail, type=entry_type
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)

    feed_event = await push_feed(session, f"📝 {action} — {detail}", "#B9812C")

    await manager.broadcast({
        "channel": "audit",
        "t": entry.t,
        "by": entry.by,
        "action": entry.action,
        "detail": entry.detail,
        "type": entry.type,
    })
    return entry, feed_event
