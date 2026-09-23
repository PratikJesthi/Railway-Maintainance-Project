# SANCHALAN — Tasks

Independent chunks of work. Each is scoped to be doable without the others
being finished first, except where a dependency is explicitly noted. Status
reflects what's actually been built and verified as of this file's writing.

## Phase 0 — Frontend rebuild
**Status: done**
- [x] React + Tailwind rebuild of the original single-file HTML dashboard
- [x] Cream/cyan theme, Indian-style naming (SANCHALAN)
- [x] All 6 screens split into components, shared `AppContext`
- [x] What-if sandbox (drag-to-reschedule + scenario preview bar)
- [x] 24h simulation (block status progression, live defect injection,
      auto-resolve)
- [x] Side panel Approve/Override actions

## Phase 1 — Backend auth
**Status: done**
- [x] Identified real backend structure (flat `app/`, SQLModel, SQLite/Postgres,
      existing REST + WebSocket — corrected an earlier wrong assumption about
      its layout)
- [x] `User` + `UserDepartment` models, JWT issue/verify, password hashing
- [x] `POST /api/auth/login`, `GET /api/auth/me`
- [x] `require_departments()` / `require_role()` guards
- [x] Fixed pre-existing `datetime.utcnow()` bug blocking fresh installs
- [x] End-to-end tested (login, me, wrong password, no token, existing
      routes unaffected)
- [ ] Not done: seeding real users (only a manual one-off test user exists)

## Phase 2 — Frontend ↔ backend wiring
**Status: not started — next up**
- [ ] `AuthContext.jsx` (login/logout, token storage, current user)
- [ ] `Login.jsx` screen, shown when unauthenticated
- [ ] `api/client.js` — fetch wrapper attaching the JWT, handling 401 →
      logout
- [ ] Replace `opsData.js` static imports in `AppContext.jsx` with real
      fetches to `/api/blocks`, `/api/queue`, `/api/feed`, `/api/audit`,
      `/api/kpis`, `/api/reports`, `/api/conflicts`
- [ ] Gate UI actions (Approve/Override, dept-filtered queue) by the logged-in
      user's `role`/`departments`
- Depends on: Phase 1

## Phase 3 — Live feed over WebSocket
**Status: not started**
- [ ] Frontend connects to `/ws/feed` on login, replaces the client-simulated
      feed in `AppContext`
- [ ] Reconnect/backoff handling
- Depends on: Phase 2 (needs the authenticated session first)

## Phase 4 — Database: Postgres + real seed data
**Status: standby ready — Postgres + Redis containers available; seed work not started**
- [x] `SANCHALAN_DATABASE_URL` drives both SQLite and Postgres — same code, flip 1 env var
- [x] `psycopg2-binary` driver installed (requirements.txt)
- [x] `redis` driver installed; `cache.py` helper with graceful fallback added
- [x] `docker-compose.yml` — `postgres:16-alpine` + `redis:7-alpine` services with
      health-checks and persistent volumes; backend receives URLs via env vars
- [x] `.env.example` — documents SQLite (default) and Postgres alternates
- [ ] Seed `stations`/corridor data for one real corridor (not all 8,990
      stations from the raw dataset)
- [ ] Import a slice of the v2 conflict-pair dataset as real seed `Block`
      rows with genuine overlapping requests, replacing hand-written mock
      conflicts
- Depends on: Phase 1 (schema must be stable)

## Phase 5 — CP-SAT conflict/scheduling solver
**Status: not started**
- [ ] Standalone solver service: given overlapping block requests on a
      section, output merge / re-sequence / split + a stated rationale
- [ ] Wire into `conflict_service.py` in place of the current hand-coded
      merge rule
- [ ] Priority scoring feeds the objective function
- Depends on: Phase 4 (needs real conflict data to validate against)

## Phase 6 — Data pipeline integration
**Status: integration pending**
- [ ] Map v1/v2/v3 synthetic datasets' "logical corridor" concept onto real
      `sections`/`assets` tables (the data pipeline's own reports call this
      out as pending "Stage-6 infrastructure data")
- [ ] Decide what, if anything, from the trusted 376,928-movement dataset
      feeds the live system vs. stays a solver validation set
- No active sub-tasks right now — data pipeline owner has no further time
  for this dataset; revisit only when Phase 4/5 need it

## Phase 7 — Deployment
**Status: not started**
- [ ] TLS termination (reverse proxy config)
- [ ] Production CORS origins
- [ ] Environment-based secrets (`SECRET_KEY` etc. — currently a dev default)
- Depends on: Phase 2 at minimum (no point deploying a backend the frontend
  doesn't use yet)

## Explicitly deferred (not phased — revisit only if a feature needs it)
- Full Train & Timetable schema (individual train modeling)
- Full 12-domain "RAILOPT-AI" schema beyond what Phase 1/4 actually use
- SUMO-based simulation (flagged as possibly the wrong tool for rail — road
  simulator by origin)
- Redis pub-sub wired into `ws_manager.py` — standby helper (`cache.py`) is
  in place; upgrade `ConnectionManager` to use Redis pub-sub when multi-worker
  WebSocket fan-out is actually needed (Phase 3+)
