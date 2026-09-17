from fastapi import APIRouter

from ..config import settings
from ..schemas import DeptRead
from ..seed_data import DEPTS, SECTIONS

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("/depts", response_model=dict[str, DeptRead])
def get_depts():
    return DEPTS


@router.get("/sections", response_model=list[str])
def get_sections():
    return SECTIONS


@router.get("/now")
def get_now():
    """Sim clock — hours elapsed since Monday 00:00 of the planning week.
    Used to draw the 'NOW' line on the Corridor Timeline."""
    return {"now_h": settings.now_h}
