# Optional Embedded codex-review Gate (Phase 7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional, graceful-off `codex-review` skill (wrapping the `codex` CLI) plus a sample git hook, so the foundation can run cross-model code review on demand, as a post-`improve-system` safety net in the autonomous loop, and on project commits — without affecting any clone that doesn't have Codex installed.

**Architecture:** A new propose-only Claude Code skill (sibling of `improve-system`/`advise-project`) that detects the `codex` CLI, runs `codex review` against a git scope, writes a findings report to `outputs/code-reviews/`, and — only in the loop, only on a CRITICAL finding — appends one NEEDS SIGN-OFF item to `review-*.md`. A pure-shell sample git hook covers the project-commit surface (advisory by default, opt-in strict mode). `improve-system` is not modified.

**Tech Stack:** Claude Code skills (markdown `SKILL.md` + `config.json`), POSIX `sh` git hooks, the `codex` CLI (`codex review --base|--commit|--uncommitted`), the existing file-based KB (`outputs/`, `review-*.md` conventions).

**Spec:** `docs/superpowers/specs/2026-06-30-codex-review-step-design.md`

**Nature of this work:** almost entirely **authoring** (a skill, shell hooks, docs, config) — there is no new TypeScript and no unit-test framework for skills/shell here, so tasks are verified **structurally** (content covers the spec; JSON/shell parse) and **behaviorally** (graceful-off exit codes), exactly like Phase 6's Part A. Do NOT invent a test harness.

