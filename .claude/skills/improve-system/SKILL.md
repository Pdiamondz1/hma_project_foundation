---
name: improve-system
description: Single-pass self-improvement. Reviews recent activity and the knowledge base for problems (wiki contradictions, broken links, stale pages, coverage gaps, skill friction, repeated tasks worth a skill, bloat), then sorts every proposed change into AUTO-APPROVE / NEEDS SIGN-OFF / MORE CONTEXT and acts within the approval gates. Also applies previously human-approved items.
---

# improve-system

The self-healing loop. One pass: find what could be better, then route each change through
the right gate. It is the ONLY skill that applies NEEDS SIGN-OFF items and the ONLY writer
of `outputs/change-log.md`.

## When to use

Periodically (e.g. after an ingest, or on a schedule), and whenever you want pending
human-approved changes applied. Run manually first to see what it proposes.

## Procedure

### 1. Apply what the human already approved
Read the most recent open `outputs/review-*.md`. For every item whose box is checked
(`- [x] rv-...`), apply that change now, then append an `applied` line to
`outputs/change-log.md`:
`- <date> — improve-system — applied <rv-id>: <what> — applied`.
Leave unchecked items as-is. **Never apply an unchecked NEEDS SIGN-OFF item, and never
touch `.claude/skills/` or `wiki/` root for one without its checked box.**

### 2. Scan for opportunities
Read recent change-log entries, recently ingested `raw/` + `wiki/` pages, and recent
sessions. Look for: wiki contradictions, broken links, stale/duplicate pages, coverage
gaps, skill-friction patterns, tasks repeated 3+ times (a skill candidate), and bloat
worth removing.

### 3. Sort every proposed change into one bucket
- **AUTO-APPROVE** (low-risk: fix a broken link, a typo, a stale date): apply directly and
  log an `auto` line to `outputs/change-log.md`.
- **NEEDS SIGN-OFF** (skill edits, new skill candidates, structural wiki rewrites,
  resolving a contradiction): append to today's `outputs/review-YYYY-MM-DD.md` as a
  checkbox item with a stable id — never renumber or rewrite existing pending items:

      - [ ] `rv-YYYYMMDD-NNN` — <concise change>  ·  target: <path>  ·  detail: <what changes>

  For a new-skill candidate, draft the `SKILL.md` into `wiki/_candidates/skills/<name>/`
  (NOT `.claude/skills/`) and reference it from the review item.
- **MORE CONTEXT** (ambiguous; you can't decide alone): append a question to
  `outputs/needs-context-YYYY-MM-DD.md`.

### 4. Summarize
Report counts per bucket, what was auto-applied, and what now awaits the human in
`review-*.md` / `needs-context-*.md`.

## Notes
- Idempotent: an `rv-id` already present in `change-log.md` is not re-applied.
- The AIOS GUI and `human-improve-system` only *check boxes* and *answer questions*; this
  skill is what acts on them.
