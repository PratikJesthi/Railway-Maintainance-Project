"""
Import real labeled train-conflict data (RAILOPT-AI v2 conflict-pairs
dataset) as Block + QueueItem rows.

WHAT'S REAL vs SYNTHESIZED — read before trusting a demo built on this:

  REAL (taken directly from the dataset):
    - corridor / station codes (from_station_a/b, to_station_a/b)
    - train numbers (train_a, train_b)
    - conflict_type (SAME_STATION / SAME_CORRIDOR / FOLLOWING_TRAIN /
      OPPOSING_MOVEMENT)
    - day + departure/arrival seconds → what hour of the week the conflict
      actually falls on

  SYNTHESIZED (the dataset has no concept of these — SANCHALAN's domain is
  maintenance block requests, the dataset's is train-vs-train scheduling):
    - which department (ENG/TRAC/SNT) "owns" each side of the conflict —
      mapped from conflict_type by a stated, explainable rule (see
      CONFLICT_TYPE_DEPT below), not random
    - block duration — the dataset's own durations are train transit times
      (minutes), useless as a maintenance-window length; a plausible
      4–14h window is derived deterministically from the row's conflict_id
      so re-running the import is reproducible
    - severity, overdue days, defect id, priority-queue score components —
      none of these exist in the source data at the per-row level

Usage:
    python -m app.scripts.import_v2_conflicts --file path/to/v2_conflict_pairs.parquet --limit 25
"""
import argparse
import hashlib
from pathlib import Path

import pandas as pd
from sqlmodel import Session, select

from ..database import engine
from ..models import Block, QueueItem

# conflict_type -> (dept for side A, dept for side B) — a same-corridor track
# conflict is primarily an Engineering concern; a same-station conflict is
# primarily signalling; following-train / opposing-movement are headway/
# separation problems that read most naturally as a Traction vs. S&T
# cross-check, since one governs the rolling stock's power supply window and
# the other the interlocking that allows the movement at all.
CONFLICT_TYPE_DEPT = {
    "SAME_CORRIDOR": ("ENG", "TRAC"),
    "SAME_STATION": ("SNT", "ENG"),
    "FOLLOWING_TRAIN": ("TRAC", "SNT"),
    "OPPOSING_MOVEMENT": ("SNT", "TRAC"),
}
SRC_FOR_DEPT = {"ENG": "SMMS", "TRAC": "TDMS", "SNT": "TDMS"}


def _stable_hash(*parts: str, mod: int) -> int:
    """Deterministic pseudo-random int in [0, mod) from the row's own identifiers."""
    h = hashlib.sha1("|".join(parts).encode()).hexdigest()
    return int(h, 16) % mod


def _hour_of_week(day: str, seconds: float) -> float:
    """day is 1-indexed in the source data; convert to hours from day-1 00:00."""
    day_idx = max(0, int(day) - 1)
    return day_idx * 24 + (seconds or 0) / 3600.0


def _severity_for(conflict_id: str) -> str:
    # Matches v2's known ~60/40 Medium/High split (the split is documented in
    # the generation report; the per-row label isn't in this table).
    return "High" if _stable_hash(conflict_id, "sev", mod=100) < 40 else "Medium"


def row_to_blocks(row: pd.Series) -> tuple[Block, Block]:
    dept_a, dept_b = CONFLICT_TYPE_DEPT.get(row.conflict_type, ("ENG", "SNT"))
    dur = 4 + _stable_hash(row.conflict_id, "dur", mod=11)   # 4-14h, deterministic
    start = min(
        _hour_of_week(row.day, row.departure_a),
        _hour_of_week(row.day, row.departure_b),
    )
    sev = _severity_for(row.conflict_id)
    sec = f"{row.from_station_a}–{row.to_station_a}"
    tag = row.conflict_id[-6:]

    note = (
        f"Real corridor conflict — Train {row.train_a} vs Train {row.train_b} "
        f"on {row.physical_corridor} ({row.conflict_type}, gap "
        f"{row.temporal_gap_seconds:.0f}s). Source: RAILOPT-AI v2 conflict-pairs "
        f"dataset, {row.conflict_id}."
    )

    block_a = Block(
        id=f"RB-{tag}-A", sec=sec, dept=dept_a, start=start, dur=dur,
        defect=f"{dept_a}-{tag}A", sev=sev,
        overdue=_stable_hash(row.conflict_id, "ovd", mod=10) + 1,
        src=SRC_FOR_DEPT[dept_a], st="Pending", note=note, conflict=True,
    )
    block_b = Block(
        id=f"RB-{tag}-B", sec=sec, dept=dept_b, start=start, dur=dur,
        defect=f"{dept_b}-{tag}B", sev=sev,
        overdue=_stable_hash(row.conflict_id, "ovd2", mod=10) + 1,
        src=SRC_FOR_DEPT[dept_b], st="Pending", note=note, conflict=True,
    )
    return block_a, block_b


def row_to_queue_items(row: pd.Series, block_a: Block, block_b: Block) -> tuple[QueueItem, QueueItem]:
    def _qi(block: Block) -> QueueItem:
        sev_pct = 30 if block.sev == "High" else 20
        ovd_pct = min(30, block.overdue * 2)
        return QueueItem(
            id=block.defect, dept=block.dept, sec=block.sec, st=block.st,
            sev=sev_pct, ovd=ovd_pct,
            crit=_stable_hash(block.id, "crit", mod=15) + 5,
            saf=_stable_hash(block.id, "saf", mod=10) + 3,
            src=block.src,
            why=(
                f"Real train-conflict on {row.physical_corridor} "
                f"({row.conflict_type}) — Train {row.train_a}/{row.train_b}, "
                f"{row.temporal_gap_seconds:.0f}s headway gap against the "
                f"required 180s minimum."
            ),
        )
    return _qi(block_a), _qi(block_b)


def import_file(path: str, limit: int) -> dict:
    df = pd.read_parquet(path)
    df = df.head(limit)

    inserted_blocks, inserted_queue, skipped = 0, 0, 0
    with Session(engine) as session:
        for _, row in df.iterrows():
            block_a, block_b = row_to_blocks(row)
            if session.get(Block, block_a.id):
                skipped += 1
                continue
            qi_a, qi_b = row_to_queue_items(row, block_a, block_b)
            for obj in (block_a, block_b, qi_a, qi_b):
                session.add(obj)
            inserted_blocks += 2
            inserted_queue += 2
        session.commit()

    return {"blocks": inserted_blocks, "queue_items": inserted_queue, "skipped_existing": skipped}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", required=True, help="Path to v2_conflict_pairs(.parquet)")
    parser.add_argument("--limit", type=int, default=25, help="Number of conflict pairs to import")
    args = parser.parse_args()

    if not Path(args.file).exists():
        raise SystemExit(f"File not found: {args.file}")

    result = import_file(args.file, args.limit)
    print(f"Imported {result['blocks']} blocks, {result['queue_items']} queue items "
          f"({result['skipped_existing']} pairs skipped — already present).")


if __name__ == "__main__":
    main()
