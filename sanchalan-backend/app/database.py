from sqlmodel import SQLModel, Session, create_engine, select

from .config import settings

connect_args = {"check_same_thread": False} if "sqlite" in settings.database_url else {}
engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def get_session():
    """FastAPI dependency — one session per request."""
    with Session(engine) as session:
        yield session


def init_db() -> None:
    """Create tables and seed them the first time the app boots.

    Idempotent: if a Block row already exists we assume the DB was seeded
    on a previous run and leave the data (and any changes made since) alone.
    """
    # Import models here so SQLModel.metadata knows about every table
    # before create_all runs.
    from . import models  # noqa: F401
    from .seed_data import (
        INITIAL_AUDIT,
        INITIAL_BLOCKS,
        INITIAL_FEED,
        INITIAL_QUEUE,
    )

    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        already_seeded = session.exec(select(models.Block)).first() is not None
        if already_seeded:
            return

        for row in INITIAL_BLOCKS:
            session.add(models.Block(**row))
        for row in INITIAL_QUEUE:
            session.add(models.QueueItem(**row))
        for time, color, text in INITIAL_FEED:
            session.add(models.FeedEvent(time=time, color=color, text=text))
        for row in INITIAL_AUDIT:
            session.add(models.AuditEntry(**row))

        session.commit()