**Working discipline (load-bearing):**
- **Graceful-off is the headline property.** A clone without the `codex` CLI must be completely unaffected: the skill logs "unavailable" and exits cleanly, the hook exits 0, the loop logs "skipped (unavailable)". Verify this path explicitly.
- **`improve-system` is NOT touched** — it stays the single applier / single `change-log.md` writer. codex-review only *appends* a proposal item to `review-*.md` (like `advise-project`'s foundation lane).
- **The OpenAI key never enters chat or a committed file.** It lives in the environment (`codex login` or `OPENAI_API_KEY`).
- **Do NOT run a real `codex review` against this repo as a "test"** that costs API calls or commits review output — verify graceful-off (codex-absent) and `sh -n`/structural checks instead. (Codex *is* installed on this machine, but real reviews are the user's opt-in, not a build step.)
- Commit after each task. Windows LF→CRLF warnings are harmless.

---

## File Structure

| Path | Create/Modify | Responsibility |
|---|---|---|
| `.claude/skills/codex-review/SKILL.md` | Create | The skill procedure: detect→scope→run→parse→report→act. Propose-only. |
| `.claude/skills/codex-review/config.json` | Create | `enabled`, `default_base`, `caution_severity`, `loop_scope`, `model`. |
| `outputs/code-reviews/.gitkeep` | Create | Holds the per-run findings reports. |
| `.githooks/pre-commit` | Create | Sample, opt-in, pure-shell pre-commit gate (advisory default, strict opt-in). |
| `.githooks/pre-push` | Create | Sample, opt-in pre-push gate (reviews vs upstream). |
| `docs/CODE-REVIEW.md` | Create | How to enable (install + auth + activate), the severity model, the privacy note. |
| `.claude/skills/maintenance-loop/SKILL.md` | Modify | Insert optional codex-review as step 3; renumber; add run-log + State + Output mentions. |
| `CLAUDE.md` | Modify | One-line skill entry (optional, graceful-off). Stays **< 100 lines**. |
| `.claude/skills/setup-project/SKILL.md` | Modify | A light optional offer to enable code review (points to the doc; never collects a key). |
| `docs/USING-THIS-FOR-ANY-PROJECT.md` | Modify | List `codex-review` as an optional capability. |

**Severity contract (shared by skill + hook — keep consistent):** Codex's top-priority **bracketed** marker (e.g. `[P1]` / `[CRITICAL]`) → **CRITICAL**; unknown labels → **MINOR**. Rank: **CRITICAL > MAJOR > MINOR > INFO**. (The shell hook greps the bracketed marker specifically, so prose like "no critical issues" can't false-trigger a strict-mode block.)

---

## Task 1: Scaffolding — config + report dir

**Files:**
- Create: `.claude/skills/codex-review/config.json`
- Create: `outputs/code-reviews/.gitkeep`

- [ ] **Step 1: Create the config**

`.claude/skills/codex-review/config.json` with EXACTLY:
```json
{
  "enabled": true,
  "default_base": "main",
  "caution_severity": "CRITICAL",
  "loop_scope": "uncommitted",
  "model": ""
}
```

- [ ] **Step 2: Create the report dir keeper**

Create `outputs/code-reviews/.gitkeep` (empty file).

- [ ] **Step 3: Verify**

Run: `node -e "JSON.parse(require('fs').readFileSync('.claude/skills/codex-review/config.json','utf8'));console.log('config ok')"` → expect `config ok`.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/codex-review/config.json outputs/code-reviews/.gitkeep
git commit -m "feat(codex-review): scaffold config + code-reviews output dir"
```

---

## Task 2: The `codex-review` skill

**Files:**
- Create: `.claude/skills/codex-review/SKILL.md`

- [ ] **Step 1: Write the SKILL.md**

Frontmatter: `name: codex-review` + a `description` naming: optional/graceful-off, wraps the `codex` CLI, cross-model code review, three callers (on-demand / maintenance-loop / project hook), propose-only (writes only `outputs/` + a caution `review-*.md` item), never collects the key. Body sections: `When to use`, `Inputs (zero-argument, unattended-safe)`, `Procedure`, `Scope per caller`, `Report shape`, `Safety invariants`, `Output`. Mirror the house style of `.claude/skills/advise-project/SKILL.md` (read it first). The Procedure MUST encode the spec exactly:

1. **Detect availability** — `command -v codex`; check auth via a lightweight `codex login status`-style probe (or attempt-and-catch an auth error). If unavailable, log *"codex-review unavailable — install the Codex CLI and run `codex login` (or set `OPENAI_API_KEY`)"* and **exit cleanly (no error, never block).**
2. **Pick the git scope** (see the Scope table) — read `loop_scope`/`default_base` from `config.json`. If the chosen scope has no diff (clean tree), log "nothing to review" and exit.
3. **Run `codex review`** with that scope (`codex review --base <default_base>` or `--uncommitted` or `--commit <sha>`). NOTE: when a scope flag is given, `codex review` takes **no** custom prompt — it uses its built-in review. Capture the output.
4. **Parse findings & severity** — extract Codex's findings section (not its whole transcript). Normalize Codex's priority labels (e.g. `[P1]`) to **CRITICAL / MAJOR / MINOR / INFO** (Codex top priority → CRITICAL; **unknown → MINOR**). Record **max severity** + per-severity counts. Rank: **CRITICAL > MAJOR > MINOR > INFO**.
5. **Write the report** to `outputs/code-reviews/<YYYY-MM-DD>-<scope-slug>.md` (RAG-ready frontmatter — see Report shape).
6. **Act (advisory + auto-caution)** — the report is always the output. **Only when invoked by `maintenance-loop` AND `max_severity >= caution_severity`:** append ONE NEEDS SIGN-OFF item to today's `outputs/review-*.md` (create that file if `improve-system` produced none this tick; continue the `rv-YYYYMMDD-NNN` sequence — read current max id; never renumber) referencing the report, e.g. `` - [ ] `rv-YYYYMMDD-NNN` — codex-review flagged CRITICAL issues in this tick's changes — review before relying on them  ·  target: <files>  ·  detail: see outputs/code-reviews/<report> ``. **Never** un-apply, **never** block.
7. **Summarize** — availability, scope reviewed, per-severity counts, report path, any caution flag raised.

The **Scope per caller** section is this table:

| Caller | Scope |
|---|---|
| On-demand | `--base <default_base>` (default `main`); optional override to `--uncommitted` or `--commit <sha>` |
| Autonomous loop | `--uncommitted` (the `loop_scope` default), right after `improve-system` |
| Project hook | pre-commit → `--uncommitted`; pre-push → `--base @{upstream}` (handled by the shell hook, not this skill) |

The **Report shape** section includes this template:
```markdown
---
title: Code review — <scope>
source_id: outputs:code-review:<date>-<scope-slug>
reviewed: { base: <base>, head: <sha>, range: "<range>" }
max_severity: <SEV>
counts: { critical: N, major: N, minor: N }
updated: <YYYY-MM-DD>
---

# Codex code review — <scope>

**Scope:** `<range>` · **Reviewer:** codex-cli · **Max severity:** <SEV>

- **[CRITICAL]** `path:line` — <finding>.
- ...
```

The **Safety invariants** section MUST state: writes only inside `outputs/` (`code-reviews/` reports, `outputs/runs/codex-review.json` run-state, and — only on a loop auto-caution — a `review-*.md` item); never edits `raw/`/`wiki/`/`.claude/skills/`/project code; never auto-fixes; never writes `change-log.md`; **`improve-system` stays the single applier**; never collects/reads-back/writes the OpenAI key (env only); and the **privacy note** — `codex review` sends the reviewed diff to OpenAI (opt-in, user's key). Run-state `outputs/runs/codex-review.json` (`last_run`, last scope) is created on first run.

- [ ] **Step 2: Verify (structural)**

Confirm: frontmatter has `name` + `description`; Procedure covers detect-and-exit-0, the scope table, the severity normalization + rank, the report template, the auto-caution rule (loop-only, append-one-review-item, never-block), and the safety invariants incl. the privacy note. Every path it names is real or created-on-first-run.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/codex-review/SKILL.md
git commit -m "feat(codex-review): add the codex-review skill (graceful-off, propose-only)"
```

---

## Task 3: The sample git hooks

**Files:**
- Create: `.githooks/pre-commit`
- Create: `.githooks/pre-push`

- [ ] **Step 1: Write `.githooks/pre-commit`**

```sh
#!/bin/sh
# codex-review pre-commit hook (SAMPLE — opt-in, advisory by default).
# Activate:  git config core.hooksPath .githooks
# Strict (block on CRITICAL):  export CODEX_REVIEW_STRICT=1
# Bypass anytime:  git commit --no-verify
#
# Graceful-off: if codex isn't installed, do nothing.
if ! command -v codex >/dev/null 2>&1; then
  exit 0
fi

echo "[codex-review] reviewing staged changes..."
output=$(codex review --uncommitted 2>&1)
status=$?
printf '%s\n' "$output"

# Never block on a tooling/auth failure.
if [ "$status" -ne 0 ]; then
  echo "[codex-review] codex unavailable (exit $status) — skipping gate."
  exit 0
fi

# Strict mode only: block on a CRITICAL (Codex top-priority) finding.
if [ "${CODEX_REVIEW_STRICT:-0}" = "1" ]; then
  if printf '%s\n' "$output" | grep -Eiq '\[P1\]|\[CRITICAL\]'; then
    echo "[codex-review] STRICT: CRITICAL finding(s) — commit blocked. Fix, or bypass: git commit --no-verify"
    exit 1
  fi
fi
exit 0
```

- [ ] **Step 2: Write `.githooks/pre-push`**

```sh
#!/bin/sh
# codex-review pre-push hook (SAMPLE — opt-in). See .githooks/pre-commit for notes.
if ! command -v codex >/dev/null 2>&1; then
  exit 0
fi

base=$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || echo "main")
echo "[codex-review] reviewing changes vs $base..."
output=$(codex review --base "$base" 2>&1)
status=$?
printf '%s\n' "$output"

if [ "$status" -ne 0 ]; then
  echo "[codex-review] codex unavailable (exit $status) — skipping gate."
  exit 0
fi

if [ "${CODEX_REVIEW_STRICT:-0}" = "1" ]; then
  if printf '%s\n' "$output" | grep -Eiq '\[P1\]|\[CRITICAL\]'; then
    echo "[codex-review] STRICT: CRITICAL finding(s) — push blocked. Bypass: git push --no-verify"
    exit 1
  fi
fi
exit 0
```

- [ ] **Step 3: Mark executable + verify syntax**

```bash
git update-index --add --chmod=+x .githooks/pre-commit .githooks/pre-push
sh -n .githooks/pre-commit && sh -n .githooks/pre-push && echo "shell syntax ok"
```
Expected: `shell syntax ok`.

- [ ] **Step 4: Verify graceful-off behavior (codex-absent path)**

Simulate codex not being on PATH by pointing PATH at a guaranteed-empty dir, and confirm the hook exits 0 without invoking codex:
```bash
PATH="$(mktemp -d)" sh .githooks/pre-commit; echo "exit=$?"
```
Expected: `exit=0` with no codex output. An empty PATH guarantees the codex-absent branch is taken, so this can never accidentally run a real `codex review` (unlike `PATH=/usr/bin`, which is only an approximate fallback).

- [ ] **Step 5: Commit**

```bash
git add .githooks/pre-commit .githooks/pre-push
git commit -m "feat(codex-review): add sample opt-in git hooks (advisory default, strict mode)"
```

---

## Task 4: `docs/CODE-REVIEW.md`

**Files:**
- Create: `docs/CODE-REVIEW.md`

- [ ] **Step 1: Write the doc**

A one-page guide covering: (a) **what it is** — optional cross-model code review via the Codex CLI, off until enabled; (b) **enable it** — install the Codex CLI, authenticate (`codex login`, or set `OPENAI_API_KEY` — note this reuses the same key slot Tier 3 embeddings uses), then it's available to the `codex-review` skill and the loop; (c) **on-demand** — ask Claude to "review my changes" (runs `codex review --base main`); (d) **autonomous loop** — when enabled, `maintenance-loop` runs it after `improve-system`; a CRITICAL finding files a NEEDS SIGN-OFF item (advisory, never blocks); (e) **project hook** — activate with `git config core.hooksPath .githooks`; advisory by default, `export CODEX_REVIEW_STRICT=1` to block on CRITICAL, bypass with `--no-verify`; (f) the **severity model** (CRITICAL > MAJOR > MINOR > INFO; `caution_severity` default CRITICAL); (g) the **privacy note** — `codex review` sends the reviewed diff to OpenAI on your authorized key. Keep CLAUDE.md-policy-style: this doc holds the detail so CLAUDE.md stays a pointer.

- [ ] **Step 2: Verify**

Confirm all six topics + the privacy note are present; any relative links resolve.

- [ ] **Step 3: Commit**

```bash
git add docs/CODE-REVIEW.md
git commit -m "docs(codex-review): how to enable + severity model + privacy note"
```

---

## Task 5: Wire codex-review into `maintenance-loop`

**Files:**
- Modify: `.claude/skills/maintenance-loop/SKILL.md`

- [ ] **Step 1: Insert the optional step**

In the Procedure, insert a NEW step **3. Code review (optional)** between the current step 2 (Improve) and step 3 (Advise), and renumber Advise→4, Log→5, Flag→6. The new step:

> **3. Code review (optional).** If `codex-review` is enabled and the `codex` CLI is available, run it on `improve-system`'s `--uncommitted` changes. It writes a findings report to `outputs/code-reviews/`; on a CRITICAL finding it appends ONE NEEDS SIGN-OFF item to `review-*.md` (advisory — it never un-applies or blocks). If `codex` is unavailable, it logs `skipped (unavailable)` and the tick proceeds. `improve-system` is unchanged by this step.

Update the **## State** run-log bullet and the **## Output** summary to also record the `codex-review` line (availability, max severity, counts, report path, any caution flag). Update the frontmatter `description` to mention the optional codex-review step.

- [ ] **Step 2: Verify**

Confirm: the loop now reads ingest → improve → codex-review → advise → log → flag; the codex step is explicitly optional + graceful-off + advisory; run-log/Output mention codex-review; `improve-system` is described as unchanged.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/maintenance-loop/SKILL.md
git commit -m "feat(codex-review): optional codex-review step in maintenance-loop (after improve-system)"
```

---

## Task 6: CLAUDE.md entry + setup-project offer + USING mention

**Files:**
- Modify: `CLAUDE.md`
- Modify: `.claude/skills/setup-project/SKILL.md`
- Modify: `docs/USING-THIS-FOR-ANY-PROJECT.md`

- [ ] **Step 1: Record CLAUDE.md line count**

Run: `wc -l CLAUDE.md` → note it (currently 97; hard cap **< 100**).

- [ ] **Step 2: Add the CLAUDE.md skill entry + keep the loop chain accurate**

Add ONE bullet to the Skills list immediately after the `advise-project` entry, in the **same `- **\`name\`** — …` format** the sibling skill bullets use (leading `- `, bolded backticked name). Content: *`codex-review` — optional, graceful-off: cross-model code review via the Codex CLI; writes findings to `outputs/code-reviews/`, and in the loop a CRITICAL finding files a sign-off item (advisory, never blocks); off unless the Codex CLI is installed — see `docs/CODE-REVIEW.md`.*

Also update the existing `maintenance-loop` bullet's chain (same line, no new line) so the optional step shows: `data-ingestion → improve-system → codex-review (optional) → advise-project`.

Keep detail in `docs/CODE-REVIEW.md` per the "Maintaining this file" policy — one line for the skill. If these push the file to 100+, condense wording elsewhere (never a rule).

- [ ] **Step 3: setup-project optional offer**

In `.claude/skills/setup-project/SKILL.md`, add a light optional follow-up (near the existing "Offer follow-ups" / "Offer to schedule autonomy" steps): offer to point the user to `docs/CODE-REVIEW.md` to enable cross-model code review. It MUST NOT collect or write any API key — it only links the doc.

- [ ] **Step 4: USING capability mention**

In `docs/USING-THIS-FOR-ANY-PROJECT.md` (near the capability/infra ladder), add a one-line mention that `codex-review` is an optional capability (needs the Codex CLI + OpenAI auth) → see `docs/CODE-REVIEW.md`.

- [ ] **Step 5: Verify**

Run: `wc -l CLAUDE.md` → must be **< 100**. Then `git grep -n "codex-review" CLAUDE.md docs/USING-THIS-FOR-ANY-PROJECT.md .claude/skills/setup-project/SKILL.md` shows the three mentions; the `docs/CODE-REVIEW.md` links resolve.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md .claude/skills/setup-project/SKILL.md docs/USING-THIS-FOR-ANY-PROJECT.md
git commit -m "docs(codex-review): pin skill in CLAUDE.md (<100) + setup-project offer + USING mention"
```

---

## Final: close-out

- [ ] **Step 1: Graceful-off sanity (the headline property)**

Confirm a clone WITHOUT codex is unaffected: `sh -n` passes on both hooks; the codex-absent hook path exits 0; the SKILL.md + maintenance-loop step both specify detect-and-skip. `CLAUDE.md` < 100 lines.

- [ ] **Step 2: No pollution**

`git status` clean; no real `outputs/code-reviews/*.md` report committed (only `.gitkeep`); no key anywhere (`git grep -i "sk-" || echo none`); `improve-system/SKILL.md` unchanged (`git diff --stat main -- .claude/skills/improve-system` is empty).

- [ ] **Step 3: Update memory**

Note Phase 7 (optional codex-review) in `MEMORY.md` / `hma-foundation-overview.md`.

- [ ] **Step 4: Push** (only if the user asks).

---

## Verification checklist (maps to the spec)

- [ ] Graceful-off on all three surfaces (skill exits 0, hook exits 0, loop logs skipped) when codex absent.
- [ ] Auto-caution appends exactly ONE `rv-` NEEDS SIGN-OFF item, loop-only, on `max_severity >= caution_severity`; never un-applies, never blocks.
- [ ] `improve-system` untouched; still the single applier / single `change-log.md` writer.
- [ ] Hook advisory by default (exit 0); strict mode blocks on CRITICAL; absent-codex exits 0; CRITICAL marker (`[P1]`/critical) consistent with the skill's mapping.
- [ ] Key never in chat or committed; privacy note (diff → OpenAI) documented in `docs/CODE-REVIEW.md` + the skill.
- [ ] `CLAUDE.md` < 100 lines with the one-line skill entry; detail in `docs/CODE-REVIEW.md`.
- [ ] maintenance-loop order ingest → improve → codex-review → advise; run-log records the codex-review line.
