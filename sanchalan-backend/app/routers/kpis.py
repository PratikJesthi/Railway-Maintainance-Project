from fastapi import APIRouter

from ..schemas import KPIRead
from ..seed_data import KPI_DEFS

router = APIRouter(prefix="/api/kpis", tags=["kpis"])


def _fmt(value: float, kind: str) -> str:
    if kind == "int_commas":
        return f"{round(value):,}"
    if kind == "percent":
        return f"{round(value)}%"
    return str(round(value))


@router.get("", response_model=list[KPIRead])
def list_kpis():
    """Command Centre KPI cards. Each has a manual-baseline value and an
    AI-plan value — the frontend's AI/Manual toggle just picks which one
    to display, so both are always returned."""
    return [
        KPIRead(
            label=d["label"],
            man=d["man"],
            ai=d["ai"],
            man_display=_fmt(d["man"], d["kind"]),
            ai_display=_fmt(d["ai"], d["kind"]),
            delta=d["delta"],
            good=d["good"],
        )
        for d in KPI_DEFS
    ]
