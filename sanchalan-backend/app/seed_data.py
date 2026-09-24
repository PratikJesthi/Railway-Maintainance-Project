"""Python port of src/data/opsData.js — keep these two files in sync.

DEPTS / SECTIONS / KPI_DEFS are served as reference/config data (never
mutated). INITIAL_* rows are only used once, to seed the database the
first time the app boots — after that, live data lives in SQLite and
these are ignored.
"""

DEPTS = {
    "ENG": {"code": "ENG", "name": "Engineering (P.Way)", "short": "Engg.",
             "color": "#0F7A73", "tint": "#EAF7F6", "text": "#0B615C"},
    "TRAC": {"code": "TRAC", "name": "Traction (OHE)", "short": "Traction",
              "color": "#B9812C", "tint": "#FBF1DE", "text": "#8A6120"},
    "SNT": {"code": "SNT", "name": "Signal & Telecom", "short": "S&T",
             "color": "#7C5AA6", "tint": "#F1ECF8", "text": "#5E4380"},
    "Merged": {"code": "Merged", "name": "Combined Block", "short": "Combined",
                "color": "#3E8E5B", "tint": "#EAF6EE", "text": "#2E6D44"},
}

SECTIONS = ["NDLS–MTJ", "MTJ–AGC", "AGC–GWL", "GWL–JHS", "JHS–BPL", "BPL–ET"]

INITIAL_BLOCKS = [
    {"id": "B-101", "sec": "NDLS–MTJ", "dept": "ENG", "start": 6, "dur": 10, "defect": "ENG-1042", "sev": "Critical", "overdue": 12, "src": "SMMS", "st": "Scheduled", "note": "Rail fracture at km 42/3; PTR rail staged at site."},
    {"id": "B-102", "sec": "NDLS–MTJ", "dept": "TRAC", "start": 30, "dur": 8, "defect": "TRAC-2210", "sev": "High", "overdue": 4, "src": "TDMS", "st": "Scheduled", "note": "OHE isolator replacement, km 18."},
    {"id": "B-103", "sec": "MTJ–AGC", "dept": "SNT", "start": 20, "dur": 12, "defect": "SNT-0304", "sev": "Medium", "overdue": 1, "src": "TDMS", "st": "In Progress", "note": "Track circuit tuning, km 87–92."},
    {"id": "B-104", "sec": "MTJ–AGC", "dept": "ENG", "start": 55, "dur": 9, "defect": "ENG-1188", "sev": "High", "overdue": 6, "src": "SMMS", "st": "Scheduled", "note": "LLT machine run, km 55–61."},
    {"id": "B-105", "sec": "AGC–GWL", "dept": "TRAC", "start": 8, "dur": 6, "defect": "TRAC-2355", "sev": "Medium", "overdue": 2, "src": "TDMS", "st": "Scheduled", "note": "Traction motor inspection, E-locos."},
    {"id": "B-301", "sec": "AGC–GWL", "dept": "ENG", "start": 52, "dur": 12, "defect": "ENG-1042", "sev": "Critical", "overdue": 12, "src": "SMMS", "st": "Pending", "conflict": True, "note": "Rail fracture continuation; renewal, km 142."},
    {"id": "B-302", "sec": "AGC–GWL", "dept": "SNT", "start": 58, "dur": 12, "defect": "SNT-0871", "sev": "High", "overdue": 6, "src": "TDMS", "st": "Pending", "conflict": True, "note": "Signal failure, home signal AGC-14."},
    {"id": "B-106", "sec": "GWL–JHS", "dept": "TRAC", "start": 70, "dur": 14, "defect": "TRAC-2418", "sev": "Critical", "overdue": 9, "src": "TDMS", "st": "Scheduled", "note": "OHE sectioning post failure in ghat section."},
    {"id": "B-107", "sec": "GWL–JHS", "dept": "ENG", "start": 90, "dur": 8, "defect": "ENG-1250", "sev": "Medium", "overdue": 3, "src": "COA", "st": "Scheduled", "note": "Bridge approach slab repair, km 203."},
    {"id": "B-108", "sec": "JHS–BPL", "dept": "SNT", "start": 24, "dur": 10, "defect": "SNT-0912", "sev": "High", "overdue": 5, "src": "BDMS", "st": "In Progress", "note": "Axle-counter drift, km 310–318."},
    {"id": "B-109", "sec": "JHS–BPL", "dept": "ENG", "start": 48, "dur": 16, "defect": "ENG-1314", "sev": "High", "overdue": 7, "src": "SMMS", "st": "Scheduled", "note": "Through sleeper renewal, km 288–295."},
    {"id": "B-110", "sec": "BPL–ET", "dept": "TRAC", "start": 80, "dur": 10, "defect": "TRAC-2501", "sev": "Medium", "overdue": 2, "src": "TDMS", "st": "Scheduled", "note": "SSP bracket tightening, km 401–408."},
    {"id": "B-111", "sec": "BPL–ET", "dept": "SNT", "start": 105, "dur": 12, "defect": "SNT-1022", "sev": "Low", "overdue": 0, "src": "TDMS", "st": "Scheduled", "note": "Data logger firmware rollout, BPL cabin."},
]

