# Design Spec: `hma_project_foundation` — a self-improving, RAG-ready project foundation with a file-first AIOS GUI

> Status: Approved (2026-06-29); v1 (Phases 0–3) shipped. **Update 2026-06-30:** Phase 4 (the optional, local-first intelligence layer + the any-project extension kit) also shipped — see `docs/USING-THIS-FOR-ANY-PROJECT.md` and `docs/EXTENDING.md`. **Update 2026-06-30 (Phase 5):** guided setup (`setup-project`) + autonomous scheduling (`maintenance-loop` + Claude Code Routines) shipped — see the Phase 5 addendum at the end and `docs/SCHEDULING.md`.

## Context

**Why this is being built.** A single, reusable **project foundation** to clone when starting new projects, with four capabilities built in from day one: self-learning, self-healing, auto-researching, and 2nd-brain knowledge. The desired behavior is specified by a 13-slide prompt series from @austin.marchese (his reference project is named `personal-os`), plus a "GUI wrapper / AIOS" modeled on `internal.dragoncandy.io` and `aios.harbormill.net`, plus a RAG agent modeled on dragoncandy's "Donny".

**The key reframe from exploration.** `hma_project_foundation` is an empty git repo, but two sibling repos already implement most of this:
- `C:\GIT\dragoncandy-v3-d783432b` — **DC AIOS** (`internal.dragoncandy.io`): an 11-section role-gated React/Supabase operator console + **Donny**, a full RAG agent (OpenAI embeddings + pgvector/FTS retrieval, tool framework, cost ledger, `aios-report-ingest` approval choke point). Business-specific.
- `C:\GIT\harbormill-aios` — **HMA AIOS** (`aios.harbormill.net`): an actively-developed, **already white-label, multi-tenant AIOS** — the generalized version of DC AIOS. Ships the React/Vite/Tailwind/shadcn shell, one-file rebrand (`brand.ts` + `features.ts` + CSS vars), **Aria** (generalized Donny: pluggable tool registry, pgvector RAG), the `report-ingest` choke point, Findings/Corrections approval queues, pg_cron loops, a `docs/wiki/` knowledge base, and `autoresearch`/`wiki-gardener`/`loop-audit` skills.

**Decisions (made with the user this session):**
1. **Foundation strategy → "Distill a generic base."** `hma_project_foundation` becomes the brand-neutral, canonical clone-to-start template, distilled from `harbormill-aios`, with the *missing* austin.marchese skills folded in and RAG-ready seams added. `harbormill-aios` and `dragoncandy` are conceptually instances of it (refactoring them to consume it is **future work, out of this v1**).
2. **v1 GUI → "File-first shell, no DB."** Port the AIOS shell but back it with the on-disk markdown KB + `outputs/` files via a tiny local file API — **no Supabase, no vector DB**. Supabase + vector RAG + a live agent are a later phase.
3. **v1 scope → "Full self-improving suite"** (all seven skills) **+ the file-first GUI.** RAG stays *ready but inert*.

**Intended outcome.** A cloneable repo that, on `git clone`, provides: the strict 3-folder knowledge system + pinned `CLAUDE.md`; the complete austin.marchese skill suite (ingest, sync, orchestrate, self-improve with human gates); and a local AIOS web console that surfaces the knowledge base and the approval queues — all white-label and structured so a Supabase/RAG upgrade is purely additive.

## Architecture

Two cleanly separated layers in one repo, communicating only through files:

```
            ┌─────────────────────────────────────────────────────┐
            │  AIOS GUI (aios/)  — Vite + React + Tailwind + shadcn │
            │  read-only dashboards + review-queue approve actions  │
            └───────────────▲───────────────────┬─────────────────┘
                            │ GET (read)         │ POST (write to outputs/ only)
                ┌───────────┴────────────────────▼────────┐
                │  Local File API (Vite dev middleware)    │
                │  reads raw/ wiki/ outputs/, writes outputs/ │
                └───────────▲──────────────────────────────┘
                            │ files
   ┌────────────────────────┴───────────────────────────────────────┐
   │  Knowledge core (file-based)                                     │
   │  raw/ (immutable) → wiki/ (AI-written TOC) → outputs/ (reports)  │
   │  driven by .claude/skills/* (ingest / sync / improve)            │
   └─────────────────────────────────────────────────────────────────┘
```

