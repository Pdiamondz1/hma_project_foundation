# Using this foundation for *any* project

This repo is **not an app — it's a foundation.** You clone it and specialize it into
whatever you're building: a web or mobile app, a workflow/automation, a portfolio or
data manager, a research second-brain — anything. Every project gets the same spine
(a disciplined knowledge base, a self-improving skill loop, and an operator console),
and you bolt your specifics on top.

## The mental model — four layers, all generic

1. **Knowledge core** — `raw/` (immutable inputs) → `wiki/` (AI-written index) → `outputs/`
   (reports + approval queues). This is your project's memory. Works for any domain.
2. **Skills (the brain)** — `.claude/skills/*` ingest data, keep the wiki current, and run a
   self-improvement loop behind human approval gates. Domain-agnostic; you add your own.
3. **AIOS console (`aios/`)** — a local, file-first web "operating deck" onto the knowledge
   base and the approval queues. White-label. Add your own surfaces.
4. **Intelligence (optional)** — semantic search + an Anthropic agent with an *extensible
   tool registry* (the "do anything" surface). Entirely opt-in; off by default.

Nothing above assumes a domain. You make it *your* project by turning a few knobs.

## Specialize it in six moves

**Fast path:** run the **`setup-project`** skill — it does moves 1–2 for you (interviews you,
then writes `project.ts`, `brand.ts`, `features.ts`, `index.html`, and scaffolds `aios/.env`
for your chosen tier), and offers to schedule the loop. The moves below are what it sets, and
how to do them by hand.

1. **Name it & rebrand.** Set your project in `aios/src/config/project.ts`
   (`projectType`), then rebrand via `aios/src/config/brand.ts` + the color tokens in
   `aios/src/index.css` + the assets in `aios/public/`. (See `docs/EXTENDING.md` →
   *Rebrand checklist*.)
2. **Choose your surfaces & capabilities.** Toggle console surfaces in
   `aios/src/config/features.ts`; toggle intelligence in `project.ts`
   (`capabilities: { semanticSearch, assistant, supabase }`).
3. **Bring your data in.** Point the sync skills at your sources (each interviews you on
   first run) or use `add-new-resource` for one-offs. `raw/` fills, the `wiki/` index grows.
4. **Teach the agent your domain.** Register tools in
   `aios/server/assistant/tools.ts` — this is the lever that makes the agent able to *do*
   your project's work, not just answer questions.
5. **Add your own UI.** Drop new pages in `aios/src/pages/` + nav for anything
   project-specific (a dashboard, a form, a kanban — whatever your project needs).
6. **Pick your infra tier.** Start at zero-config; climb only as far as you need (below).

Then **make it autonomous:** schedule the `maintenance-loop` skill (ingest → self-improve → advise) to
run weekly so the system keeps itself current and proactively proposes project ideas without you.
See `docs/SCHEDULING.md`; the advisor reads live usage data from the [metrics feed](METRICS-FEED.md).

## The capability / infra ladder

Climb only as high as your project needs. **Tier 0 is the default and needs nothing** —
no keys, no cloud, no account. Each higher tier is purely additive and set with env vars
in `aios/.env` (copy from `aios/.env.example`).

| Tier | What you get | How to turn it on |
|---|---|---|
| **0 — Zero-config** *(default)* | File-first console + skills + **BM25** keyword search + the search-panel Assistant | nothing — `npm install && npm run dev` |
| **1 — Local semantic search** | Meaning-based search over your wiki, fully offline, no keys | `EMBEDDINGS=local` + enable the optional local model, then `npm run kb:index` |
| **2 — The live agent** | A conversational assistant that uses the tool registry to act on your project | set `ANTHROPIC_API_KEY` (+ optional `ANTHROPIC_MODEL`) |
| **3 — API embeddings** | Higher-quality semantic search without a local model | set `OPENAI_API_KEY`, `EMBEDDINGS=openai`, then reindex |
| **4 — Cloud / multi-user** | Postgres + pgvector knowledge store for scale & sharing | `KB_STORE=supabase` + `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`; run `aios/supabase/migrations/0001_knowledge.sql` |

If a key or service isn't present, the system **degrades gracefully** — e.g. no
`ANTHROPIC_API_KEY` ⇒ the Assistant is just the search panel; no embeddings ⇒ search falls
back to BM25. You can never end up with a broken console because you skipped a tier.

**Optional capability:** `codex-review` adds cross-model code review (needs the Codex CLI + OpenAI auth) and can surface CRITICAL findings as sign-off items in the maintenance loop — see `docs/CODE-REVIEW.md`.

## Recipes by project type

These are *knob settings*, not separate apps — the same foundation, configured.

- **Web / SaaS app.** Build your product in its own codebase; use this foundation as the
  product's **brain + internal ops deck**. Register product actions as agent tools (move a
  record, send a draft) and let `improve-system` watch for issues. Climb to Tier 4 when the
  product is multi-user.
- **Workflow / automation.** Lean on the skills + `data-ingestion` orchestrator and an agent
  whose tools *perform the steps*. Use `outputs/review-*.md` as the human-approval gate for
  anything risky. Often happy at Tier 0–2.
- **Portfolio / data manager.** Model each entity as a `raw/` asset with a `wiki/` index
  page; add agent tools to record and query entries. Move to Tier 4 (Supabase) when you want
  real querying/sharing at scale.
- **Research / second brain.** Closest to the default: configure `sync-curated-content`
  sources in `wiki/sources.md`, turn on Tier 1–2, and let the wiki + agent compound. This is
  the foundation almost as-shipped.

## What stays true for every project

- `raw/` is immutable; `wiki/` is AI-written; `outputs/` is generated. (See `CLAUDE.md`.)
- Agents propose; **humans approve** — nothing reaches `.claude/skills/` or `wiki/` root, and
  no NEEDS SIGN-OFF item is applied, without a checked box.
- One config file rebrands everything; one env file sets your capability tier.

Next: `docs/EXTENDING.md` for concrete "add a skill / source / tool / surface / store"
steps and the rebrand checklist.
