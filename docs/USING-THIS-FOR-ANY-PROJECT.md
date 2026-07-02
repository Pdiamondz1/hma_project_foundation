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

**Define it first:** run **`define-project`** before specializing — a short discovery interview that captures your purpose, audience, and success criteria in `wiki/charter.md`, which `setup-project` will then read to pre-fill most questions.

**Then define how it looks:** run **`define-design`** — a design-discovery interview that captures your style, palette, and voice in `wiki/design-system.md` (the look-and-feel north star), is Google Stitch–aware, and can theme the console.

**Then vet the idea:** run **`roast`** for a brutal GO / RESHAPE / KILL second opinion before you build, and (optionally) **`storm-research`** for a citation-verified HTML briefing — both saved to `outputs/vetting/`. See `docs/IDEA-VETTING.md`.

**Then build it:** run **`build-app`** — it turns the charter (the MVP scope) + design system (the theme) into a working, themed front-end web app in a new top-level `app/` folder, runnable with `npm run dev`. Prefer a phone app? Run **`build-mobile`** for a themed Expo (React Native) app in a `mobile/` folder you preview on your phone via a QR code (Expo Go). Prefer a browser extension? Run **`build-plugin`** for a themed Manifest V3 extension in a `plugin/` folder you load into Chrome via Developer mode. All are Tier-0 front-end MVPs (mock data, no keys); real data/accounts/deploy, installable/app-store builds, and Chrome Web Store submission are later tiers. See `docs/BUILD-APP.md` · `docs/BUILD-MOBILE.md` · `docs/BUILD-PLUGIN.md`.

**Or do it all in one go:** run **`autopilot`** — describe your goal once and it grills you, vets + researches the idea, shows you one plan to confirm, then runs the whole define→vet→design→build chain hands-off, **building one platform or several (web + phone + extension in a single run)** (pausing only on a "stop" verdict), logging every call for you to review after — and, once it's built, filing a ranked list of next moves to `outputs/ideas-*.md` (propose-only). Tier 0; user-initiated, never unattended. See `docs/AUTOPILOT.md`.

**Then make it real:** once you've built an app, run **`build-backend`** — it upgrades your `app/` from placeholder data to a real Supabase backend (schema derived from your data + a graceful-off data layer that keeps the app running on sample data until you add keys + email sign-in + tests), then hands you a 5-minute go-live checklist. Real data is the first rung of the full **path to production** (`docs/PATH-TO-PRODUCTION.md`): real data → testing → audit → deploy → a go/no-go ship-check → polish. The safety-sensitive rungs (keys, deploy, publish) always stay scaffold-and-checklist — you do the actual go-live. See `docs/BUILD-BACKEND.md`.

**Then prove it works:** run **`test-app`** — it generates a real, runnable test suite (Vitest + Testing Library + Playwright + coverage) for your `app/` and maps it to your charter's success criteria, so the tests check *your* definition of done, not just that code runs. Scaffolds offline; it hands you one command to run them. This is the second rung of the path to production. See `docs/TEST-APP.md`.

**Then prove it's safe:** run **`audit-app`** — it reads your `app/` and writes one prioritized report on security, accessibility (WCAG), and performance: what to fix, most serious first, with how to fix it. It's **propose-only** (changes nothing), reasons fully offline, and offers the deeper `npm audit` / Lighthouse checks without running them. This is the third rung of the path to production. See `docs/AUDIT-APP.md`.

**Under the hood:** the template ships a tuned fleet of specialist subagents (`.claude/agents/`) that does the grunt work — the right model per job, read-only by default — so building is cheaper, safer, and consistent. See `docs/SUBAGENTS.md`.

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

**Optional capability:** the **Stitch MCP** lets `define-design` generate and pull UI designs from Google Stitch directly (needs a Google AI key in `aios/.env`); without it, `define-design` works fully in manual mode — see `docs/DESIGN-SYSTEM.md`.

**Optional capability:** `storm-research` produces a verified, multi-perspective HTML briefing from five expert lenses with primary-source fact-checking (uses the built-in web tools — no key; refuses rather than fabricates offline) — see `docs/IDEA-VETTING.md`.

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