INITIAL_QUEUE = [
    {"id": "TRAC-2418", "dept": "TRAC", "sec": "GWL–JHS", "st": "Pending", "sev": 38, "ovd": 20, "crit": 17, "saf": 15, "src": "TDMS", "why": "OHE sectioning post failure in ghat section — 9 days overdue, Rajdhani + 14 mail/express paths affected. Safety risk: dewirement on gradient."},
    {"id": "ENG-1042", "dept": "ENG", "sec": "AGC–GWL", "st": "Pending", "sev": 36, "ovd": 25, "crit": 16, "saf": 10, "src": "SMMS", "why": "Rail fracture at km 42/3 — 12 days overdue, exceeds escalation threshold. Criticality: fracture on A-class route with 130 kmph clearance."},
    {"id": "SNT-0871", "dept": "SNT", "sec": "AGC–GWL", "st": "Pending", "sev": 26, "ovd": 15, "crit": 14, "saf": 12, "src": "TDMS", "why": "Home signal AGC-14 failure — 6 days overdue. Safety risk: degraded signalling mode (10-B) during fog season."},
    {"id": "ENG-1314", "dept": "ENG", "sec": "JHS–BPL", "st": "Scheduled", "sev": 24, "ovd": 18, "crit": 13, "saf": 8, "src": "SMMS", "why": "Through sleeper renewal km 288–295 — 7 days overdue; COA marks section for 60 kmph restriction."},
    {"id": "SNT-0912", "dept": "SNT", "sec": "JHS–BPL", "st": "In Progress", "sev": 22, "ovd": 14, "crit": 11, "saf": 9, "src": "BDMS", "why": "Axle-counter drift km 310–318 — 5 days overdue; two SPAD near-misses logged in BDMS."},
    {"id": "TRAC-2210", "dept": "TRAC", "sec": "NDLS–MTJ", "st": "Scheduled", "sev": 20, "ovd": 10, "crit": 12, "saf": 6, "src": "TDMS", "why": "OHE isolator replacement km 18 — 4 days overdue; BDMS history shows repeat failure after last temp fix."},
    {"id": "ENG-1188", "dept": "ENG", "sec": "MTJ–AGC", "st": "Scheduled", "sev": 18, "ovd": 8, "crit": 10, "saf": 5, "src": "SMMS", "why": "LLT machine run km 55–61 — 6 days overdue, machine window scarcity pushes criticality up."},
    {"id": "TRAC-2355", "dept": "TRAC", "sec": "AGC–GWL", "st": "Scheduled", "sev": 12, "ovd": 4, "crit": 8, "saf": 4, "src": "TDMS", "why": "Traction motor inspection — 2 days overdue, routine PMP task."},
]

INITIAL_FEED = [
    ("09:41", "#3E8E5B", "TDMS push · new block request B-301 (Engg.) auto-scored 87 — ranked #2"),
    ("09:38", "#BB4430", "CONFLICT detected: B-301 overlaps B-302 on AGC–GWL (6h overlap)"),
    ("09:31", "#3E8E5B", "B-103 marked In Progress — gang login from SMMS field app"),
    ("09:22", "#B9812C", "Weather advisory: fog probability 72% on MTJ–AGC after 05:00 — S&T tasks auto-prioritised"),
    ("09:15", "#3E8E5B", "B-109 optimised: combined with Traction window, saving 4h possession time"),
    ("09:04", "#0F7A73", "COA integration sync complete — 1,204 open defects matched to sections"),
    ("08:58", "#BB4430", "Overdue escalation: ENG-1042 crosses 12-day threshold → auto-escalated to Sr. DEN"),
    ("08:47", "#3E8E5B", "Weekly optimiser run finished — 63 cross-department conflicts auto-resolved"),
    ("08:39", "#7C5AA6", "BDMS nightly batch ingested: 312 condition-monitoring alerts classified"),
]

