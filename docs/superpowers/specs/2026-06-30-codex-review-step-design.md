# Design Spec: Optional embedded `codex-review` — a graceful-off, cross-model code-review gate

> Status: Approved (2026-06-30). Not yet implemented. An OPTIONAL, opt-in capability layered on the
> foundation (Phases 0–6). Call it **Phase 7**. Graceful-off: a clone without the Codex CLI behaves
> exactly as before.

## Context

**Why this is being built.** During the Phase 6 build, Codex (OpenAI's CLI, `codex review`) was used as
a third, cross-model review gate alongside the two Claude review gates — and it earned its keep
(it independently caught an integration gap). That was a *build-time* tool on the maintainer's machine;
**nothing about Codex ships in the template today** (`git grep codex` → none). The user wants that
cross-model review capability *embedded* in the foundation so future work — and the autonomous
maintenance loop — can use it too, while staying optional and safe.

**Decisions (made with the user this session):**
1. **Three surfaces** — (a) **on-demand** "review my work", (b) **gate the autonomous loop** (review what
   `improve-system` changed), (c) **gate project code** (the app's own commits).
2. **Posture → "advisory + auto-caution."** Always write a findings report. In the unattended loop, a
   CRITICAL finding **raises caution** (appends a NEEDS SIGN-OFF item) but never lowers it and never
   hard-blocks. The user's own commits are only hard-gated by an explicit, opt-in, strict-mode hook.
3. **Architecture → Approach A** — one `codex-review` skill (sibling of `improve-system`/`advise-project`)
   with three callers, plus a shell-level sample git hook for the project-commit surface. (Rejected:
   folding into `improve-system`; an AIOS agent tool.)
4. **Graceful-off, optional.** If the `codex` CLI or its auth are absent, every surface skips cleanly
   with a logged note. The OpenAI key lives in the environment; it is **never collected in chat**.

**Intended outcome.** Enable it once (install the Codex CLI + authenticate), and you get: a `codex-review`
skill you run any time; a post-`improve-system` safety net in the weekly tick that flags critical issues
for your sign-off; and an opt-in, advisory-by-default git hook on your project's commits. Disable, ignore,
or never install it, and the foundation is unchanged.

## Architecture

A new propose-only skill plus a shell companion, communicating through files; the skill writes **only**
inside `outputs/`.

```
                         ┌───────────────────────────┐
  "review my changes" ──▶│       codex-review        │──▶ outputs/code-reviews/<date>-<scope>.md
   (you, on demand)      │  1. detect codex or SKIP  │     (findings report, RAG-ready)
  maintenance-loop ─────▶│  2. pick git scope        │
   (after improve-system)│  3. run `codex review`    │──▶ outputs/review-*.md
                         │  4. parse findings+severity│     (ONE auto-caution NEEDS SIGN-OFF item,
                         │  5. write report + act     │      only when max severity ≥ caution_severity)
                         └───────────────────────────┘
   git commit / push ───▶  .githooks/pre-commit (sample, opt-in, pure shell) ──▶ runs `codex review`
```

**Five parts, reusing existing patterns:**
1. **`codex-review` skill** *(new)* — the Claude-invoked path (on-demand + the loop). Propose-only.
2. **`.githooks/pre-commit` (+ `pre-push`)** *(new, sample)* — the project-commit surface. A git hook
   cannot call a Claude skill, so it runs `codex review` directly. **Off** until the user opts in via
   `git config core.hooksPath .githooks`. **Advisory by default** (print + exit 0); strict mode blocks.
3. **`outputs/code-reviews/` reports** *(new)* — one RAG-ready markdown report per run.
4. **The `review-*.md` queue** — reused; the loop's auto-caution appends a standard NEEDS SIGN-OFF item.
5. **`docs/CODE-REVIEW.md`** *(new)* — enabling instructions + the privacy note.

## The `codex-review` skill

Zero-argument and unattended-safe (same discipline as the sync skills / `advise-project`).

### Procedure
1. **Detect availability.** Verify the `codex` CLI is installed (`command -v codex`) and authenticated —
   detect auth via a lightweight `codex login status`-style probe, or attempt-and-catch an auth error on
   the first run. If either check fails: write/log *"codex-review unavailable — install the Codex CLI and
   run `codex login` (or set `OPENAI_API_KEY`)"* and exit cleanly (success, no error). Never block.
2. **Pick the git scope** (see table). If the scope is empty (clean tree / no diff), log
   "nothing to review" and exit.
3. **Run `codex review`** with that scope (e.g. `codex review --base <default_base>` or
   `codex review --uncommitted`), capturing its findings output. (Note: `codex review` takes no custom
   prompt when a scope flag is given — it uses its built-in review.)
4. **Parse findings & severity.** Extract Codex's findings section (not its full working transcript).
   Normalize Codex's priority labels (e.g. `[P1]`) to **CRITICAL / MAJOR / MINOR / INFO** — Codex's top
   priority → CRITICAL; **unknown labels default to MINOR** so nothing silently escalates. Record the
   **max severity** and per-severity counts. **Severity rank (for the `≥` comparison): CRITICAL > MAJOR
   > MINOR > INFO.**
5. **Write the report** to `outputs/code-reviews/<YYYY-MM-DD>-<scope-slug>.md` (RAG-ready frontmatter;
   shape below).
6. **Act per posture (advisory + auto-caution).** Always: the report is the output. **Only when invoked
   by `maintenance-loop` AND max severity ≥ `caution_severity`:** append ONE NEEDS SIGN-OFF item to
   today's `outputs/review-*.md` (creating that file if `improve-system` produced none this tick;
   continue the `rv-YYYYMMDD-NNN` sequence; read current max; never renumber) referencing the report — *"codex-review flagged CRITICAL issues in this tick's changes —
   review before relying on them."* This raises caution; it never un-applies or blocks.
7. **Summarize** — availability, scope reviewed, per-severity counts, report path, any caution flag.

### Scope per caller
| Caller | Scope | Rationale |
|---|---|---|
| On-demand | `--base <default_base>` (default `main`); optional override to `--uncommitted` or `--commit <sha>` | Review the feature branch before merge. |
| Autonomous loop | `--uncommitted`, right after `improve-system` | Reviews exactly what `improve-system` just changed (auto-applied fixes + drafted candidates). |
| Project hook | pre-commit → `--uncommitted`; pre-push → `--base @{upstream}` | Standard commit/push gate. |

### Report shape
```markdown
---
title: Code review — <scope>
source_id: outputs:code-review:<date>-<scope-slug>
reviewed: { base: main, head: <sha>, range: "main...HEAD" }
max_severity: CRITICAL
counts: { critical: 1, major: 2, minor: 3 }
updated: <YYYY-MM-DD>
---

# Codex code review — <scope>

**Scope:** `main...HEAD` · **Reviewer:** codex-cli · **Max severity:** CRITICAL

- **[CRITICAL]** `src/auth.ts:42` — <finding>.
- **[MAJOR]** `src/api.ts:88` — <finding>.
- …
```

### Safety invariants
- **Writes only inside `outputs/`** — a `code-reviews/` report, an optional `outputs/runs/codex-review.json`
  run-state, and (only on a loop auto-caution) a NEEDS SIGN-OFF item appended to `review-*.md`.
- **Never** edits `raw/`, `wiki/`, `.claude/skills/`, or the project's code; **never auto-fixes**;
  **never writes** `change-log.md`. `improve-system` stays the single applier / single change-log writer.
- **Never** collects, reads back, or writes the OpenAI key — it relies on the environment (Codex CLI auth
  or `OPENAI_API_KEY`).
- **Privacy (documented):** `codex review` **sends the reviewed diff to OpenAI**. That is the inherent
  trade of using it — on the user's authorized key, opt-in. Stated in `docs/CODE-REVIEW.md` and the skill.

## The sample git hook (project-code surface)

- Ships `.githooks/pre-commit` (+ `.githooks/pre-push`), **inactive** until `git config core.hooksPath .githooks`.
- **Advisory by default:** runs `codex review` (`--uncommitted` for pre-commit, `--base @{upstream}` for
  pre-push), prints findings, and **exits 0** — honoring "never hard-block by default."
- **Strict mode (opt-in):** with `CODEX_REVIEW_STRICT=1`, a CRITICAL finding **exits non-zero** (blocks the
  commit), bypassable with `git commit --no-verify`.
- If `codex` is not installed/authenticated, the hook **exits 0** (never blocks).
- Pure shell — it does not and cannot invoke the Claude skill; it shares only the `codex review` CLI.
- **Strict-mode CRITICAL detection (shell):** the hook greps `codex review`'s output for Codex's
  top-priority marker (e.g. `[P1]` / "critical"); a match → exit non-zero. This must stay consistent with
  the skill's "Codex top priority → CRITICAL" mapping so the two surfaces don't diverge — the plan defines
  the exact marker and keeps both in step.

## Wiring & configuration

- **`maintenance-loop`** becomes ingest → `improve-system` → **`codex-review`** (if enabled & available) →
  `advise-project`. Its run-log block gains a `codex-review:` line (availability, scope, max severity,
  counts, report path, flags) or `skipped (unavailable)`. `improve-system` is **not modified**.
- **`.claude/skills/codex-review/config.json`** — `enabled` (true; graceful-off self-disables if codex
  absent), `default_base` ("main"), `caution_severity` ("CRITICAL"), `loop_scope` ("uncommitted"),
  `model` (optional codex model override; empty = codex default).
- **`outputs/runs/codex-review.json`** — light run-state (`last_run`, last scope), created on first run.
- **`CLAUDE.md`** — add one line to the Skills list (optional, graceful-off) and a half-line that the
  loop's codex step is optional. Must stay **< 100 lines** (currently 97); per the new maintenance policy,
  keep detail in `docs/CODE-REVIEW.md`, not CLAUDE.md.
- **`setup-project`** — add a light optional offer ("enable cross-model code review?") that points to
  `docs/CODE-REVIEW.md`; it never collects the key.
- **`docs/USING-THIS-FOR-ANY-PROJECT.md`** — list `codex-review` as an optional capability.

## Files

**Create:** `.claude/skills/codex-review/SKILL.md`, `.claude/skills/codex-review/config.json`,
`.githooks/pre-commit`, `.githooks/pre-push`, `docs/CODE-REVIEW.md`, `outputs/code-reviews/.gitkeep`.

**Modify:** `.claude/skills/maintenance-loop/SKILL.md` (optional step 3 + run-log line),
`CLAUDE.md` (one-line skill entry; < 100 lines), `.claude/skills/setup-project/SKILL.md` (optional offer),
`docs/USING-THIS-FOR-ANY-PROJECT.md` (capability mention).

## Verification

- **Authoring sanity:** every flag/path the skill names matches reality — the `codex review` flags
  (`--base`, `--commit`, `--uncommitted`; no custom prompt with a scope flag), the `review-*.md` item
  convention, the run-state JSON shape, and the maintenance-loop run-log format.
- **Graceful-off (no Codex):** with `codex` unavailable, the skill logs "unavailable" and exits 0; the hook
  exits 0; `maintenance-loop` logs `codex-review: skipped (unavailable)`. **This is the default test path —
  the template ships with Codex unconfigured.**
- **With Codex (manual, opt-in):** on a branch with a deliberately bad diff, `codex-review` writes a
  report with normalized severities; a CRITICAL finding in a loop run appends exactly one `rv-` NEEDS
  SIGN-OFF item referencing the report; confirm it wrote **nothing** outside `outputs/` + `review-*.md`
  (no `change-log.md`, no code edits).
- **Hook:** advisory mode prints + exits 0; strict mode exits non-zero on CRITICAL; absent-codex exits 0.
- **maintenance-loop:** order is ingest → improve → codex-review → advise; `improve-system` unchanged and
  still the single applier; the approval-gate guarantee holds.
- **CLAUDE.md:** < 100 lines with the new skill referenced; detail lives in `docs/CODE-REVIEW.md`.

## Out of scope (v1)

- An AIOS console "Code Reviews" panel (the seam is open — reports live in `outputs/` like the change-log;
  a read-only surface mirroring `ChangeLog.tsx` could be added later).
- Auto-fixing or auto-committing review findings.
- A provider-agnostic reviewer abstraction (the design is Codex-specific; other backends are future work).
- Any change to `improve-system`'s role as the single applier / single `change-log.md` writer.
