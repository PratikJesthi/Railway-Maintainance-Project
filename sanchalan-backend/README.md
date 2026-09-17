# SANCHALAN — FastAPI backend

Backend for the `sanchalan-abp-dashboard` React app. Serves the exact data
shapes `AppContext.jsx` / `opsData.js` currently hardcode, backed by SQLite,
plus the write actions the UI already has hooks for (`resolveConflict`,
`logAudit`, `pushFeed`) as real endpoints.

## Run it

```bash
python3 -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Docs at `http://localhost:8000/docs` (Swagger) or `/redoc`.
First run creates `sanchalan.db` (SQLite) and seeds it from `app/seed_data.py`
— a Python port of `opsData.js`. Delete the file to reset to the seed state.

## Wiring it into the frontend

The frontend currently has no API calls at all — `AppContext` initializes
straight from `opsData.js`. To point it at this backend:

1. `GET /api/bootstrap` returns everything `AppProvider`'s `useState` calls
   need in one shot — swap the `INITIAL_*` imports for one `fetch` on mount.
2. Replace `resolveConflict`, `logAudit`, `pushFeed` with calls to
   `POST /api/conflicts/resolve`, `POST /api/audit`, `POST /api/feed` — each
   already returns the row the UI needs to append to local state, or you can
   just re-fetch `/api/feed` and `/api/audit`.
3. Optional: open `new WebSocket("ws://localhost:8000/ws/feed")` and push
   incoming `{channel: "feed"|"audit", ...}` messages into state instead of
   polling — this replaces the "simulated push" the feed panel currently
   labels itself with.

Set `SANCHALAN_CORS_ORIGINS` (see `app/config.py`) if the frontend isn't on
`localhost:5173`.

## Endpoint map

| Screen               | Endpoints |
|-----------------------|-----------|
| (bootstrap)            | `GET /api/bootstrap` |
| Command Centre         | `GET /api/kpis`, `GET /api/feed`, `GET /api/blocks` (for corridor utilisation), `GET /api/meta/now` |
| Corridor Timeline      | `GET /api/blocks`, `GET /api/meta/sections`, `GET /api/meta/depts` |
| Priority Queue         | `GET /api/queue?dept=&st=` |
| Conflict Resolution    | `GET /api/conflicts`, `POST /api/conflicts/resolve` |
| Reports                | `GET /api/reports/utilization`, `/backlog-trend`, `/compliance`, `/summary`, `/export/summary.csv`, `/export/backlog.csv` |
| Audit Log              | `GET /api/audit`, `POST /api/audit`, `GET /api/audit/export.csv` |
| — (block CRUD)         | `POST /api/blocks` (auto conflict-detects overlaps in the same section), `PATCH /api/blocks/{id}` (writes an audit entry), `DELETE /api/blocks/{id}` |
| — (live push)          | `WS /ws/feed` |

## What's real vs. mocked

- **Blocks, queue, feed, audit**: live in SQLite, fully CRUD-backed.
- **Conflict merge (C-1)**: the seed data ships one hardcoded conflict
  (`B-301` vs `B-302`) that `POST /api/conflicts/resolve` merges into
  `B-301+302` — this mirrors the frontend's original `resolveConflict()`,
  which was written for this one demo conflict. New overlapping blocks
  created via `POST /api/blocks` are auto-flagged (`conflict: true`) but
  resolved by editing one block's window/status via `PATCH`, not the merge
  endpoint.
- **Reports → utilisation / summary**: computed live from the `blocks` and
  `audit` tables.
- **Reports → backlog trend / compliance**: no historical backlog table
  exists yet, so these stay deterministic mock series (same numbers the
  frontend already renders) — swap in real queries once there's a source
  for them.
- **KPI man/ai numbers**: still the original mock figures (`app/seed_data.py:KPI_DEFS`)
  — nothing in the current data model distinguishes an "AI-planned" week
  from a manual one, so these weren't worth faking a computation for.

## Structure

```
app/
  main.py              FastAPI app, CORS, router wiring, lifespan (init_db)
  config.py             Settings (CORS origins, DB URL, sim clock)
  database.py            Engine/session, seed-on-first-boot
  models.py               SQLModel tables: Block, QueueItem, FeedEvent, AuditEntry
  schemas.py               Pydantic request/response models
  seed_data.py              Python port of opsData.js
  ws_manager.py              WebSocket broadcast hub for /ws/feed
  routers/
    meta.py, blocks.py, queue.py, feed.py, audit.py,
    kpis.py, reports.py, conflicts.py, bootstrap.py, ws.py
  services/
    ops.py                push_feed() / log_audit() — shared writers, audit
                          entries always mirror into the feed
    conflict_service.py    overlap detection + the C-1 merge
    export_service.py      CSV StreamingResponse helper
```
