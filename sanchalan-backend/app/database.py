import logging
from typing import Generator

from sqlalchemy.exc import DatabaseError, OperationalError
from sqlmodel import SQLModel, Session, create_engine, select

from .config import settings

log = logging.getLogger(__name__)

# Primary Engine (PostgreSQL or configured database_url)
primary_kwargs = {}
if "postgresql" in settings.database_url or "postgres" in settings.database_url:
    primary_kwargs = {
        "pool_pre_ping": True,
        "connect_args": {"connect_timeout": 3},
    }
elif "sqlite" in settings.database_url:
    primary_kwargs = {"connect_args": {"check_same_thread": False}}

primary_engine = create_engine(settings.database_url, echo=False, **primary_kwargs)

# Standby / Fallback Engine (SQLite)
fallback_kwargs = {"check_same_thread": False} if "sqlite" in settings.fallback_database_url else {}
fallback_engine = create_engine(settings.fallback_database_url, echo=False, connect_args=fallback_kwargs)


def get_active_engine():
    """Check primary database health; failover to SQLite fallback if primary is down."""
    try:
        with primary_engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        return primary_engine
    except Exception as exc:
        log.warning("⚠️ Primary DB (%s) unreachable: %s. Failing over to SQLite standby.", settings.database_url, exc)
        return fallback_engine


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency — yield session from active DB (PostgreSQL with auto-failover to SQLite)."""
    engine = get_active_engine()
    try:
        with Session(engine) as session:
            yield session
    except (OperationalError, DatabaseError) as exc:
        log.warning("⚠️ Error executing on primary DB (%s), falling back to SQLite standby: %s", engine.url, exc)
        with Session(fallback_engine) as fallback_session:
            yield fallback_session


def _seed_engine(engine) -> None:
    """Helper to seed initial tables and data for a given engine."""
    from . import models  # noqa: F401
    from .security import hash_password
    from .seed_data import (
        INITIAL_AUDIT,
        INITIAL_BLOCKS,
        INITIAL_FEED,
        INITIAL_QUEUE,
        INITIAL_USERS,
    )

    SQLModel.metadata.create_all(engine)

    try:
        with Session(engine) as session:
            # Seed users if none exist
            if session.exec(select(models.User)).first() is None:
                for u_info in INITIAL_USERS:
                    u = models.User(
                        employee_id=u_info["employee_id"],
                        name=u_info["name"],
                        hashed_password=hash_password(u_info["password"]),
                        role=u_info["role"],
                        is_active=True,
                    )
                    session.add(u)
                    session.commit()
                    session.refresh(u)
                    for d_code in u_info["departments"]:
                        session.add(models.UserDepartment(user_id=u.id, dept=d_code))
                    session.commit()

            already_seeded = session.exec(select(models.Block)).first() is not None
            if already_seeded:
                return

            for row in INITIAL_BLOCKS:
                session.add(models.Block(**row))
            for row in INITIAL_QUEUE:
                session.add(models.QueueItem(**row))
            for time, color, text in INITIAL_FEED:
                session.add(models.FeedEvent(time=time, color=color, text=text))
            for time_val, by_val, act, det, typ in [
                ("10:00", "System", "DB SEEDED", f"Seeded database via {engine.dialect.name}", "ok")
            ]:
                session.add(models.AuditEntry(t=time_val, by=by_val, action=act, detail=det, type=typ))

            session.commit()
            log.info("Successfully initialized & seeded database engine (%s)", engine.url)
    except Exception as exc:
        log.warning("Failed to seed database engine (%s): %s", engine.url, exc)


def init_db() -> None:
    """Create identical tables and seed both primary (PostgreSQL) and fallback (SQLite) databases on boot."""
    # Always ensure SQLite standby DB is prepped and identical
    _seed_engine(fallback_engine)

    # If primary is separate, initialize and seed primary PostgreSQL as well
    if settings.database_url != settings.fallback_database_url:
        try:
            _seed_engine(primary_engine)
        except Exception as exc:
            log.warning("⚠️ Primary PostgreSQL could not be initialized on boot (%s). System will use SQLite standby.", exc)

