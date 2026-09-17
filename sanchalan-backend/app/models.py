from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


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
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


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
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class AuditEntry(SQLModel, table=True):
    """One append-only audit log row."""

    id: Optional[int] = Field(default=None, primary_key=True)
    t: str                                        # display timestamp string
    by: str = "Control User"
    action: str
    detail: str
    type: str = "ok"                              # "ok" | "warn"
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
