---
name: sync-ecosystem-data
description: Use to ingest new data from your connected sources (folders, email, Slack, meeting transcripts, published work) into raw/ecosystem/. Incremental and idempotent via stored run history; safe to run weekly. Interviews for your sources and connection methods on first run.
---

# sync-ecosystem-data

Incremental sync skill that pulls new material from the places you work — outside Claude —
into `raw/ecosystem/`, tagged by topic, with light indexes the `wiki/` can reference.

## When to use

On demand or weekly. Run it manually with zero arguments first to test before scheduling.

## State

- **Config:** `.claude/skills/sync-ecosystem-data/config.json` — your sources and how to
  reach each one: `{ sources: [ { id, kind, location, connection, filters } ] }` where
  `kind` is e.g. `folder | gmail | gdrive | slack | transcripts | published`, and
  `connection` records the tool/MCP or export used.
- **Run-state:** `outputs/runs/sync-ecosystem-data.json` — `{ last_run_finished,
  last_status, cursor: { per_source: { <id>: { since, seen } } }, items_ingested }`.

## Procedure

1. **First run / no config → interview.** If `config.json` is missing or empty, ask which
   sources to sync, how to connect to each (available MCP connectors such as Gmail or
   Google Drive, a local folder path, or a manual export), and what to filter OUT. Write
   `config.json`. Do not hardcode sources into this SKILL.md.
2. **Pull only what's new.** For each source, read the cursor (`since` / `seen`) from
   run-state and fetch items newer than the last successful run. Honor the source's
   `filters`.
3. **Land originals in `raw/ecosystem/`, unaltered.** Save each item verbatim as
   `raw/ecosystem/<source-id>/<YYYY-MM-DD>-<slug>.<ext>`. Never edit existing `raw/` files.
4. **Write light wiki indexes.** Create/update a topical `wiki/` page (frontmatter + short
   summary + topic tags) that references the new `raw/ecosystem/` files, cross-linked from
   `wiki/index.md`. Structural reorganizations go to `wiki/_candidates/` for sign-off.
5. **Record state + log.** Advance each source's cursor, set `last_run_finished`, and
   append to `outputs/change-log.md`:
   `- <date> — sync-ecosystem-data — ingested N items from <sources> → raw/ecosystem/ — auto`.

## Unattended invocation

When fired by `data-ingestion` / `maintenance-loop` (no human present), do not run the
first-run interview. If `config.json` is missing or empty, skip the skill and log
"skipped (unconfigured)"; otherwise sync only the already-configured sources and skip any
source whose `connection` can't be reached, logging "skipped (unreachable)". Never block on
a question — configuration is done by running the skill manually first.

## Output

A short summary per source: items ingested, items skipped (filtered or already seen), and
the new `last_run` per source so the next run knows how far back to go.
