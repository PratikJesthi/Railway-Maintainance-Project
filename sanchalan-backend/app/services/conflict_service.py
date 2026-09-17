from sqlmodel import Session, select

from .. import models


def overlaps(a: models.Block, b: models.Block) -> bool:
    """Two blocks in the same section conflict if their [start, start+dur)
    windows overlap and they belong to different departments (same-dept
    overlap is just a longer possession, not a conflict)."""
    if a.sec != b.sec or a.dept == b.dept:
        return False
    a_end, b_end = a.start + a.dur, b.start + b.dur
    return a.start < b_end and b.start < a_end


def detect_conflicts(session: Session, new_block: models.Block) -> list[models.Block]:
    """Find existing blocks that overlap `new_block`, flag both sides
    (conflict=True) and return the list of blocks it collides with."""
    existing = session.exec(
        select(models.Block).where(
            models.Block.sec == new_block.sec, models.Block.id != new_block.id
        )
    ).all()
    hits = [b for b in existing if overlaps(new_block, b)]
    if hits:
        new_block.conflict = True
        for b in hits:
            b.conflict = True
            session.add(b)
        session.add(new_block)
        session.commit()
    return hits


# The demo dataset ships exactly one pre-built conflict (C-1: B-301 vs
# B-302 on AGC–GWL) that the Conflict Resolution screen is designed
# around — this mirrors AppContext.jsx's hardcoded resolveConflict().
# Conflicts raised dynamically via detect_conflicts() above are flagged
# on the timeline but resolved by simply PATCHing one block's window/status
# (see routers/blocks.py) rather than through this merge path.
KNOWN_CONFLICTS = {
    "C-1": {
        "block_ids": ("B-301", "B-302"),
        "sec": "AGC–GWL",
        "merged": {
            "id": "B-301+302",
            "sec": "AGC–GWL",
            "dept": "Merged",
            "start": 52,
            "dur": 18,
            "defect": "ENG-1042 / SNT-0871",
            "sev": "Critical",
            "overdue": 12,
            "src": "SMMS+TDMS",
            "st": "Scheduled",
            "note": "Combined possession — rail fracture renewal + signal failure repair, shared window.",
            "conflict": False,
        },
    }
}


def resolve_known_conflict(session: Session, conflict_id: str) -> models.Block:
    """Merge the two blocks of a known hardcoded conflict into one combined
    block, exactly like AppContext.jsx's resolveConflict()."""
    spec = KNOWN_CONFLICTS[conflict_id]
    for block_id in spec["block_ids"]:
        block = session.get(models.Block, block_id)
        if block is not None:
            session.delete(block)
    session.commit()

    merged = models.Block(**spec["merged"])
    session.add(merged)
    session.commit()
    session.refresh(merged)
    return merged
