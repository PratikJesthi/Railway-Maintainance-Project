# SANCHALAN — Phase 2 patch: frontend wired to the real backend

10 files — 3 new, 7 edited. Everything else in your project (Sidebar, Toast,
SidePanel, ScenarioBar, ui/Card, and the CorridorTimeline/PriorityQueue/
ConflictResolution/AuditLog screens) is **unchanged** — their props/context
contract stayed identical on purpose, so they needed no edits.

## New files
```
src/api/client.js               apiFetch/apiJson (token attach, 401 handling), wsUrl()
src/context/AuthContext.jsx     login/logout/user/loading, backed by /api/auth/*
src/components/screens/Login.jsx   employee ID + password form
```

## Edited files
```
src/main.jsx                     wraps App in AuthProvider > AppProvider
src/App.jsx                      shows Login when logged out; loading/error
                                  states for the initial data fetch
src/context/AppContext.jsx       the core of this patch — see below
src/components/Topbar.jsx        shows logged-in user + logout button
src/components/screens/CommandCentre.jsx   KPI cards use the backend's
                                  pre-formatted man_display/ai_display
                                  instead of calling a fmt() function
                                  (functions can't cross JSON)
src/components/screens/Reports.jsx   fetches /api/reports/* instead of
                                  hardcoded arrays; export buttons unchanged
                                  (still generate CSV client-side, just from
                                  real fetched data now)
src/data/opsData.js               trimmed to DEPTS/SECTIONS/NOW_H/SIM_INJECT
                                  only — INITIAL_BLOCKS/QUEUE/FEED/AUDIT/KPIS
                                  are gone, replaced by the real fetch
```

## What AppContext.jsx actually does now

- **On login**: fetches `GET /api/bootstrap` once, hydrates blocks/queue/
  feed/audit/kpis/now_h/resolved from it.
- **Live feed**: opens `/ws/feed` and prepends incoming `feed`/`audit`
  messages to state, with auto-reconnect on drop.
- **Approve** → `PATCH /api/blocks/{id}` (sets status to Scheduled — see
  note below on why every write needs an actual field change).
- **Override** → `POST /api/audit` directly (doesn't need to touch a block).
- **Resolve conflict** → `POST /api/conflicts/resolve`, only wired for
  `C-1` — your backend's resolver doesn't generalise to the imported real
  conflicts (RB-*) yet, so those show as striped blocks on the timeline but
  aren't resolvable from the Conflict screen yet. Known gap, not fixed here.
- **Apply what-if scenario** → `PATCH /api/blocks/{id}` with the new
  `start`, then refetches the block list (the backend recomputes conflict
  flags for the whole section server-side, so a refetch is simpler and
  more correct than guessing the diff client-side).
- **24h simulation** — still entirely local/client-side, same as before.
  Your backend has no "advance simulated time" endpoint, so this stays a
  preview over whatever real blocks are already loaded; it writes nothing
  back. If you want this backed for real, that's a new backend endpoint,
  not a frontend change.

## One backend quirk worth knowing

`PATCH /api/blocks/{id}` only logs an audit entry if the request actually
changes a field — sending just `action`/`reason`/`by` with no real change is
a silent no-op server-side. That's why **Approve** always sets
`st: "Scheduled"` even if the block is already scheduled (harmless, and
semantically correct — approving *does* mean "now scheduled") — it's not
decorative, it's what makes the audit entry fire at all. Override sidesteps
this entirely by hitting `/api/audit` directly instead of pretending to
patch a block field.

## Setup

1. Copy these 10 files into your project at the same paths (overwrite).
2. Add a `.env` file (or `.env.local`) at the project root if your backend
   isn't at `http://localhost:8000`:
   ```
   VITE_API_BASE=http://127.0.0.1:8000
   ```
3. `npm run dev` — you should land on the login screen. Log in with the
   test user you created earlier (or create a fresh one via
   `hash_password()` + a one-off insert, same as the auth-patch README
   described).

Build-tested clean (`npm run build`, 847 modules, no errors). Every backend
call in this patch was also verified against your actual running backend
(bootstrap, all 4 report endpoints, approve/override/resolve/apply-scenario)
— not just written and assumed correct.
