# AIOS console (`aios/`)

A **file-first** web console onto this repo's knowledge base. It is a *read-mostly
window* onto the three knowledge folders at the repo root — `raw/`, `wiki/`, and
`outputs/` — distilled from [`harbormill-aios`](https://aios.harbormill.net) with **no
Supabase, no auth, and no database**. The on-disk markdown files *are* the backend.

## Run it

```bash
cd aios
npm install
npm run dev        # http://127.0.0.1:8080  — app + local File API in one process
```

The local File API is a Vite middleware (`server/fileApi.ts`) mounted in `vite.config.ts`
via **both** `configureServer` and `configurePreviewServer`, so it also works under:

```bash
npm run build && npm run preview
```

By default the API reads the knowledge base at the repo root (the parent of `aios/`).
Override with the `KB_ROOT` environment variable to point at a different clone.

### Other scripts

```bash
npm run typecheck  # tsc --noEmit (strict)
npm run test       # vitest — covers the review parse + checkbox-toggle logic
npm run build      # production build to aios/dist/
```

## What each surface shows

| Surface | Source | Read/write |
|---|---|---|
| **Overview** | `GET /api/kb/stats` | read — counts of raw assets, wiki pages, open reviews, open questions, and recent change-log lines |
| **Wiki** | `GET /api/wiki`, `GET /api/wiki/page?path=` | read — the AI-written table of contents, rendered as markdown |
| **Raw** | `GET /api/raw` | read-only — immutable original assets (path, size, modified) |
| **Review** | `GET /api/outputs/reviews`, `POST /api/outputs/reviews/check` | **the one interactive surface** — toggle a NEEDS SIGN-OFF checkbox |
| **Needs Context** | `GET /api/outputs/needs-context` | read — open MORE CONTEXT questions for the human |
| **Change Log** | `GET /api/outputs/change-log` | read-only — the applied-changes ledger |
| **Assistant** | `GET /api/search?q=` | read — lexical "ask the knowledge base" search (the RAG-ready seam) |

## Write-ownership rule (load-bearing)

The console's **only** write is toggling a single checkbox in an `outputs/review-*.md`
file (`POST /api/outputs/reviews/check` flips `[ ]` ↔ `[x]` in place — no renumbering, no
reordering). It **never** writes `outputs/change-log.md` (skills own that append-only
ledger) and **never** modifies anything in `raw/`. The `improve-system` skill reads which
review ids are checked and applies only those on its next run.

## White-label

All client-facing words/logos live in `src/config/brand.ts`; per-surface toggles live in
`src/config/features.ts`; colors are HSL tokens in `src/index.css`. Flip a feature flag and
the nav item disappears and its route falls back to Overview — no component edits. Overview
is always on.

## Architecture

```
Browser (React + TanStack Query)
   │  fetch('/api/...')
   ▼
Vite middleware (server/fileApi.ts)   ← KB_ROOT || repo root
   │  fs read / one guarded write
   ▼
raw/  (immutable)  →  wiki/  (AI-written TOC)  →  outputs/  (reports + queues)
```

## Phase-4 upgrade path (RAG-ready, currently inert)

The seams are already in place so the upgrade is *purely additive*:

1. **Add Supabase + pgvector.** Embed every `wiki/` page (carries `title`, `source_id`,
   `path`, `tags` frontmatter — already vector-store compatible).
2. **Swap the search seam.** Replace the lexical scorer in `server/fileApi.ts`
   `searchWiki()` with a vector `match_knowledge` RPC. The `/api/search` route shape and the
   Assistant page do not change.
3. **Wire a live agent.** Promote the stub registry in `src/lib/tools.ts` (shaped like
   harbormill's `assistant-chat/tools.ts`) to a real Anthropic tool-use loop. Reference
   implementation: `dragoncandy-v3/supabase/functions/donny-orchestrator/rag.ts` and
   `harbormill-aios/supabase/functions/assistant-chat/tools.ts`.

Nothing about the file contracts or the surfaces changes — the GUI keeps reading the same
shapes.
