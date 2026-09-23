# SANCHALAN — Project Log

Running log of decisions made, bugs found, and things to remember. This is a
history/notes file, not a task tracker — see `tasks.md` for current work
broken into chunks.

## Decision log

- **Rebuild base**: started from a single-file HTML "Automatic Block
  Planning" dashboard; rebuilt as React + Tailwind, split into components,
  restyled cream/cyan, renamed to SANCHALAN.
- **Auth model**: chose JWT with department/role as token claims, one login
  screen — rejected per-department separate login flows. Departments are a
  permission scope, not a separate identity system; a controller needs
  cross-department visibility, which per-department logins would fight.
- **Role model locked**: 4 roles — requester (own dept), controller (all
  depts, approve), approver/Sr. DEN-DOM-DSTE (all depts, approve + override),
  viewer (read-only, Reports only). Chosen against the actual SIH-style
  problem statement's description of how ENG/TRD/S&T currently request
  through BDMS.
- **Database sequencing**: domain schema before auth, not the other way
  around — auth is a thin, mostly-isolated layer; the domain model touches
  everything downstream, so get it stable first.
- **12-domain "RAILOPT-AI" schema reviewed and deliberately trimmed.** The
  full drafted schema (~70 tables across Identity, Geography, Timetable,
  Assets, Requests, Block Planning, Optimization, Simulation, Execution,
  Dashboard, Governance, Data Engineering) was assessed as too large for
  solo/project-timeline execution. Scoped down to ~14 Phase-1 tables covering
  only what the 6 dashboard screens + login actually need. Sections deferred,
  not dropped — see `tasks.md` "Explicitly deferred."
- **First backend schema attempt (B2) was wrong.** Built a nested
  `app/models/`+`app/core/` RBAC/geography schema in raw SQLAlchemy *before*
  seeing the actual backend repo. The real backend (B1) uses a flat `app/`
  layout with SQLModel and a schema that mirrors the frontend's mock data
  shapes directly (`Block`, `QueueItem`, `FeedEvent`, `AuditEntry` — no
  separate stations/assets/defects tables). B2 was discarded entirely; the
  real auth patch (B3) was rewritten from scratch to match B1's actual
  conventions.
- **SUMO flagged as a possible wrong tool** — it's a road-traffic
  microsimulator by origin; rail signaling support exists but isn't its core
  strength. Not rejected outright, but flagged to gut-check before investing
  time, since a lighter custom event-based simulator may serve the what-if/
  24h-sim use case better per hour of effort.

## Bugs found and fixed

- **`passlib`/`bcrypt` version conflict** — `bcrypt>=4.1` removed an
  attribute `passlib==1.7.4` reads at import time, causing a crash on
  `hash_password()`/`verify_password()`. Fixed by pinning `bcrypt==4.0.1` in
  `requirements.txt`. Caught by actually running the auth flow, not just
  syntax-checking.
- **Pre-existing `datetime.utcnow()` bug in the real backend**, unrelated to
  auth — SQLAlchemy 2.0.54 (pulled in by `sqlmodel==0.0.22`) rejects naive
  datetimes on insert. `init_db()` would have crashed on any fresh install.
  Affected `Block`, `FeedEvent`, `AuditEntry`, and the new `User` model.
  Fixed by switching every `default_factory=datetime.utcnow` to
  `default_factory=lambda: datetime.now(timezone.utc)`.

## Open questions / things to revisit

- Requester role: are department block requests ever hand-entered by a human
  requester, or do they always arrive via BDMS/SMMS/TDMS ingestion? Decides
  whether "requester" needs a real login at all, or just read access.
- Whether Sr. DEN/DOM/DSTE (approver) and Section Controller (controller)
  genuinely need to stay separate roles, or whether one role with an
  "override requires a reason" rule already covers the real distinction —
  the audit log already treats them differently (Control User approves,
  Sr. DEN/DOM overrides).
- Postgres switch timing — `database_url` supports it today via config, but
  no migration/seed work against real Postgres has happened yet (Phase 4).

## Future work (not yet scheduled into a phase)

- Redis for live feed at scale / refresh-token state — explicitly not added
  preemptively; add when polling/WebSocket actually hits a real limit.
- Mapping the data pipeline's "logical corridor" concept (v2/v3 synthetic
  datasets) onto real `sections`/`assets` — the pipeline's own reports flag
  this as pending "Stage-6 infrastructure data," not yet started on either
  side.
- TLS/production deployment config — infra concern, deliberately last.

## Data pipeline status (external to this app, frozen)

A separate, already-completed data pipeline (RAILOPT-AI) exists independently
on the rail/data , audit folder has nearly all reports and each synthetic folder
 has its own report too : real Indian Railways data (8,990 stations, 5,208
routes, 417,080 schedule records, 386,819 GPS movements) cleaned and
validated to a 97.44% trusted set, plus synthetic v1 (disruptions), v2
(multi-train conflicts), v3 (cascading disruptions) datasets with ground-truth
labels. No further work planned on this dataset — treat all of it as a
read-only input for whenever Phase 4/5 need real conflict data or solver
validation data.
