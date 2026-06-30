---
name: maintenance-loop
description: The autonomous maintenance tick a scheduler fires. Runs data-ingestion (gather new knowledge), then improve-system (propose/apply within the approval gates), unattended, and appends a unified run log. Safe to run with no human present — it never applies anything beyond improve-system's own AUTO-APPROVE bucket.
---

# maintenance-loop

The heartbeat of the self-improving system. One tick = ingest everything new, then run one
self-improvement pass, then log the result. It is the single entry point a schedule should
fire (see `docs/SCHEDULING.md`); everything it does already honors `CLAUDE.md`'s approval
gates, so it is safe to run unattended.

## When to use

On a schedule (recommended: weekly, via a Claude Code Routine), or on demand when you want
a full ingest-then-improve pass in one step.

## State

- **Run log:** `outputs/runs/maintenance-loop.md` — append-only, newest first. One block per
  tick: timestamp, `data-ingestion` per-skill totals, `improve-system` bucket counts
  (auto-applied / needs sign-off / more context), and any errors.

## Procedure

Run unattended — **do not ask the user questions.** If a step needs configuration that is
missing, skip it and log "skipped (unconfigured)" rather than blocking on an interview.

1. **Ingest.** Run `data-ingestion` (it runs `sync-claude-sessions`, `sync-ecosystem-data`,
   `sync-curated-content` back-to-back, each incremental via its own cursor). Sources without
   a `config.json` entry are skipped and logged, not interviewed.
2. **Improve.** Run `improve-system`. Its existing three-bucket logic does the safe thing on
   its own: it applies previously human-approved (`- [x]`) items and the low-risk
   AUTO-APPROVE bucket, and only *queues* NEEDS SIGN-OFF and MORE CONTEXT items for a human.
   Nothing structural or skill-related is applied without a checked box — that guarantee
   holds here exactly as in a manual run.
3. **Log the tick.** Prepend a block to `outputs/runs/maintenance-loop.md` with the ingest
   totals, the improve-system bucket counts, and any errors. (The per-change `change-log.md`
   lines are written by the sub-skills; this is the tick-level record.)
4. **Flag the human if needed.** If this tick created new NEEDS SIGN-OFF or MORE CONTEXT
   items, note the count in the log block. If `human-improve-system` is configured to notify
   (e.g. Slack), hand off to it so the human learns items are waiting.

## Output

A short summary: items ingested per source, improve-system's per-bucket counts, what was
auto-applied, how many items now await a human, and the path to the run-log block written.