- **The skills are the "backend brain"** (Claude Code skills, no runtime). They ingest data into `raw/`, distill it into `wiki/`, and write reports/approval-queues into `outputs/`.
- **The GUI is a read-mostly window** onto those files. Its *only* write is toggling a NEEDS SIGN-OFF checkbox in `outputs/review-*.md` — mirroring the `report-ingest` "single write seam" guarantee from harbormill-aios. It never writes `change-log.md`; skills own that ledger.
- **RAG-ready, not RAG-on:** `wiki/` pages carry frontmatter (`title`, `path`, `tags`, `source_id`); the file API exposes a swappable `search(query)` (lexical now, vector later); the Assistant page and a `tools.ts`-shaped registry exist as stubs. Phase 4 swaps lexical search for pgvector + embeddings and wires a live agent — no structural change.

## Repository structure (target)

```
hma_project_foundation/
├── CLAUDE.md                     # <100 lines: pins the raw/wiki/outputs rules + skill index + approval discipline
├── README.md                     # what this is, quickstart, how to clone for a new project
├── raw/                          # ORIGINAL, immutable assets — never edited/reorganized by hand or AI
│   ├── inputs/processed/.gitkeep #   per-session summaries (sync-claude-sessions)
│   ├── ecosystem/.gitkeep        #   files/email/connected sources (sync-ecosystem-data)
│   ├── curated/.gitkeep          #   creator/publication content (sync-curated-content)
│   └── .gitkeep
├── wiki/                         # AI-written table-of-contents over raw/ — never hand-edited
│   ├── index.md
│   ├── sources.md                #   creators/publications to track (read by sync-curated-content)
│   └── _candidates/.gitkeep      #   proposed wiki changes parked here until approved
├── outputs/                      # generated reports + the self-improving buckets
│   ├── change-log.md             #   AUTO-APPROVE / applied changes ledger
│   └── .gitkeep                  #   review-*.md (NEEDS SIGN-OFF) and needs-context-*.md (MORE CONTEXT) land here
├── .claude/skills/               # the 7 skills (see below)
├── aios/                         # the file-first GUI, distilled from harbormill-aios
│   ├── package.json              #   Vite + React + TS + Tailwind + shadcn (deps mirrored from harbormill-aios)
│   ├── vite.config.ts            #   includes the local file-API middleware plugin
│   ├── src/config/brand.ts       #   white-label words/logos (generic defaults)
│   ├── src/config/features.ts    #   feature flags per surface
│   ├── src/components/layout/AppLayout.tsx   # shell + nav + atmosphere (ported, auth stripped)
│   ├── src/components/ui/*        #   shadcn primitives (ported)
│   ├── src/lib/fileApi.ts         #   typed client for the local file API
│   ├── src/pages/*                #   Overview, Wiki, Raw, Review, NeedsContext, ChangeLog, Assistant
│   └── server/fileApi.ts          #   the read/write file endpoints (mounted as Vite middleware)
└── docs/
    └── superpowers/specs/2026-06-29-hma-project-foundation-design.md   # this spec
```

## Components

### A. Knowledge core (3-folder system + pinned CLAUDE.md)
- `raw/` immutable; `wiki/` AI-written only; `outputs/` generated. `CLAUDE.md` (<100 lines) pins these rules, the skill index, and the approval discipline so every session honors them. Faithful to slides 1–2.
- Seed `wiki/index.md` + `wiki/sources.md` as empty-but-structured starting points (do **not** compile the wiki — raw starts empty).

### B. The 7 skills (`.claude/skills/<name>/SKILL.md` + folder)
Each follows its slide exactly; each **interviews before building** and **runs manually with zero arguments** before any scheduling. Routine wiki maintenance (e.g. `add-new-resource` and the sync skills creating/updating topical index pages) writes to `wiki/` directly; only *structural* rewrites and *new/edited skills* require sign-off (proposals go to `wiki/_candidates/`).

