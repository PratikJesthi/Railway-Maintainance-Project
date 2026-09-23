# SANCHALAN — Product Requirements Document

## Product overview

SANCHALAN (संचालन — "operation / coordination") is an AI-assisted block planning
system for Indian Railways. It replaces the decentralized, manual way Engineering,
Traction Distribution, and Signal & Telecommunication departments currently request
maintenance possessions through BDMS with a single control-room view: one timeline,
one priority queue, one place conflicts get resolved and every decision gets logged.

## Problem statement

Each department (Engineering, TRD, S&T) requests maintenance blocks/disconnections
independently through BDMS. Nobody sees the full picture at once. Two departments
routinely request overlapping windows on the same section without knowing it until
it's discovered manually, late, or not at all. Planning is decentralized, manual,
and reactive — this leads to:

- Duplicate or conflicting possessions on the same section
- Lower asset availability for train operations than the maintenance backlog
  actually requires
- No transparent, defensible reason *why* one defect got a window before another
- No single record of who approved or overrode what, or why

## Goals

1. **Centralize** block requests from all three departments into one system of record.
2. **Surface conflicts automatically** — before they reach the track, not after.
3. **Rank maintenance need transparently** — every priority score shows its own
   breakdown (severity, overdue days, criticality, safety risk), not a black box.
4. **Maximize asset availability** — fewer duplicate/conflicting possessions,
   more of the real maintenance backlog cleared per week.
5. **Make every decision auditable** — AI auto-resolutions and human overrides are
   both logged, both explained, neither hidden.
6. **Let planners test before committing** — a what-if sandbox to preview a
   reschedule's downstream effect before it's applied to the live plan.

## Target users

| Role | Who | What they need from SANCHALAN |
|---|---|---|
| **Requester** | ENG / TRD / S&T department staff | Raise and track their own department's block requests; see only their own department's queue and timeline |
| **Controller** | Section Controller / Control Office | The primary user — full cross-department visibility, runs the planner, resolves conflicts, approves blocks, runs what-if scenarios |
| **Approver** | Sr. DEN / Sr. DOM / Sr. DSTE | Same visibility as controller, plus authority to override an AI-suggested resolution; overrides require a stated reason |
| **Viewer** | DRM / senior management | Read-only — Reports & Horizon Planning only, no scheduling authority |

## Core features

- **Command Centre** — system-wide KPIs (block-hours secured, overdue defects
  cleared, conflicts auto-resolved, asset availability), per-corridor utilisation,
  live ops feed
- **Corridor Timeline** — every planned block, per section, on a day/week/month view;
  click a block for detail, drag to reschedule in sandbox mode
- **Priority Queue** — ML-ranked defect list with a fully transparent score
  breakdown and a plain-language rationale per item
- **Conflict Resolution** — side-by-side view of overlapping requests, an AI-suggested
  resolution with its reasoning, one-click accept or manual override
- **What-if sandbox** — drag a block on the timeline to preview a reschedule's
  conflict/SLA impact before applying it; nothing is written until applied
- **24h simulation** — fast-forward the plan to see blocks complete, new defects
  arrive, and conflicts resolve, without waiting in real time
- **Reports & Horizon Planning** — utilisation, backlog trend, and compliance
  charts; weekly/monthly horizon toggle; CSV/PDF export
- **Audit Log** — append-only record of every AI action, approval, and override,
  each with who, when, and why
- **Login** — JWT-authenticated, role- and department-scoped access
