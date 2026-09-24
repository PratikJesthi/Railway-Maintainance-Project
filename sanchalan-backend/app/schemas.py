from typing import Literal, Optional

from pydantic import BaseModel, Field


# ---------- Auth ----------

class LoginRequest(BaseModel):
    employee_id: str
    password: str


class RegisterRequest(BaseModel):
    employee_id: str
    name: str
    password: str
    role: str = "requester"  # requester | controller | approver | viewer
    departments: list[str] = ["ENG"]


class ForgotPasswordRequest(BaseModel):
    employee_id: str


class ResetPasswordRequest(BaseModel):
    employee_id: str
    reset_token: str
    new_password: str


class ForgotPasswordResponse(BaseModel):
    message: str


class MessageResponse(BaseModel):
    message: str


class UserOut(BaseModel):
    id: int
    employee_id: str
    name: str
    role: str
    departments: list[str]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


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
    st: Optional[Literal["Scheduled", "Pending", "In Progress", "Completed", "Rescheduled"]] = None
    start: Optional[float] = None
    dur: Optional[float] = None
    note: Optional[str] = None
    sev: Optional[Literal["Critical", "High", "Medium", "Low"]] = None
    # who/why/what-label for the audit trail this update writes
    by: Optional[str] = None
    reason: Optional[str] = None
    action: Optional[str] = None  # audit action label, e.g. "WHAT-IF APPLIED" — defaults to "MANUAL OVERRIDE"


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


# ---------- Optimizer / CP-SAT ----------

class OptimizerRequest(BaseModel):
    """Request to run the CP-SAT conflict optimizer on a section.

    Provide either `sec` (runs on all conflict-flagged blocks in that
    section) or an explicit `block_ids` list.  If both are given, block_ids
    takes precedence.
    """
    sec: Optional[str] = None
    block_ids: Optional[list[str]] = None


class MergeProposalOut(BaseModel):
    """Pre-step merge suggestion returned when two conflicting blocks
    from different departments fit inside the merge-window threshold."""
    block_a_id: str
    block_b_id: str
    dept_a: str
    dept_b: str
    merged_start: float
    merged_dur: float
    rationale: str


class ScheduledBlockOut(BaseModel):
    """One block's solver-recommended placement."""
    block_id: str
    sec: str
    dept: str
    original_start: float
    scheduled_start: float
    scheduled_end: float
    dur: float
    priority_score: float
    delay_hours: float
    sev: str
    defect: str


class SectionOptimizerOut(BaseModel):
    """Full optimizer result for a section.

    status values:
      OPTIMAL        — solver found the globally minimum-tardiness schedule.
      FEASIBLE       — solver hit the time limit but found a valid schedule.
      INFEASIBLE     — no non-overlapping schedule exists (escalate manually).
      MERGE_OFFERED  — merge pre-check triggered; merge proposal is populated
                       instead of a full solver schedule.
    """
    sec: str
    status: str
    merge_proposal: Optional[MergeProposalOut] = None
    scheduled: list[ScheduledBlockOut] = []
    solver_wall_seconds: float = 0.0
    rationale: str


# ---------- Trains & Timetable ----------

class StationRead(BaseModel):
    code: str
    name: str
    zone: str
    state: str
    lat: Optional[float] = None
    lon: Optional[float] = None

    class Config:
        from_attributes = True


class TrainRead(BaseModel):
    number: str
    name: str
    train_type: str
    from_code: str
    to_code: str
    from_name: str
    to_name: str
    zone: str
    distance_km: int
    duration_h: int

    class Config:
        from_attributes = True


class TrainSectionPassRead(BaseModel):
    id: Optional[int]
    train_number: str
    sec: str
    pass_start_h: float
    pass_dur_h: float
    day: int

    class Config:
        from_attributes = True


class AffectedTrainEntry(BaseModel):
    train_number: str
    train_name: str
    train_type: str
    from_name: str
    to_name: str
    pass_start_h: float
    pass_dur_h: float
    overlap_h: float


class AffectedTrainsResponse(BaseModel):
    """Real affected-train count for a Block — replaces the guessed estimate."""
    block_id: str
    sec: str
    block_start_h: float
    block_end_h: float
    affected_count: int
    trains: list[AffectedTrainEntry]


class TimetableRow(BaseModel):
    id: Optional[int]
    train_number: str
    train_name: str
    train_type: str
    from_name: str
    to_name: str
    sec: str
    pass_start_h: float
    pass_dur_h: float
    day: int


class TimetableResponse(BaseModel):
    sections: list[str]
    rows: list[TimetableRow]