| Skill | Job (from slides) | Reads | Writes |
|---|---|---|---|
| `add-new-resource` | Utility: add a file to `raw/`, then update/create the `wiki/` entries that reference it | a dropped file | `raw/`, `wiki/` |
| `sync-claude-sessions` | New sessions in `~/.claude/projects/` since last run → one clean summary each | session history | `raw/inputs/processed/` |
| `sync-ecosystem-data` | Pull new data from connected sources (files, email, Slack, transcripts) since last run, tag by topic | `[LOCATIONS]` | `raw/ecosystem/` + light wiki indexes |
| `sync-curated-content` | Read `wiki/sources.md`, pull new posts, extract key claims, tag | `wiki/sources.md` | `raw/curated/` |
| `data-ingestion` | Orchestrator: run the 3 sync skills back-to-back; log run history (no gaps, no re-ingest) | run-log | run-log JSON + summary |
| `improve-system` | Self-improvement pass → sort every change into AUTO-APPROVE / NEEDS SIGN-OFF / MORE CONTEXT | recent activity | `outputs/change-log.md`, `outputs/review-*.md`, `outputs/needs-context-*.md` |
| `human-improve-system` | Human-in-the-loop: walk through review / notify on Slack when needed | `outputs/review-*.md` | (notifications) |

Run-history is a small JSON per sync skill (`last_run`, `cursor`) so re-runs are incremental and idempotent. Concretely: per-skill config (sources/filters) lives in `.claude/skills/<skill>/config.json`; run-state in `outputs/runs/<skill>.json`; the orchestrator's run log in `outputs/runs/data-ingestion.md` — the pattern proven by harbormill-aios's loops + dragoncandy's `donny-knowledge-sync`. `human-improve-system`'s notify target (e.g. Slack) lives in `.claude/skills/human-improve-system/config.json`.

### C. File-first AIOS GUI (`aios/`) — distilled from `harbormill-aios`
- **Port and keep (generic):** `src/config/brand.ts`, `src/config/features.ts`, `components/layout/AppLayout.tsx` (strip `useAuth`/`useAccess` → local single-user/no-auth), `components/ui/*` (shadcn), `PageHeader`/`StatCard`/`MarkdownProse`/`EmptyState` primitives, Tailwind theme tokens (`src/index.css`), the atmosphere/blueprint-grid styling.
- **Replace the data layer:** harbormill's hooks call `supabase.rpc(...)`; here the same TanStack-Query hooks call the **local file API** (`src/lib/fileApi.ts` → `fetch('/api/...')`).
- **Local file API** (`aios/server/fileApi.ts`, mounted as a Vite dev-server middleware so `npm run dev` serves app + API with no separate process):
  - `GET /api/kb/stats` — counts of raw/wiki/outputs + recent `change-log` entries
  - `GET /api/wiki`, `GET /api/wiki/:path` — list (frontmatter) + render
  - `GET /api/raw` — list raw assets (read-only)
  - `GET /api/outputs/reviews` — parse `review-*.md` into checkbox items (each with a stable `id`); `POST /api/outputs/reviews/:id/check` — toggle that item's box in place (the only GUI write; does **not** touch `change-log.md`)
  - `GET /api/outputs/needs-context`, `GET /api/outputs/change-log`
  - `GET /api/search?q=` — lexical search over `wiki/` (the swappable RAG-ready seam)
- **Pages** (each feature-flagged + brand-driven), mapping austin.marchese buckets → AIOS surfaces:
  Overview (KB stats + recent activity) · Wiki (browse/render) · Raw (read-only asset list) · **Review Queue** (`review-*.md` → checkbox approve = NEEDS SIGN-OFF) · **Needs Context** (`needs-context-*.md` = MORE CONTEXT) · **Change Log** (`change-log.md` = applied) · Assistant (a simple "ask the knowledge base" panel that renders `/api/search` results — not a simulated chat; this is the RAG seam, not a live agent).

### C.1 `outputs/` file contracts (pinned for cross-phase agreement)

`improve-system` (Phase 2) writes these; the GUI Review Queue (Phase 3) reads/toggles them. Pinning the format now keeps the Phase 2 → Phase 3 boundary safe.

- **`review-*.md`** — YAML frontmatter (`title`, `source_id: outputs:review-<date>`, `generated_by`, `updated`) followed by checkbox items, each with a stable id that is never renumbered or rewritten once issued (new items are appended):

      - [ ] `rv-YYYYMMDD-NNN` — <concise change>  ·  target: <path>  ·  detail: <what changes>

  The file API's `:id` is this `rv-...` token. `improve-system` reads which ids are checked and applies only those on its next run.