INITIAL_AUDIT = [
    {"t": "Wed 09:12", "by": "DEN-II, Gwalior", "action": "MANUAL OVERRIDE", "detail": "B-105 window shortened by 2h — fog advisory MTJ–AGC. AI suggestion retained on record for model feedback.", "type": "warn"},
    {"t": "Wed 08:47", "by": "SANCHALAN Optimiser", "action": "AUTO-ESCALATION", "detail": "ENG-1042 crossed the 12-day overdue threshold → escalated to Sr. DEN per SOP.", "type": "ok"},
    {"t": "Wed 08:31", "by": "SANCHALAN Optimiser", "action": "AI AUTO-RESOLVED", "detail": "Weekly optimiser run: 63 cross-department conflicts resolved, 41 by merge, 22 by re-sequencing.", "type": "ok"},
    {"t": "Tue 17:42", "by": "Sr. DOM, Jhansi", "action": "MANUAL OVERRIDE", "detail": "B-109 prioritised over TRAC-2355 — passenger amenity work order. Reason captured, SLA impact +1 day accepted.", "type": "warn"},
    {"t": "Tue 11:05", "by": "Control User", "action": "BLOCK APPROVED", "detail": "B-104 approved — written back to TMS.", "type": "ok"},
]

# man = manual-planning baseline, ai = SANCHALAN AI-plan value. `fmt` is applied
# client-side (or via KPIRead.man_display/ai_display below) — kept as a `kind`
# tag here instead of a lambda since this needs to survive a JSON response.
KPI_DEFS = [
    {"label": "Block-hours secured this week", "man": 1240, "ai": 1890, "kind": "int_commas", "delta": "+52% throughput", "good": True},
    {"label": "Overdue defects cleared", "man": 34, "ai": 78, "kind": "percent", "delta": "+44 pts", "good": True},
    {"label": "Cross-dept conflicts auto-resolved", "man": 0, "ai": 63, "kind": "int", "delta": "vs 0 manual", "good": True},
    {"label": "Asset availability (rolling stock)", "man": 71, "ai": 92, "kind": "percent", "delta": "+21 pts", "good": True},
]

# Reports screen chart data (recharts). No live source system feeds these
# yet, so they're kept static — same numbers as the frontend's mock so the
# charts don't jump when the frontend is pointed at this API.
UTIL_BY_DEPT = [
    {"dept": "Engg.", "value": 78},
    {"dept": "Traction", "value": 64},
    {"dept": "S&T", "value": 71},
    {"dept": "Combined", "value": 88},
]

COMPLIANCE_BY_DEPT = [
    {"dept": "Engg.", "value": 91},
    {"dept": "Traction", "value": 86},
    {"dept": "S&T", "value": 94},
    {"dept": "BDMS-flagged", "value": 78},
]

INITIAL_USERS = [
    {
        "employee_id": "SR-DEN-01",
        "name": "Rajesh Sharma",
        "password": "password123",
        "role": "approver",
        "departments": ["ENG", "TRAC", "SNT"],
    },
    {
        "employee_id": "CONTROLLER-01",
        "name": "Anita Verma",
        "password": "password123",
        "role": "controller",
        "departments": ["ENG", "TRAC", "SNT"],
    },
    {
        "employee_id": "ENG-101",
        "name": "Sunil Kumar",
        "password": "password123",
        "role": "requester",
        "departments": ["ENG"],
    },
    {
        "employee_id": "TRAC-101",
        "name": "Vikram Singh",
        "password": "password123",
        "role": "requester",
        "departments": ["TRAC"],
    },
    {
        "employee_id": "SNT-101",
        "name": "Priya Das",
        "password": "password123",
        "role": "requester",
        "departments": ["SNT"],
    },
]

