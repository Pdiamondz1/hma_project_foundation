---
name: data-ingestion
description: Orchestrator. Runs the three sync skills back-to-back — sync-claude-sessions, sync-ecosystem-data, sync-curated-content — and logs a run record so future runs know what was already ingested (no gaps, no re-ingestion).
---

# data-ingestion

One command to refresh the whole knowledge base. Runs each sync skill in order and records
a single run log so the next run knows the history.

## When to use

On demand, or as the single scheduled entry point once each sync skill has been tested
individually with zero arguments.

## State

- **Run log:** `outputs/runs/data-ingestion.md` — append-only, newest first. One block per
  run: timestamp, each sub-skill's status + item count, total, and any errors.
- Reads each sub-skill's `outputs/runs/<skill>.json` to report cursors.

## Procedure

1. **Run the three sync skills back-to-back, in order:** `sync-claude-sessions`,
   `sync-ecosystem-data`, `sync-curated-content`. Each manages its own incremental cursor,
   so re-running is safe and won't re-ingest.
2. **If one fails, continue the others** and record the failure; do not let one bad source
   abort the whole run. Never re-ingest data a sub-skill has already cursored past.
3. **Write the run log.** Prepend a block to `outputs/runs/data-ingestion.md` with the
   per-skill results and totals. (The change-log lines are written by the sub-skills; this
   log is the run-level record.)

## Unattended invocation

This orchestrator is the scheduled/loop entry point, so it runs its sub-skills in their
**unattended** mode (see each sub-skill's "Unattended invocation" note): no interviews, and
any source without a `config.json` entry is skipped and logged "skipped (unconfigured)"
rather than prompting. It never blocks on a question — first-run configuration is done by
running each sync skill manually once.

## Output

A short summary: per-skill items ingested, total, overall status, and pointers to anything
that needs attention (e.g. a source that errored, or new items now awaiting indexing).
