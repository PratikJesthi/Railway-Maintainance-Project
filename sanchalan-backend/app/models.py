from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class UserDepartment(SQLModel, table=True):
    """Join table — a controller/approver can span multiple departments; a requester usually has one."""

    user_id: Optional[int] = Field(default=None, foreign_key="user.id", primary_key=True)
    dept: str = Field(primary_key=True)   # dept code: ENG / TRAC / SNT — no separate Department table yet


class User(SQLModel, table=True):
    """Login account. role: requester | controller | approver | viewer (see README in the auth patch)."""

    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: str = Field(unique=True, index=True)
    name: str
    hashed_password: str
    role: str = "requester"
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    departments: list[UserDepartment] = Relationship()


class Block(SQLModel, table=True):
    """A possession / block-window request on a corridor section.

    Mirrors INITIAL_BLOCKS in opsData.js exactly — `start`/`dur` are hours
    from Monday 00:00 of the current planning week.
    """

    id: str = Field(primary_key=True)          # e.g. "B-101"
    sec: str = Field(index=True)                # section, e.g. "NDLS–MTJ"
    dept: str = Field(index=True)               # dept code: ENG / TRAC / SNT / Merged
    start: float                                 # hour offset from Mon 00:00
    dur: float                                   # duration in hours
    defect: str                                  # linked defect id(s)
    sev: str                                     # Critical / High / Medium / Low
    overdue: int = 0                             # days overdue
    src: str                                     # source system: SMMS / TDMS / BDMS / COA
    st: str = "Scheduled"                        # Scheduled / Pending / In Progress
    note: str = ""
    conflict: bool = False                       # true while it overlaps another block
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class QueueItem(SQLModel, table=True):
    """One row of the ML-ranked priority queue (per defect, not per block)."""

    id: str = Field(primary_key=True)           # defect id, e.g. "ENG-1042"
    dept: str
    sec: str
    st: str
    sev: int = 0    # severity component
    ovd: int = 0    # overdue component
    crit: int = 0   # criticality component
    saf: int = 0    # safety-risk component
    src: str
    why: str = ""

    @property
    def total(self) -> int:
        # Kept identical to the frontend's `total: q.sev` — the displayed
        # "Score" column is the severity axis, sev/ovd/crit/saf are the
        # transparent breakdown bars next to it.
        return self.sev


class FeedEvent(SQLModel, table=True):
    """One line of the live ops feed."""

    id: Optional[int] = Field(default=None, primary_key=True)
    time: str                                    # "HH:MM" display string
    color: str                                    # hex color for the feed dot
    text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)


class AuditEntry(SQLModel, table=True):
    """One append-only audit log row."""

    id: Optional[int] = Field(default=None, primary_key=True)
    t: str                                        # display timestamp string
    by: str = "Control User"
    action: str
    detail: str
    type: str = "ok"                              # "ok" | "warn"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)


# ---------------------------------------------------------------------------
# Timetable — Train, Station, TrainSectionPass
# ---------------------------------------------------------------------------

class Station(SQLModel, table=True):
    """A railway station on the corridor."""

    code: str = Field(primary_key=True)           # e.g. "NDLS"
    name: str                                      # e.g. "New Delhi"
    zone: str = "NR"                               # Railway zone
    state: str = ""
    lat: Optional[float] = None
    lon: Optional[float] = None


class Train(SQLModel, table=True):
    """A scheduled train service on the corridor."""

    number: str = Field(primary_key=True)          # e.g. "12002"
    name: str                                       # e.g. "Bhopal Shatabdi"
    train_type: str = "EXP"                        # EXP / PASS / MEMU / DEMU / RAJ / SF
    from_code: str                                  # origin station code
    to_code: str                                    # destination station code
    from_name: str = ""
    to_name: str = ""
    zone: str = "NR"
    distance_km: int = 0
    duration_h: int = 0


class TrainSectionPass(SQLModel, table=True):
    """Records that `train_number` passes through corridor section `sec`
    with its window starting at `pass_start_h` (hours from Mon 00:00)
    and lasting `pass_dur_h` hours.

    This is what makes the ScenarioBar real: for a given Block, we query
    TrainSectionPass where sec==block.sec and windows overlap to get the
    real affected-train count instead of the guessed `conflictIds*14`.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    train_number: str = Field(index=True, foreign_key="train.number")
    sec: str = Field(index=True)                   # corridor section, e.g. "NDLS–MTJ"
    pass_start_h: float                            # hour the train enters the section (Mon 00:00 base)
    pass_dur_h: float = 1.0                        # hours the train occupies the section
    day: int = 1                                   # planning week day (1=Mon … 7=Sun)