- **`needs-context-*.md`** — frontmatter + a list of open questions for the human (free text).
- **`change-log.md`** — append-only, **written by skills only** (never the GUI). One attributed line per applied change: `- <date> — <skill> — <what> — <auto|applied>`.

### D. RAG-ready seams (inert in v1)
- `wiki/` frontmatter schema (`source_id`, `title`, `path`, `tags`) compatible with dragoncandy's `donny_knowledge` rows.
- `aios/src/lib/tools.ts` — a `harbormill-aios/assistant-chat/tools.ts`-shaped registry (search_knowledge, get_latest_briefing…) as stubs.
- A documented Phase-4 upgrade path: add Supabase + pgvector, point a `knowledge-sync` at `wiki/`, swap `/api/search` lexical → vector, wire `assistant-chat`. Reference: `dragoncandy-v3/supabase/functions/donny-orchestrator/rag.ts`, `dragoncandy-v3/supabase/functions/donny-knowledge-sync/index.ts`.

## Build phasing (delivery order within v1)

- **Phase 0 — Knowledge foundation (slides 1–2).** Repo scaffold, 3 folders + `.gitkeep`s, `CLAUDE.md` (<100 lines), `README.md`, seeded `wiki/index.md` + `wiki/sources.md`, and the `add-new-resource` skill. *Shippable: the immutable-raw / AI-wiki / outputs system works.*
- **Phase 1 — Ingest + sync (auto-research / self-learning).** `sync-claude-sessions`, `sync-ecosystem-data`, `sync-curated-content`, `data-ingestion` orchestrator + run-history JSON.
- **Phase 2 — Self-improvement (self-healing).** `improve-system` (the 3 approval buckets writing to `outputs/`) + `human-improve-system`.
- **Phase 3 — File-first AIOS GUI.** Scaffold `aios/`, port the shell + ui + config from harbormill-aios, build the file-API middleware + the 7 pages, white-label defaults.
- **Phase 4 — DEFERRED (not this v1):** Supabase + pgvector + embeddings + live Aria/Donny agent; and refactoring `harbormill-aios`/`dragoncandy` to consume the distilled base.

## Files to extract / reference (concrete)

