---
name: sync-curated-content
description: Use to pull new posts from the creators and publications listed in wiki/sources.md, extract their key claims, tag them, and write the raw content into raw/curated/. Incremental via stored run history. Interviews for fetch method and filters on first run.
---

# sync-curated-content

Incremental sync skill that keeps `raw/curated/` current with the people and publications
you follow (defined in `wiki/sources.md`).

## When to use

On demand or on a schedule. Run manually with zero arguments first to test before scheduling.

## State

- **Sources:** read from `wiki/sources.md` (name, type, URL/handle, topics).
- **Config:** `.claude/skills/sync-curated-content/config.json` — per-source fetch method
  and filters: `{ sources: { <name>: { fetch, include, exclude } } }` (`fetch` is e.g.
  `rss | web | api`).
- **Run-state:** `outputs/runs/sync-curated-content.json` — `{ last_run_finished,
  last_status, cursor: { per_source: { <name>: { since, seen_ids } } }, items_ingested }`.

## Procedure

1. **First run / new source → interview.** For any source in `wiki/sources.md` without a
   config entry, ask how to fetch it (RSS, web, API) and what to filter out; write it to
   `config.json`. Do not hardcode sources here.
2. **Pull only new posts.** For each source, fetch items newer than the cursor; skip
   `seen_ids`. Apply include/exclude filters.
3. **Land the raw content in `raw/curated/`, unaltered.** Save each post verbatim as
   `raw/curated/<source-slug>/<YYYY-MM-DD>-<slug>.md`, recording the original URL inside the
   wiki entry (not by editing the raw file).
4. **Extract + tag in `wiki/`.** Create/update a `wiki/` page that, per post, lists the key
   claims and topic tags and links to the `raw/curated/` file; cross-link from
   `wiki/index.md`. Structural rewrites → `wiki/_candidates/`.
5. **Record state + log.** Advance cursors and append to `outputs/change-log.md`:
   `- <date> — sync-curated-content — N posts from M sources → raw/curated/ — auto`.

## Unattended invocation

When fired by `data-ingestion` / `maintenance-loop` (no human present), do not run the
first-run interview. Sync only sources that already have a `config.json` entry; for any
source listed in `wiki/sources.md` without one, skip it and log "skipped (unconfigured)"
rather than asking how to fetch it. Never block on a question.

## Output

A short summary: new posts per source, key claims extracted, and the new `last_run` cursor.
