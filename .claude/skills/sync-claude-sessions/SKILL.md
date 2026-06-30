---
name: sync-claude-sessions
description: Use to ingest recent Claude Code session history into the knowledge base. Reads ~/.claude/projects/ for sessions newer than the last run and writes one clean summary per session into raw/inputs/processed/. Narrow by design — no cross-session analysis, no skill suggestions (those belong to improve-system).
---

# sync-claude-sessions

Incremental sync skill. Its only job: turn new Claude Code conversations into clean,
reusable per-session summaries under `raw/inputs/processed/`.

## When to use

On demand, or on a schedule, to keep the knowledge base current with what you've been
doing in Claude Code. Run it manually with zero arguments first to confirm it behaves.

## State

- **Run-state:** `outputs/runs/sync-claude-sessions.json` — `{ last_run_finished,
  last_status, cursor: { processed_session_ids, since }, items_ingested }`.
- No per-skill config needed (the source is always `~/.claude/projects/`).

## Procedure

1. **Find new sessions.** Read `outputs/runs/sync-claude-sessions.json` (treat a missing
   file as "never run"). List sessions in `~/.claude/projects/` and select those not in
   `cursor.processed_session_ids` and newer than `cursor.since`.
2. **Summarize each, one file per session.** Write
   `raw/inputs/processed/<YYYY-MM-DD>-<slug>.md` with the wiki frontmatter schema plus a
   concise summary: what the session set out to do, key decisions, what shipped, and any
   reusable lessons stated. Keep it tight — a summary, not a transcript. If your folder
   structure suggests a better location, propose it before writing.
3. **Stay narrow.** Do NOT do cross-session analysis or propose skills here — that is
   `improve-system`'s job. Do NOT edit anything already in `raw/`.
4. **Record state + log.** Update the run-state file (append new session ids, set
   `last_run_finished`, `items_ingested`). Append one line to `outputs/change-log.md`:
   `- <date> — sync-claude-sessions — summarized N sessions → raw/inputs/processed/ — auto`.

## Output

A short summary: how many new sessions were found and summarized, the files written, and
the new `last_run` timestamp.
