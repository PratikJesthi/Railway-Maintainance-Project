# Real v2 conflict-data import

## New file
app/scripts/import_v2_conflicts.py   (app/scripts/__init__.py too, if you don't
                                       already have a scripts/ package)

## Add to requirements.txt
pandas==2.2.3
pyarrow==17.0.0

## Run it
python -m app.scripts.import_v2_conflicts --file path/to/v2_conflict_pairs.parquet --limit 25

Tested end-to-end against the real v2_conflict_pairs_sample.parquet (100-row
sample): 15 pairs -> 30 Block rows + 30 QueueItem rows, all correctly picked
up by the existing conflict_service (verified via GET /api/blocks and
GET /api/conflicts on a live TestClient — no code changes needed there, it
already auto-detects overlapping blocks on the same section).

Safe to re-run — pairs already present (by id) are skipped, not duplicated.

Point --file at your full v2_conflict_pairs.parquet (5,000 rows) when you
have it; --limit controls how many pairs (x2 blocks each) get imported, so
you can start small and re-run with a higher limit later.

See the module docstring in import_v2_conflicts.py for exactly what's real
vs. synthesized in the mapping (department assignment and block duration are
derived, not in the source data — corridor codes, train numbers, conflict
type, and timing are real).
