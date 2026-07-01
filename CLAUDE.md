# CLAUDE.md — Project Foundation operating rules

This repository is a **self-improving project foundation**. It pairs a file-based
knowledge base (the "second brain") with Claude Code skills that grow and maintain it,
plus a file-first AIOS web console (`aios/`) that surfaces it.

These rules are load-bearing. Honor them in every session.

**Maintaining this file:** Keep it lean — invariants and pointers only; elaboration goes in docs/skills.
Condense *wording*, never a *rule*; raise the line cap before dropping a directive.

## The three-folder knowledge system

- **`raw/` — original, immutable assets.** Anything ingested lands here *unaltered*.
  Never edit, rewrite, reorganize, rename, or delete anything inside `raw/`. It is
  append-only: add new files, never mutate existing ones. `raw/` is the ground truth
  everything else points back to.
  - `raw/inputs/processed/` — clean per-session summaries of Claude Code history
  - `raw/ecosystem/` — files, email, transcripts, and connected-source data
  - `raw/curated/` — content pulled from tracked creators/publications
  - `raw/metrics/` — live usage snapshots (DAU etc.) the advisor reads
  - `raw/project/` — `define-project` discovery record; the north star lives at `wiki/charter.md`
  - `raw/design/` — `define-design` Stitch exports; the look-and-feel north star lives at `wiki/design-system.md`
  - `raw/builds/` — `build-app` build records; the app itself lives in `app/` (a build target outside the knowledge system, like `aios/`)

- **`wiki/` — the AI-written table of contents over `raw/`.** Written and maintained
  *only* by AI, never by hand. Every wiki page is a distilled, navigable index that
  references the underlying `raw/` files it summarizes. Keep pages small and
  cross-linked. Do not paste raw content here — reference it.
  - `wiki/index.md` — the master index
  - `wiki/sources.md` — creators/publications to track
  - `wiki/_candidates/` — proposed wiki changes await sign-off here (see below)

- **`outputs/` — generated reports and the self-improvement queues.**
  - `outputs/change-log.md` — append-only ledger of applied changes
  - `outputs/review-*.md` — NEEDS SIGN-OFF checkbox lists (do not apply until checked)
  - `outputs/needs-context-*.md` — MORE CONTEXT questions for the human
  - `outputs/ideas-*.md` — ranked project ideas from the proactive advisor (approve by checkbox)
  - `outputs/vetting/` — `roast` verdicts + `storm-research` briefings (indexed in `wiki/vetting.md`)

## Wiki page frontmatter (RAG-ready)

Every `wiki/` page opens with YAML frontmatter — `title`, `source_id`, `path`, `tags`,
`updated` — so it can later be embedded into a vector store with no rework. Exact template +
field notes: `docs/WIKI-FRONTMATTER.md` (or copy the header of any existing `wiki/` page).

## Approval discipline (how the system stays safe)

- **Normal wiki maintenance is allowed directly.** Skills doing their job — e.g.
  `add-new-resource` and the sync skills creating/updating topical index pages — write to
  `wiki/` directly. What needs sign-off is *structural* change (reorganizing, merging or
  renaming many pages, changing conventions) and any *new or edited skill*; those go to
  `wiki/_candidates/` or `outputs/review-*.md` and wait.
- The `improve-system` skill sorts every proposed change into one of three buckets:
  - **AUTO-APPROVE** — low-risk fixes; apply directly and log to `outputs/change-log.md`.
  - **NEEDS SIGN-OFF** — skill edits, new skills, structural rewrites, contradictions;
    write to `outputs/review-*.md` as a checkbox list and wait.
  - **MORE CONTEXT** — ambiguous calls; write to `outputs/needs-context-*.md` as questions.
- **`review-*.md` item format.** Each item carries a stable id the GUI and the skill both
  depend on; never renumber or rewrite existing pending items — append new ones:

      - [ ] `rv-YYYYMMDD-NNN` — <concise change>  ·  target: <path>  ·  detail: <what changes>

- **Write ownership.** `outputs/change-log.md` is an append-only ledger written *by skills*
  when they apply a change (each line attributed to its skill, `auto` or `applied`). The
  AIOS GUI never writes it — the GUI's *only* mutation is toggling a checkbox in
  `outputs/review-*.md`, which `improve-system` reads on its next run.

