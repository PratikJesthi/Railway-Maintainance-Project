from typing import Literal, Optional

from pydantic import BaseModel, Field


# ---------- Blocks ----------

class BlockRead(BaseModel):
    id: str
    sec: str
    dept: str
    start: float
    dur: float
    defect: str
    sev: str
    overdue: int
    src: str
    st: str
    note: str
    conflict: bool

    class Config:
        from_attributes = True


class BlockCreate(BaseModel):
    id: str
    sec: str
    dept: str
    start: float = Field(ge=0)
    dur: float = Field(gt=0)
    defect: str
    sev: Literal["Critical", "High", "Medium", "Low"]
    overdue: int = 0
    src: str
    st: Literal["Scheduled", "Pending", "In Progress"] = "Scheduled"
    note: str = ""


class BlockUpdate(BaseModel):
    st: Optional[Literal["Scheduled", "Pending", "In Progress"]] = None
    start: Optional[float] = None
    dur: Optional[float] = None
    note: Optional[str] = None
    sev: Optional[Literal["Critical", "High", "Medium", "Low"]] = None
    # who/why for the audit trail this update writes
    by: Optional[str] = None
    reason: Optional[str] = None


class BlockCreateResult(BaseModel):
    block: BlockRead
    conflicts_with: list[str] = []


# ---------- Priority queue ----------

class QueueItemRead(BaseModel):
    id: str
    dept: str
    sec: str
    st: str
    sev: int
    ovd: int
    crit: int
    saf: int
    src: str
    why: str
    total: int

    class Config:
        from_attributes = True


# ---------- Feed ----------

class FeedEventRead(BaseModel):
    time: str
    color: str
    text: str

    class Config:
        from_attributes = True


class FeedEventCreate(BaseModel):
    text: str
    color: str = "#0F7A73"


# ---------- Audit ----------

class AuditEntryRead(BaseModel):
    t: str
    by: str
    action: str
    detail: str
    type: str

    class Config:
        from_attributes = True


class AuditEntryCreate(BaseModel):
    action: str
    detail: str
    by: str = "Control User"


# ---------- Depts / meta ----------

class DeptRead(BaseModel):
    code: str
    name: str
    short: str
    color: str
    tint: str
    text: str


# ---------- KPIs ----------

class KPIRead(BaseModel):
    label: str
    man: float
    ai: float
    man_display: str
    ai_display: str
    delta: str
    good: bool


# ---------- Reports ----------

class ChartPoint(BaseModel):
    dept: str
    value: float


class BacklogPoint(BaseModel):
    week: str
    backlog: int


class ReportSummary(BaseModel):
    label: str
    value: str


# ---------- Conflicts ----------

class ConflictGroup(BaseModel):
    conflict_id: str
    sec: str
    block_ids: list[str]
    blocks: list[BlockRead]


class ConflictResolveRequest(BaseModel):
    conflict_id: str = "C-1"
    # "ai" (auto, AI-attributed), "accept" (human accepts the AI suggestion),
    # or any free-text override label — mirrors resolveConflict(method) in AppContext.jsx
    method: str = "accept"
    by: Optional[str] = None


class ConflictResolveResponse(BaseModel):
    resolved: bool
    message: str
    merged_block: Optional[BlockRead] = None
    audit_entry: AuditEntryRead
    feed_event: FeedEventRead


# ---------- Bootstrap (single-call hydrate for AppContext) ----------

class BootstrapResponse(BaseModel):
    depts: dict[str, DeptRead]
    sections: list[str]
    blocks: list[BlockRead]
    queue: list[QueueItemRead]
    feed: list[FeedEventRead]
    audit: list[AuditEntryRead]
    kpis: list[KPIRead]
    now_h: float
    resolved: bool
