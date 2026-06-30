---
name: codex-review
description: Optional, graceful-off cross-model code review — wraps the `codex` CLI to run OpenAI-powered review of the current diff. Three callers: on-demand (interactive), maintenance-loop (unattended, after improve-system), or a shell project hook (pre-commit / pre-push). Propose-only: writes only inside `outputs/` (a RAG-ready report in `outputs/code-reviews/` and, on a loop caution, one NEEDS SIGN-OFF item in `outputs/review-*.md`). Never edits code, never applies anything, never blocks. A clone without the codex CLI or an OpenAI API key is completely unaffected.
---

# codex-review

The lightweight, opt-in reviewer. Where `improve-system` looks inward and heals the
foundation, this skill calls the `codex` CLI to apply an OpenAI model's eye to the
current diff — uncommitted work, a branch range, or a single commit. It is
**propose-only**: it writes only inside `outputs/`, never edits code, and never blocks.
A clone without the CLI or a key silently skips the whole skill. `improve-system` stays
the single applier.

## When to use

- **On demand** — run it any time you want a second opinion on staged or unstaged work
  before you commit.
- **Maintenance loop** — it runs after `improve-system`; if findings are severe enough it
  appends a single caution item to today's review queue so nothing is missed unattended.
- **Project hook** — a shell pre-commit or pre-push hook can call it (see Scope per
  caller); the hook, not this skill, handles the git plumbing.

Run manually first to see the report format — it interviews no one and changes nothing
outside `outputs/`.

## Inputs (zero-argument, unattended-safe)

No arguments, no interview — same discipline as the sync skills. Skip any missing signal
gracefully and log the skip; never block on configuration. Read behaviour from
`.claude/skills/codex-review/config.json`:

- `enabled` (default `true`) — set to `false` to disable entirely with no error.
- `default_base` (default `"main"`) — the branch used as the base for on-demand and
  `--base` reviews.
- `caution_severity` (default `"CRITICAL"`) — minimum severity that triggers a NEEDS
  SIGN-OFF item when running inside `maintenance-loop`.
- `loop_scope` (default `"uncommitted"`) — scope used when called by `maintenance-loop`
  (`"uncommitted"` | `"base"`).
- `model` (default `""`) — pass a model name to `codex review` if desired; empty means
  use the codex CLI's own default.

Run-state lives in `outputs/runs/codex-review.json` — `last_run` and `last_scope`.
Create it on the first run if absent.

## Procedure

Run unattended — **do not ask the user questions.** Skip missing signals with a logged
note rather than blocking.

### 1. Detect availability

Check `command -v codex`. If the binary is absent, log:

> codex-review unavailable — install the Codex CLI and run `codex login`
> (or set `OPENAI_API_KEY`).

Then **exit cleanly (exit code 0, never an error, never block).**

If the binary exists, probe auth — attempt a lightweight `codex` auth check (e.g.
`codex login status` or a minimal dry-run) and catch the auth-error response. If
unauthenticated, log the same message above (substituting the actual error) and exit
cleanly.

### 2. Pick the git scope

Read `loop_scope` and `default_base` from `config.json`. Determine the scope as defined
in the **Scope per caller** table. If the chosen scope resolves to an empty diff (clean
tree, no commits since base), log "nothing to review" and exit cleanly.

### 3. Run `codex review`

Invoke `codex review` with the chosen scope flag:

- `codex review --base <default_base>` for a branch range,
- `codex review --uncommitted` for staged + unstaged work,
- `codex review --commit <sha>` for a single commit.

**Important:** with a scope flag, `codex review` uses its own built-in review prompt —
do **not** pass a custom prompt. Capture the full output.

If `model` in `config.json` is non-empty, pass `--model <model>` to the invocation.

### 4. Parse findings and severity

Extract Codex's findings section from the captured output (not the entire transcript).
Normalize Codex's priority labels to the four canonical levels:

| Codex label | Canonical |
|---|---|
| Highest priority (`[P0]`, `[P1]`, or top tier) | **CRITICAL** |
| Mid priority (`[P2]`, `[P3]`, or mid tier) | **MAJOR** |
| Lower priority (`[P4]`, or low tier) | **MINOR** |
| Informational / style notes | **INFO** |
| Unknown / unrecognised label | **MINOR** |

