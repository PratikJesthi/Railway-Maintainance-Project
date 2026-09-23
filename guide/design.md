# SANCHALAN — Design System

## Design principles

- **Warm control room, not a dark ops terminal.** Most rail/industrial
  dashboards default to dark navy. SANCHALAN deliberately inverts that —
  a warm cream base reads calmer over a long shift and lets department
  colors carry the information instead of glowing against black.
- **Every color means something.** Department colors, conflict striping,
  status pills — color is never decorative here. If a color is used, it's
  encoding data.
- **Transparency over polish.** The priority queue's score breakdown, the
  conflict screen's stated rationale, the audit log's plain-language
  detail — the design favors showing *why*, not just showing a clean number.
- **Density with breathing room.** This is a professional tool used all
  day, not a marketing surface — tables and timelines stay information-dense,
  but padding and hierarchy keep it from feeling cramped.
- **Indian Railways-flavoured, not costume.** Hindi subtitles, role names,
  and real station/corridor codes are used because they're accurate to the
  domain, not as decoration.

## Color palette

**Base (cream)**
| Token | Hex | Use |
|---|---|---|
| `cream-50` | `#FDFBF5` | Page background |
| `cream-100` | `#F8F2E3` | Panel/card background, sidebar |
| `cream-200` | `#F0E7CE` | Borders, muted dividers |
| `cream-300` | `#E4D6AF` | Stronger borders, scrollbar thumb |
| `cream-400` | `#CDB97C` | Rarely used — heaviest cream accent |

**Ink (text)**
| Token | Hex | Use |
|---|---|---|
| `ink-900` | `#2B2A22` | Primary text |
| `ink-700` | `#4A4838` | Secondary text |
| `ink-500` | `#7A7460` | Muted/label text |
| `ink-300` | `#A9A28A` | Disabled/placeholder |

**Accent (cyan/teal)**
| Token | Hex | Use |
|---|---|---|
| `cyan-50`–`cyan-100` | `#EAF7F6` / `#D2EFEC` | Light accent backgrounds (active nav, badges) |
| `cyan-400`–`cyan-500` | `#3AACA3` / `#1D8F88` | Chart bars, utilisation bars |
| `cyan-600`–`cyan-700` | `#0F7A73` / `#0B615C` | Primary buttons, active states, links |
| `cyan-900` | `#0A3E3B` | Rarely used — max-contrast accent |

**Department colors**
| Department | Hex | Tint (badge bg) | Text (on tint) |
|---|---|---|---|
| Engineering | `#0F7A73` | `#EAF7F6` | `#0B615C` |
| Traction | `#B9812C` | `#FBF1DE` | `#8A6120` |
| Signal & Telecom | `#7C5AA6` | `#F1ECF8` | `#5E4380` |
| Merged/Combined | `#3E8E5B` | `#EAF6EE` | `#2E6D44` |
| Conflict/Alert | `#BB4430` | `#FBEEEA` | `#8F3A28` |

Conflict/unresolved blocks use a 45° diagonal stripe of `#BB4430`/`#D67B69`,
never a flat fill — stripe pattern is reserved exclusively for "unresolved
conflict" so it's recognizable at a glance on the timeline.

## Typography

- **Body/UI**: IBM Plex Sans (400/500/600/700)
- **Numeric/tabular data**: IBM Plex Mono — applied via a `.num` utility class
  to anything that's a count, score, timestamp, or ID, so figures always
  align in tables and cards
- **Display/headings** (nav brand, big numbers): Poppins (500/600/700),
  falling back to IBM Plex Sans
- Sizes stay small and dense throughout (10–15px range) — this is a data
  tool, not editorial content; nothing above ~28px except the KPI card
  headline numbers

## UI components

- **Card** (`ui/Card.jsx`) — the base surface: `cream-50` background,
  `cream-300` border, `rounded-card` (10px), soft shadow. Every panel on
  every screen is a `Card`; no bespoke panel styling elsewhere.
- **Status pills** — small rounded-full badges, background = department tint
  or status color, text = matching dark variant (never white-on-saturated —
  keeps contrast comfortable on the cream base)
- **Block bars** (timeline) — solid department color normally; diagonal
  stripe when in unresolved conflict; slight lift + shadow on hover; dashed
  white outline while being dragged in sandbox mode
- **Side panel** — slides in from the right, dims the page behind it, shows
  block detail + Approve/Override/Resolve-conflict actions
- **Scenario bar** — floats bottom-center, only visible during an active
  what-if drag; shows conflict delta and SLA impact inline, Apply (green)
  / Discard (red-outline) actions
- **Toast** — bottom-center, dark `ink-900` background, auto-dismisses;
  used for confirmation of any write action (approve, override, apply
  scenario, export)
- **Buttons** — solid `cyan-600`/green/red-outline depending on the action's
  weight (primary action / positive confirm / destructive-or-override);
  no more than one solid-filled primary button per action group
- **Charts** (Reports) — Recharts, using the palette above directly
  (`#3AACA3` utilisation, `#B9812C` backlog trend, `#0F7A73` compliance) —
  never default Recharts colors
