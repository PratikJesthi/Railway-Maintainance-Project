"""cache.py — thin Redis helper.

Usage
-----
    from .cache import get_redis

    r = get_redis()
    if r:
        r.set("key", "value", ex=60)
        val = r.get("key")

The app works without Redis.  If the connection fails (Redis not running,
wrong URL, etc.) ``get_redis()`` returns ``None`` and callers should degrade
gracefully.  No exception is ever raised to the caller.

Future
------
- Phase 3 WebSocket pub-sub: upgrade to ``redis.asyncio.Redis`` for async fan-out
- Phase 5 route-level caching: wrap common read endpoints
"""

from __future__ import annotations

import logging
from functools import lru_cache

import redis

from .config import settings

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Connection
# ---------------------------------------------------------------------------


@lru_cache(maxsize=1)
def _make_client() -> redis.Redis | None:
    """Create (and cache) one Redis client for the process lifetime.

    Returns ``None`` if Redis is unreachable so callers can skip gracefully.
    ``decode_responses=True`` means values come back as ``str``, not ``bytes``.
    """
    try:
        client = redis.Redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=2,   # fail fast in dev if Redis isn't up
            socket_timeout=2,
        )
        client.ping()   # verify the connection is actually live
        log.info("Redis connected: %s", settings.redis_url)
        return client
    except Exception as exc:  # noqa: BLE001
        log.warning("Redis unavailable (%s) — caching disabled.", exc)
        return None


def get_redis() -> redis.Redis | None:
    """Return the shared Redis client, or *None* if Redis is not reachable.

    Safe to call on every request — the underlying client is created once and
    cached for the lifetime of the process.
    """
    return _make_client()


# ---------------------------------------------------------------------------
# Convenience helpers (optional — add more as needed)
# ---------------------------------------------------------------------------


def cache_set(key: str, value: str, ttl_seconds: int = 300) -> bool:
    """Set *key* → *value* with an expiry.  Returns ``True`` on success."""
    r = get_redis()
    if r is None:
        return False
    try:
        r.set(key, value, ex=ttl_seconds)
        return True
    except Exception as exc:  # noqa: BLE001
        log.warning("Redis SET failed for key=%s: %s", key, exc)
        return False


def cache_get(key: str) -> str | None:
    """Retrieve *key* from Redis.  Returns ``None`` on miss or error."""
    r = get_redis()
    if r is None:
        return None
    try:
        return r.get(key)
    except Exception as exc:  # noqa: BLE001
        log.warning("Redis GET failed for key=%s: %s", key, exc)
        return None


def cache_delete(key: str) -> None:
    """Delete *key* from Redis (best-effort, no error raised)."""
    r = get_redis()
    if r is None:
        return
    try:
        r.delete(key)
    except Exception:  # noqa: BLE001
        pass