## Skills (the brain)

Run any skill manually with zero arguments first; it interviews you before acting. Sync
skills are incremental: per-skill config (sources/filters) lives in the skill's folder as
`config.json`; run-state (last run + cursor) in `outputs/runs/<skill>.json`; the
orchestrator's run log in `outputs/runs/data-ingestion.md`.

- **`setup-project`** — specialize a fresh clone (brand, project type, capability tier, `aios/.env`); offers to schedule autonomy. Run this first after cloning.
- **`define-project`** — interview that grills you into a clear **project charter** (`wiki/charter.md`): purpose, audience, success, scope; proposes options when unsure; re-run on a pivot. The north star other skills read.
- **`define-design`** — interview that grills you into a **design system** (`wiki/design-system.md`, the look-and-feel north star Claude reads before building any UI): style, color, type, voice. Google Stitch–aware (manual default; optional MCP); offers to theme the console. See `docs/DESIGN-SYSTEM.md`.
- **`roast`** — convene a 5-persona council that pressure-tests an idea, then a Judge returns one **GO / RESHAPE / KILL** verdict + the cheapest 48-hour test; saves the verdict to `outputs/vetting/` and can commission `storm-research`. Triggers: "roast" / "convene the council" / "brutal second opinion" / `/roast`.
- **`storm-research`** — turn a topic or idea into a verified, multi-perspective HTML briefing (5 expert lenses → contradiction map → self-review + primary-source citation checks → `outputs/vetting/<date>-<slug>/`). Needs web; refuses rather than fabricates offline. See `docs/IDEA-VETTING.md`.
- **`build-app`** — turn the charter (the MVP scope) + design system (the theme) into a working, themed front-end **web app** in a new top-level `app/` folder (its own Vite+React project, like `aios/`), runnable with `npm run dev`. Attended, Tier 0 (mock data, no keys); one confirm gate; re-runnable; **never in the unattended loop**. Web-first (mobile/plugins later). See `docs/BUILD-APP.md`.
- **`what-can-i-do`** — show a friendly menu of everyday actions for anyone unsure what to do next.
- **`add-new-resource`** — add a file into `raw/`, then index it in `wiki/`.
- **`sync-claude-sessions`** — summarize new `~/.claude/projects/` sessions → `raw/inputs/processed/`.
- **`sync-ecosystem-data`** — pull new connected-source data → `raw/ecosystem/` (+ light wiki indexes).
- **`sync-curated-content`** — pull new posts from `wiki/sources.md` → `raw/curated/`.
- **`data-ingestion`** — orchestrator: run the three sync skills back-to-back (no gaps, no re-ingest).
- **`improve-system`** — single self-improvement pass; sorts changes into the three buckets, applies approved ones.
- **`human-improve-system`** — walk you through pending reviews / notify on Slack.
- **`maintenance-loop`** — the autonomous tick a schedule fires: `data-ingestion` → `improve-system` → `codex-review (optional)` → `advise-project`, unattended (no interviews, skips unconfigured sources), logged to `outputs/runs/maintenance-loop.md`.
- **`advise-project`** — propose-only: reads the KB + activity + `raw/metrics/` and files ranked project ideas to `outputs/ideas-*.md` for your approval; never applies changes; rides the `maintenance-loop` tick.
- **`codex-review`** — optional, graceful-off: cross-model code review via the Codex CLI; writes findings to `outputs/code-reviews/`; in the loop a CRITICAL finding files a sign-off item (advisory, never blocks); off unless the Codex CLI is installed — see `docs/CODE-REVIEW.md`.

**Autonomy.** Schedule `maintenance-loop` weekly via a Claude Code Routine — see `docs/SCHEDULING.md`.
The template ships no live trigger; `setup-project` offers to register one in your environment.

## Be welcoming to everyone

- Greet each person as a capable, normal user; keep it plain by default. On a fresh clone offer `setup-project` (explained simply — no need to know skill names); accept everyday requests and pick the right skill, or offer `what-can-i-do` if they seem unsure. Default to Tier 0 (no keys, offline); bring up tiers/keys/the console only if asked.
- Report back plainly; if something breaks, explain it simply and offer to fix it.

## Pointers

- Design spec: `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`. The AIOS console (`aios/`) is file-first — reads this KB, writes only to `outputs/`.