- **Port & generalize from `harbormill-aios`:** `src/config/brand.ts`, `src/config/features.ts`, `src/components/layout/AppLayout.tsx`, `src/components/ui/*`, `src/index.css`, `package.json` (deps + `dev/build/typecheck/lint/test` scripts), `scripts/setup-client.mjs` + `scripts/sync-wiki.mjs`, `docs/{white-label,extending,client-setup}.md`; model the write-seam on `supabase/functions/report-ingest/index.ts`; model the RAG-ready registry on `supabase/functions/assistant-chat/tools.ts`.
- **Skill specs:** the 13 slides in `C:\Users\dwill\Desktop\AI_project_foundation\` (IMG_8436–8448).
- **Phase-4 RAG reference:** `dragoncandy-v3/supabase/functions/donny-orchestrator/rag.ts`, `dragoncandy-v3/supabase/functions/donny-knowledge-sync/index.ts`.

## Verification

- **Skills (run each manually, zero args):**
  - `add-new-resource`: drop a sample file → it lands in `raw/`, a `wiki/` entry referencing it is created/updated; `raw/` original untouched.
  - sync skills: each writes to its target `raw/*` folder and records run-history; a second run is incremental (no re-ingest).
  - `data-ingestion`: runs all three; run-log shows no gaps.
  - `improve-system`: produces `outputs/review-*.md` (checkbox list) + `needs-context-*.md`; applies only checked items on the next run; logs to `change-log.md`. **Assert the guarantee:** no edits to `.claude/skills/` or `wiki/` root for a NEEDS SIGN-OFF item without an approved checkbox.
- **GUI:** `cd aios && npm install && npm run dev`; load the app and confirm Overview stats reflect the files, Wiki/Raw render, the Review Queue lists checkbox items, and checking one writes back to the `.md` **and** appends to `change-log.md`. Then `npm run typecheck && npm run lint && npm run build` pass. Optionally screenshot the running console via the Claude-in-Chrome MCP.
- **White-label sanity:** edit `brand.ts` (productName/assistantName) + a `features.ts` flag → nav + titles update and the disabled surface disappears, with zero component edits.

## Out of scope for v1
- Supabase, auth, vector DB, embeddings, and a live RAG agent (Phase 4).
- Refactoring `harbormill-aios` / `dragoncandy` to consume the distilled base.
- Personal-data ingest specifics (life-story recording, full email export) beyond providing the `raw/ecosystem/` + `sync-ecosystem-data` plumbing.

## Phase 5 addendum — guided setup + autonomous scheduling (2026-06-30)

Two additions that turn "built" into "usable by anyone, autonomously." They add no new
runtime dependencies and change no existing contracts — both are skills plus docs.

- **`setup-project` skill** (`.claude/skills/setup-project/`). The guided "make this clone
  your project" flow. Interviews for name, project type, brand words, capability tier, and
  surfaces, then makes targeted edits to `aios/src/config/{brand,project,features}.ts` and
  `aios/index.html`, and scaffolds `aios/.env` from `aios/.env.example`. **Safety:** it never
  collects API keys in chat — it sets only non-secret env values and leaves each secret slot
  empty with a fill-in comment (`env.ts` already treats an absent key as "capability off", so
  this degrades gracefully). It logs one `applied` line to `change-log.md` and, on an explicit
  yes, offers to register the maintenance Routine. Idempotent: a re-run reads current config
  for its defaults. It does NOT mutate `raw/` beyond optionally clearing seed placeholders.
- **`maintenance-loop` skill** (`.claude/skills/maintenance-loop/`) + **Claude Code Routines**.
  The portable autonomous tick a schedule fires: run `data-ingestion`, then `improve-system`,
  unattended, logging a block to `outputs/runs/maintenance-loop.md`. Safety rides entirely on
  the existing approval gates — `improve-system` only auto-applies its AUTO-APPROVE bucket and
  already-checked items; nothing structural/skill-related is applied without a checked box. To
  support unattended runs, the three sync skills + `data-ingestion` gained an "Unattended
  invocation" note: no first-run interview; skip unconfigured/unreachable sources with a logged
  "skipped (unconfigured)". Scheduling is via a Claude Code Routine firing `maintenance-loop`
  (recommended weekly); the repo ships **no live trigger** (it wouldn't generalize across
  clones) — `setup-project` registers one in the user's environment on opt-in. Alternatives
  (Windows Task Scheduler, GitHub Actions) and tradeoffs are documented in `docs/SCHEDULING.md`.

## Phase 6 addendum — proactive project advisor (2026-06-30)

The `advise-project` skill ships as the outward-facing counterpart to `improve-system`. It
reads the KB, ingested activity, and the `raw/metrics/` feed, then files ranked project ideas
to `outputs/ideas-*.md` for the user's approval across four lenses (improve / scale / maintain /
pattern). It is propose-only and never applies changes — `improve-system` stays the single
applier. It rides the `maintenance-loop` tick as step 3, so ideas accumulate on the same weekly
schedule with no new scheduling needed. Full design:
`docs/superpowers/specs/2026-06-30-proactive-project-advisor-design.md`.

## Phase 8 addendum — Project discovery (`define-project`) (2026-06-30)

The `define-project` skill ships a discovery-interview flow that grills the user — one
question at a time, with proposed options and a recommended default when answers are thin —
across five dimensions: purpose, audience, success, scope, and constraints. The raw Q&A
record lands append-only in `raw/project/<YYYY-MM-DD>-discovery.md`; the distilled north
star is written (or updated on a pivot) to `wiki/charter.md` and pinned at the top of
`wiki/index.md`.

Integration wired in this phase:
- **`setup-project`** — charter check runs before the interview; pre-fills name/type/tagline
  from the charter if present, or offers to run `define-project` first.
- **`advise-project`** — "Project identity" signal now reads `wiki/charter.md` (richer
  purpose/audience/success/constraints) when present, falling back to `project.ts`/`brand.ts`.
- **`what-can-i-do`** — "Get clear on your project" is the first menu item.
- **`CLAUDE.md`** — `define-project` listed in the skills index; `raw/project/` added to the
  `raw/` subfolder list with a pointer to `wiki/charter.md` as the north star.

## Phase 9 addendum — Design discovery (`define-design`) (2026-06-30)

Phase 9 adds the design layer: the `define-design` skill grills the user into a **design
system** (`wiki/design-system.md`, the look-and-feel north star Claude reads before building
any UI) covering style, color, type, and voice, with append-only Stitch exports landing in
`raw/design/`. It is Google Stitch–aware (manual default; optional Stitch MCP when a Google
AI key is present) and offers to theme the console. Full design:
`docs/superpowers/specs/2026-06-30-define-design-design.md`.

## Phase 10 addendum — Idea vetting (`roast` + `storm-research`)

A vet-before-you-build gate: two embedded skills — `roast` (a 5-persona council + GO/RESHAPE/KILL
Judge) and `storm-research` (a citation-verified, multi-perspective HTML briefing) — write vetting
artifacts to `outputs/vetting/<date>-<slug>/` and index them in `wiki/vetting.md`. `roast` is Tier 0;
`storm-research` needs the built-in web tools and refuses rather than fabricates offline. Wired into
`define-project` (draft-gate offer), `what-can-i-do`, and `advise-project` (on-demand only). Full
design: `docs/superpowers/specs/2026-06-30-idea-vetting-design.md`; how-to: `docs/IDEA-VETTING.md`.

## Phase 11 addendum — Build the app (`build-app`) (2026-06-30)

Phase 11 closes the loop from **define → vet → design → build**: the `build-app` skill turns the
charter (the MVP scope) + design system (the theme) + latest vetting verdict into a working, themed
front-end **web app** in a new top-level `app/` folder — its own minimal Vite + React + TypeScript +
Tailwind project (mirroring the `aios/` stack), wired to mock/local data and runnable with
`npm run dev`. It is attended-only (one screen-plan confirm gate; never in the unattended
`maintenance-loop`), Tier 0 (no keys, no backend, offline-safe scaffolding), and re-runnable
(incremental, never clobbers). Provenance lands in the knowledge base — an immutable
`raw/builds/<date>-<slug>.md` record per build and an AI-written `wiki/build.md` index — while `app/`
itself is a build target outside the three-folder discipline, like `aios/`. Wired into
`what-can-i-do`, `setup-project` (propose-only once a charter + design exist), and `advise-project`
(a GO-vetted brief may point to it). The `raw/builds/` + `wiki/build.md` provenance is written
generically so future `build-mobile` / `build-plugin` slices slot in without rework. Full design:
`docs/superpowers/specs/2026-06-30-build-app-design.md`; how-to: `docs/BUILD-APP.md`.

## Phase 12 addendum — Build the mobile app (`build-mobile`) (2026-06-30)

Phase 12 adds the phone sibling of `build-app`: the build step is now **web *or* mobile**. The
`build-mobile` skill turns the same three north-stars — charter (the MVP scope) + design system (the
theme) + latest vetting verdict — into a working, themed **Expo (React Native)** app in a new top-level
`mobile/` folder: its own **Expo + Expo Router + NativeWind + TypeScript** project, themed from the same
13 HSL tokens as the web app. You preview it on a phone by scanning a QR code with the free **Expo Go**
app — no Mac, no Xcode. Like `build-app` it is attended-only (one screen-plan confirm gate; never in the
unattended `maintenance-loop`), Tier 0 (mock/local data, no keys/accounts/backend, offline-safe
scaffolding), and re-runnable (incremental, never clobbers — it owns everything under `mobile/`,
including its theme). Expo Router's routes live in `mobile/app/`, distinct from the web `app/` (no
collision); `mobile/` is a build target outside the three-folder discipline, like `aios/` and `app/`.
Provenance rides the **shared** `raw/builds/` + `wiki/build.md` spine — now carrying a `target`
dimension (records tagged `target: mobile`; `wiki/build.md` gains a Mobile app section alongside Web).
Wired into `what-can-i-do`, `setup-project` (propose-only once a charter + design exist), and
`advise-project` (a GO-vetted brief may point to it). Installable app-store builds (EAS + an Expo
account) and plugins remain later slices. Full design:
`docs/superpowers/specs/2026-06-30-build-mobile-design.md`; how-to: `docs/BUILD-MOBILE.md`.
