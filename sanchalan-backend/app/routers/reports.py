import math

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from .. import models
from ..database import get_session
from ..schemas import BacklogPoint, ChartPoint, ReportSummary
from ..seed_data import COMPLIANCE_BY_DEPT, DEPTS
from ..services.export_service import csv_response

router = APIRouter(prefix="/api/reports", tags=["reports"])

# Baseline used to turn raw block-hours into a 0-100% utilisation figure —
# same denominator CommandCentre.jsx uses for the corridor bars (40h/week).
_AVAILABLE_HOURS_PER_DEPT = 40


@router.get("/utilization", response_model=list[ChartPoint])
def utilization(session: Session = Depends(get_session)):
    """Block-hours booked per department this week, computed live from the
    `blocks` table (this is the one report the backend derives for real,
    rather than mirroring a static mock)."""
    blocks = session.exec(select(models.Block)).all()
    totals: dict[str, float] = {code: 0.0 for code in DEPTS}
    for b in blocks:
        totals[b.dept] = totals.get(b.dept, 0.0) + b.dur

    return [
        ChartPoint(
            dept=DEPTS[code]["short"],
            value=min(100, round((hours / _AVAILABLE_HOURS_PER_DEPT) * 100)),
        )
        for code, hours in totals.items()
    ]


@router.get("/backlog-trend", response_model=list[BacklogPoint])
def backlog_trend():
    """14-week defect backlog trend. No historical backlog table exists yet
    (only the current snapshot is modelled), so this stays a deterministic
    mock — same formula/series as Reports.jsx's BACKLOG_TREND."""
    return [
        BacklogPoint(week=f"W{i + 1}", backlog=round(210 - i * 6 + math.sin(i) * 10))
        for i in range(14)
    ]


@router.get("/compliance", response_model=list[ChartPoint])
def compliance():
    return [ChartPoint(**row) for row in COMPLIANCE_BY_DEPT]


@router.get("/summary", response_model=list[ReportSummary])
def summary(session: Session = Depends(get_session)):
    """The four cards at the top of the Reports screen — computed from
    live data where a real source exists, static where it doesn't."""
    blocks = session.exec(select(models.Block)).all()
    audit = session.exec(select(models.AuditEntry)).all()

    util = utilization(session)
    avg_util = round(sum(c.value for c in util) / len(util)) if util else 0
    sla_breaches = sum(1 for b in blocks if b.overdue >= 10)
    auto_resolved = sum(1 for a in audit if "AUTO-RESOLVED" in a.action)

    return [
        ReportSummary(label="Blocks planned this month", value=str(len(blocks))),
        ReportSummary(label="Avg. possession utilisation", value=f"{avg_util}%"),
        ReportSummary(label="SLA-breach incidents", value=str(sla_breaches)),
        ReportSummary(label="Conflicts auto-resolved", value=str(auto_resolved)),
    ]


@router.get("/export/summary.csv")
def export_summary_csv(session: Session = Depends(get_session)):
    rows = utilization(session)
    return csv_response(
        "sanchalan_summary.csv",
        ["department", "utilisation_pct"],
        [[r.dept, r.value] for r in rows],
    )


@router.get("/export/backlog.csv")
def export_backlog_csv():
    rows = backlog_trend()
    return csv_response(
        "sanchalan_backlog_trend.csv",
        ["week", "backlog"],
        [[r.week, r.backlog] for r in rows],
    )
