# SANCHALAN — Rules

Rules for anyone (human or AI) working on this codebase. This file governs
*how* to work on SANCHALAN — what exists and why lives in `architecture.md`;
this file is about standards and behavior when changing it.

## General principles

1. **Patch, don't replace.** This project has real, working code with real
   history. Never propose wholesale-replacing a folder. Identify the exact
   files that need to change and edit only those.
2. **Match the codebase's actual conventions, not the "better" alternative.**
   The backend is deliberately flat (`app/models.py`, not `app/models/`) and
   uses SQLModel, not raw SQLAlchemy. New code follows that, even if a
   different structure is arguably more scalable — consistency with what's
   already there beats a locally "nicer" pattern.
3. **Verify before delivering.** Any backend change gets syntax-checked and,
   where feasible, actually booted and hit with a real request before being
   handed over. "Looks right" is not the bar.
4. **Flag what you find, fix what's in scope.** If you find a pre-existing bug
   in a file you're already editing for another reason, fix it and say so
   explicitly. Don't go fix unrelated files just because you noticed something.
5. **Additive over exploratory.** Prefer small, reviewable diffs to large
   speculative rewrites. If a change touches more than a handful of files,
   say so before doing it, not after.
6. **No feature is "done" until it's connected.** A backend endpoint nothing
   calls, or a UI that only reads mock data, is not finished — it's staged.
   Say clearly which state a piece of work is in.
7. **Scope discipline.** Build the smallest version of a phase that's real
   (Phase 1 domain schema over a 70-table upfront design, one `scenarios`
   table over a full propagation-event system) and expand only when a
   specific feature actually needs the next layer. See `tasks.md` for the
   current phase boundaries.

## Technology & coding standards

**Frontend**
- Functional components + hooks only. No class components.
- One React Context (`AppContext`) for app-wide state; don't introduce Redux
  or a second state library.
- Tailwind utility classes for styling; inline `style={}` only for values that
  must be computed at runtime (e.g. a block bar's `left`/`width` percentage,
  a department's hex color). No separate CSS-in-JS library.
- One screen = one file under `components/screens/`. Shared chrome
  (Sidebar/Topbar/Toast/SidePanel) stays in `components/`.
- Every user-facing action that changes state (approve, override, apply
  scenario, resolve conflict) writes to the audit log and shows a toast —
  no silent state changes.

**Backend**
- SQLModel tables in `models.py`, Pydantic-only schemas in `schemas.py`. A
  table gets a matching `*Read`/`*Create`/`*Update` schema, not raw model
  objects returned from routes.
- Route handlers stay thin — business logic goes in `services/`, not inline
  in `routers/`.
- Every protected route takes `Depends(get_current_user)` at minimum; routes
  scoped to specific departments or roles use `require_departments()` /
  `require_role()` from `security.py` rather than ad-hoc checks.
- Timestamps are timezone-aware (`datetime.now(timezone.utc)`), never
  `datetime.utcnow()` — SQLAlchemy 2.x rejects naive datetimes on write.
- Dependency versions that are known-fragile get pinned with a comment
  explaining why (e.g. `bcrypt==4.0.1` — newer versions break `passlib`).

## Project structure rules

- New frontend screens: add to `components/screens/`, register in
  `SCREEN_COMPONENTS` in `App.jsx`, add an entry to `SCREENS` in
  `AppContext.jsx`. Don't invent a second routing mechanism.
- New backend resources: one router per resource under `app/routers/`,
  registered in `main.py`. Shared logic used by more than one router goes in
  `app/services/`, not duplicated across routers.
- New database tables go in `models.py` (this project does not split models
  across files per domain — see the "flat app/" convention above).
- Naming stays Indian-Railways-flavoured where the original design set that
  precedent (SANCHALAN branding, Hindi nav subtitles, role names like Sr. DEN)
  — don't genericize existing naming without being asked.
- Anything not yet built (CP-SAT solver, Postgres switch, Redis, frontend↔
  backend data wiring) stays out of `models.py`/`AppContext.jsx` until its
  task in `tasks.md` is actually started — no speculative scaffolding ahead
  of need.
