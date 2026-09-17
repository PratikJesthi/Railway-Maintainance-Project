# SANCHALAN — Automatic Block Planning Dashboard

A React + Tailwind rebuild of the rail Automatic Block Planning ops dashboard,
restyled in a cream & cyan palette with Indian-Railways-flavoured naming.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## Structure

```
src/
  main.jsx                  entry point
  App.jsx                   layout + screen router
  index.css                 Tailwind base + theme tweaks
  context/AppContext.jsx    global state (nav, AI toggle, blocks, audit log, toasts)
  data/opsData.js           mock departments, sections, blocks, queue, feed, audit log
  components/
    Sidebar.jsx              left nav ("SANCHALAN")
    Topbar.jsx               screen title + AI/Manual toggle + clock
    Toast.jsx                toast notifications
    SidePanel.jsx            slide-in block detail panel
    ui/Card.jsx              shared card primitive
    screens/
      CommandCentre.jsx        Screen 1 — KPIs, utilisation, live feed
      CorridorTimeline.jsx     Screen 2 — block timeline per section
      PriorityQueue.jsx        Screen 3 — ML-ranked defect queue
      ConflictResolution.jsx   Screen 4 — accept / override conflicting blocks
      Reports.jsx              Screen 5 — charts (recharts) + CSV/PDF export
      AuditLog.jsx             Screen 6 — append-only audit trail + CSV export
```

## Design notes

- **Palette** — warm cream background (`#FDFBF5` / `#F8F2E3`) with a teal-cyan
  accent (`#0F7A73` / `#3AACA3`) in place of the original's dark navy theme.
  Department colours (Engineering / Traction / S&T / Combined) were re-tuned to
  sit comfortably on cream while staying distinguishable.
- **Naming** — rebranded from "ABP" to **SANCHALAN** (संचालन — "operation /
  coordination"), with Hindi subtitles on nav items and Indian-Railways-style
  role names in the audit log (Sr. DEN, Sr. DOM). Station/section codes (NDLS,
  MTJ, AGC, GWL, JHS, BPL, ET) and source systems (SMMS, TDMS, BDMS, COA) are
  kept as-is — they were already authentic Indian Railways references.
- **Structure** — split into one component per screen plus shared layout/UI
  pieces, with a single `AppContext` for cross-screen state instead of the
  original's global variables and DOM-manipulation functions.

## What didn't carry over

The original single-file HTML had a full 24h play-through simulator and a
draggable/resizable sandbox mode for editing block bars directly on the
timeline. Those were left out here to keep the component split clean — the
`AppContext` (`resolveConflict`, `logAudit`, `pushFeed`) is structured so
either could be added back as a new hook without touching the screens.
