---
name: setup-project
description: Use right after cloning the foundation to specialize it for a new project. Interviews you for the project's name, kind, brand words, and capability tier, then writes the aios/ config (brand, project, features, index.html) and scaffolds aios/.env. Never collects API keys in chat — it leaves secret slots empty for you to fill, and offers to register the scheduled maintenance Routine at the end.
---

# setup-project

The guided "make this clone your project" skill. It turns the generic template into a
branded, typed, tiered project by editing the per-clone config and scaffolding the
environment file — honoring the rules in `CLAUDE.md`.

## When to use

Right after you clone the foundation, or any time you want to re-specialize a clone
(re-running is safe and idempotent — it reads the current config for its defaults).

## Inputs (interview first; zero-argument safe)

Ask these one at a time; on a re-run, read the *current* values from the files below and
offer them as defaults. Skip a question if the user already answered it.

**Plain language by default.** Run the interview in everyday words for everyone: short,
friendly questions one at a time, recommend the simplest path by default (**Tier 0** — no
keys, works offline), and don't volunteer jargon (tiers, embeddings, env vars, Supabase)
unless the user asks. Anyone should be able to finish setup without knowing any of it — you
fill in the technical values for them. Confirm choices back in plain terms, and offer the
deeper options only to someone who wants them.

1. **Project name + one line on what you're building** → `productName`, `tagline`, and a
   short `projectType` slug (e.g. `portfolio-manager`, `research-vault`, `web-app`).
2. **Assistant name + persona** (optional; defaults: name "Ada", persona "a knowledge-base
   search assistant — it finds and cites the wiki pages that answer your question").
3. **Company name + URL** (optional).
4. **Capability tier** — the ladder in `docs/USING-THIS-FOR-ANY-PROJECT.md`. Pick one:
   - **Tier 0 — zero-config (BM25):** *(recommended default — pick this unless the user asks
     for more)* no keys. `EMBEDDINGS=none`; `semanticSearch:false`, `assistant:false`.
   - **Tier 1 — + local embeddings:** `EMBEDDINGS=local`; `semanticSearch:true`. (Offer to
     run `npm run kb:enable-local-embeddings`.)
   - **Tier 2 — + the agent:** `assistant:true`; needs `ANTHROPIC_API_KEY` (user fills).
   - **Tier 3 — + OpenAI embeddings:** `EMBEDDINGS=openai`; needs `OPENAI_API_KEY` (user fills).
   - **Tier 4 — + Supabase:** `KB_STORE=supabase`; needs `SUPABASE_URL` +
     `SUPABASE_SERVICE_ROLE_KEY` (user fills).
   Tiers are cumulative — Tier 3 implies the agent, etc. Map the choice to the capability
   booleans and env values; remember **env is the source of truth for what is LIVE**, the
   `project.ts` booleans are intent.
5. **Surfaces to keep** — the six `features.ts` flags (`wiki`, `raw`, `review`,
   `needsContext`, `changeLog`, `assistant`); default all on. Offer to turn any off.
6. **Reset seeded template content?** — for a fresh clone, offer to clear the seed files so
   you start empty. Confirm explicitly before clearing.

> **Secrets stay out of chat.** Never ask the user to paste an API key, token, or service
> key here, and never write one into a file from the conversation. This skill only sets
> NON-secret values and leaves each secret slot empty with a comment telling the user to
> fill it in `aios/.env` themselves.

## Procedure

Make targeted edits — preserve each file's existing comments and shape; only change the
fields below.

1. **`aios/src/config/brand.ts`** — set `productName`, `tagline`, `assistantName`,
   `assistantPersona`, `company.name`, `company.url`. Leave `logoSrc` / `emblemSrc` unless
   the user supplies their own marks.
2. **`aios/src/config/project.ts`** — set `projectType` and the three
   `capabilities` booleans (`semanticSearch`, `assistant`, `supabase`) per the chosen tier.
3. **`aios/src/config/features.ts`** — flip any surface the user turned off to `false`.
4. **`aios/index.html`** — update the `<title>` and the `<meta name="description">` content.
5. **`aios/.env`** — create it from `aios/.env.example` if absent. Set only the NON-secret
   values for the chosen tier: `EMBEDDINGS`, `KB_STORE`, `PROJECT_TYPE` (mirror
   `projectType`), and `ANTHROPIC_MODEL` if changing it. Leave `ANTHROPIC_API_KEY`,
   `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` **empty**, each with a
   one-line comment naming what the user must paste in. (`aios/.env` is gitignored.)
6. **Optional content reset** (only if confirmed in step 6 of the interview): delete seeded
   files under `raw/curated/`, `raw/ecosystem/`, `raw/inputs/processed/` (keep each
   `.gitkeep`); reset `wiki/index.md` and `wiki/sources.md` to their empty-template state;
   reset `outputs/change-log.md` to the empty ledger. **Never** delete the
   `wiki/_candidates/` or `outputs/runs/` `.gitkeep`s, and never touch anything else in
   `raw/` beyond removing the seed placeholders.
7. **Log it.** Append one attributed line to `outputs/change-log.md`:
   `- <date> — setup-project — specialized clone for "<projectType>" (tier <N>) — applied`.
8. **Offer follow-ups** (don't run without a yes): `cd aios && npm install`; if Tier 1,
   `npm run kb:enable-local-embeddings`; `cd aios && npm run typecheck`; run
   `add-new-resource` to capture a first asset; then `npm run kb:index`.
9. **Offer to schedule autonomy.** Ask if they want the weekly self-improvement Routine.
   If yes, follow `docs/SCHEDULING.md` to register a Claude Code Routine that fires the
   `maintenance-loop` skill (this is the one place a real, account-bound trigger is created
   — only with an explicit yes).
10. **Offer cross-model code review (optional).** Let the user know that `codex-review` is an
    optional add-on that runs cross-model code review via the Codex CLI and can flag critical
    issues during the maintenance loop — point them to `docs/CODE-REVIEW.md` if interested.
    Do not collect or write any API key; the doc has all the setup steps.

## Output

A short summary: every file changed, the exact secret keys the user must still paste into
`aios/.env` to make their chosen tier live, the suggested next commands, and whether a
maintenance Routine was registered.
