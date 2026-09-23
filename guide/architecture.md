# SANCHALAN — Architecture

## High-level architecture

```
┌─────────────────────┐        HTTPS/REST + JWT        ┌──────────────────────┐
│   React frontend     │ ─────────────────────────────▶ │   FastAPI backend     │
│   (Vite + Tailwind)  │ ◀───────────────────────────── │   (SQLModel + cache)  │
│                       │        WebSocket /ws/feed      │                       │
└─────────────────────┘ ◀───────────────────────────── └──────┬──────────┬──────┘
                                                               │          │
              ┌────────────────────────────────────────────────┘          └─────────────────────────┐
              ▼                                                                                       ▼
┌─────────────────────────────┐                                               ┌───────────────────────────┐
│  SQLite (default)            │                                               │  Redis 7 (standby)         │
│  — or —                      │                                               │  pub-sub / cache           │
│  PostgreSQL 16 (standby)     │                                               │  idle until Phase 3        │
│  flip SANCHALAN_DATABASE_URL │                                               └───────────────────────────┘
└─────────────────────────────┘

                          (planned, not yet built)
                                                          ┌──────────────────┐
                                                          │  CP-SAT solver    │
                                                          │  service          │
                                                          └──────────────────┘
```

A single-page React app talks to a FastAPI service over REST for everything
except the live ops feed, which streams over one WebSocket connection. The
backend is the only thing that talks to the database. A conflict-resolution
solver (OR-Tools CP-SAT) is planned as a service the backend calls into — not
yet implemented; today conflict resolution is a hand-coded merge rule.

## Tech stack

**Frontend**
- React 18, Vite
- Tailwind CSS (cream/cyan theme, IBM Plex Sans/Mono + Poppins)
- Recharts (Reports screen charts)
- React Context for state (no Redux) — `AppContext` for app data, `AuthContext`
  for session (planned)

**Backend**
- FastAPI
- SQLModel (SQLAlchemy + Pydantic combined) — flat `app/` module style, not a
  nested `models/`+`schemas/` package
- SQLite (default dev) **or** PostgreSQL 16 — switch by setting
  `SANCHALAN_DATABASE_URL`; both drivers installed, docker-compose runs Postgres
  with health-checks on port 5432
- JWT auth (`python-jose`), password hashing (`passlib[bcrypt]`)
- WebSocket (`ws_manager.py`) for the live feed
- `cache.py` — thin Redis 7 helper (standby; graceful no-op if Redis is down)

**Standby infrastructure (running, not yet wired into app logic)**
- Redis 7 (`redis:7-alpine`) — docker-compose service on port 6379; `cache.py`
  provides `get_redis()`, `cache_set/get/delete`; app degrades cleanly without it
- PostgreSQL 16 (`postgres:16-alpine`) — docker-compose service on port 5432;
  activated by setting `SANCHALAN_DATABASE_URL`; `sanchalan.db` stays untouched

**Planned, not yet built**
- OR-Tools CP-SAT for conflict resolution / schedule optimization
- Redis pub-sub wired into `ws_manager.py` for multi-worker WebSocket fan-out (Phase 3)
- TLS termination at the reverse proxy (deployment concern, not app code)

## Folder structure

**Frontend** (`sanchalan/`)
```
src/
  main.jsx                  entry point
  App.jsx                   layout + screen router
  index.css                 Tailwind base + theme tokens
  context/
    AppContext.jsx           app-wide state: nav, AI toggle, blocks, queue, feed,
                              audit, sandbox/scenario, simulation, approve/override
  data/
    opsData.js                mock data (being phased out as backend wiring lands)
  utils/
    time.js                   fmtWindow(), overlaps()
  components/
    Sidebar.jsx / Topbar.jsx / Toast.jsx / SidePanel.jsx / ScenarioBar.jsx
    ui/Card.jsx
    screens/
      CommandCentre.jsx
      CorridorTimeline.jsx
      PriorityQueue.jsx
      ConflictResolution.jsx
      Reports.jsx
      AuditLog.jsx
```

**Backend** (`sanchalan-backend/`)
```
app/
  config.py          Settings (database_url, CORS origins, JWT/secret settings)
  database.py         engine, get_session, init_db
  main.py              app instance, CORS, router registration
  models.py            SQLModel tables: Block, QueueItem, FeedEvent, AuditEntry,
                        User, UserDepartment
  schemas.py            Pydantic request/response shapes
  security.py            password hashing, JWT issue/verify, require_departments()/
                          require_role()
  seed_data.py           dev seed data (mirrors opsData.js shape)
  ws_manager.py           WebSocket connection manager
  routers/
    auth.py               POST /api/auth/login, GET /api/auth/me
    blocks.py, queue.py, feed.py, audit.py, kpis.py, reports.py,
    conflicts.py, bootstrap.py, meta.py, ws.py
  services/
    conflict_service.py    conflict detection/resolution logic
    ops.py                  shared helpers (log_audit, push_feed)
    export_service.py       CSV export helpers
```

## Key flows

**Login**
1. Frontend posts `{employee_id, password}` to `/api/auth/login`
2. Backend verifies hash, returns `{access_token, user: {role, departments}}`
3. Frontend stores the token, attaches `Authorization: Bearer <token>` to every
   subsequent request, and uses `role`/`departments` to decide what's visible
   (e.g. a requester's Priority Queue is filtered to their department)

**Block request → conflict → resolution**
1. A block request lands (via BDMS/SMMS/TDMS ingestion, or entered directly)
2. `conflict_service` checks for overlapping requests on the same section
3. If a conflict is found, it's surfaced on the Conflict Resolution screen with
   an AI-suggested resolution (merge / re-sequence / split) and its rationale
4. A controller accepts the suggestion, or an approver overrides it with a
   reason — either way, `log_audit()` writes an entry and `push_feed()` posts
   to the live feed

**What-if sandbox**
1. Controller drags a block on the Corridor Timeline (sandbox mode only)
2. The drop computes a scenario (new start time) client-side — nothing is sent
   to the backend yet
3. The floating scenario bar shows conflict delta / SLA impact, computed
   against the currently loaded blocks
4. "Apply" commits the change (write) and logs it; "Discard" throws it away

**Live feed**
1. Backend pushes feed events over `/ws/feed` as they happen (block approved,
   conflict detected, AI auto-resolution, etc.)
2. Frontend's Command Centre screen renders the feed in real time — not yet
   wired; currently the feed is client-side simulated in `AppContext`