Severity rank (highest → lowest): **CRITICAL > MAJOR > MINOR > INFO**.

Record:
- `max_severity` — the single highest level found across all findings.
- Per-severity counts — `{ critical: N, major: N, minor: N, info: N }`.

### 5. Write the report

Write a RAG-ready report to:

    outputs/code-reviews/<YYYY-MM-DD>-<scope-slug>.md

where `<scope-slug>` is `uncommitted`, `base-<default_base>`, or `commit-<short-sha>`.
See **Report shape** for the file template.

### 6. Act — advisory and auto-caution

The report file is always the output of this skill. The skill **never** un-applies
anything and **never** blocks a commit or push.

**Only** when both conditions hold:
1. The skill was invoked by `maintenance-loop` (not on-demand or from a hook), **and**
2. `max_severity` ≥ `caution_severity` (from `config.json`, default `CRITICAL`):

Append **exactly one** NEEDS SIGN-OFF item to today's `outputs/review-*.md` (create that
file if `improve-system` produced none this tick). Read the current maximum
`rv-YYYYMMDD-NNN` id in that file and continue the sequence — **never renumber or rewrite
existing items, only append**:

    - [ ] `rv-YYYYMMDD-NNN` — codex-review flagged CRITICAL issues in this tick's changes — review before relying on them  ·  target: <files changed>  ·  detail: see outputs/code-reviews/<report-filename>

In all other cases — on-demand runs, hook invocations, or severity below `caution_severity`
— write only the report and summarize. No review item is appended.

### 7. Summarize

Report back:
- Codex CLI availability (found / skipped / auth error).
- Scope reviewed (range, base ref, or commit sha).
- Per-severity counts and `max_severity`.
- Path to the report file.
- Whether a caution item was appended and to which `review-*.md`.

## Scope per caller

| Caller | Scope |
|---|---|
| On-demand | `--base <default_base>` (default `main`); optional override to `--uncommitted` or `--commit <sha>` |
| Autonomous loop | `--uncommitted` (the `loop_scope` default), right after `improve-system` |
| Project hook | pre-commit → `--uncommitted`; pre-push → `--base @{upstream}` (handled by the shell hook, not this skill) |

## Report shape

Each report is a standalone RAG-ready Markdown file:

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

`source_id` uses the stable `outputs:code-review:<date>-<scope-slug>` key so the file
can be indexed by a vector store without rework.

## Safety invariants

> **Propose-only — the user stays the decision-maker.** This skill suggests; it never
> ships.

- **Writes only inside `outputs/`** — `code-reviews/` report files,
  `outputs/runs/codex-review.json` run-state, and (only when running inside
  `maintenance-loop` with severity ≥ `caution_severity`) a single proposal item appended
  to `outputs/review-*.md`. It never *applies* a review item.
- **Never edits** `raw/` (immutable), `wiki/`, `.claude/skills/`, or the project's code
  or product files.
- **Never auto-fixes** any finding, regardless of severity.
- **Never writes** `outputs/change-log.md`. `improve-system` stays the *single* applier
  and the *single* `change-log.md` writer.
- **Never collects, reads back, or writes the OpenAI API key.** The key is read by the
  `codex` CLI from the environment (`OPENAI_API_KEY`) only — this skill never touches it.
- **Privacy note:** `codex review` sends the reviewed diff to OpenAI using the caller's
  API key. This is an explicit opt-in — the skill only runs if the CLI is installed and
  authenticated. Users who have not installed the CLI are completely unaffected.
- **Run-state:** `outputs/runs/codex-review.json` (`last_run`, `last_scope`) is created
  on the first successful run. Nothing else is persisted.
- **Unattended-safe:** no interview; if a signal is missing or the CLI is absent, log and
  exit 0 — never block.

## Output

A short summary: CLI availability, scope reviewed, per-severity counts (`max_severity`),
path to `outputs/code-reviews/<date>-<scope-slug>.md`, and whether a caution item was
appended to `outputs/review-*.md`.
