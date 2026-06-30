# Extending the foundation

Concrete extension points, in rough order of how often you'll reach for them. Pair this
with `docs/USING-THIS-FOR-ANY-PROJECT.md` (the mental model + capability tiers).

## 1. Set your project type & capabilities

`aios/src/config/project.ts` — declare what you're building and which intelligence
features you *want* (env still decides what's actually live):

```ts
export const project: ProjectConfig = {
  projectType: "portfolio-manager",      // surfaced to the agent's system prompt
  capabilities: {
    semanticSearch: true,                // needs EMBEDDINGS env to be live
    assistant: true,                     // needs ANTHROPIC_API_KEY to be live
    supabase: false,                     // needs SUPABASE_* env to be live
  },
};
```

(Also set `PROJECT_TYPE` in `aios/.env` so the server agent agrees; both default to
`general`.) A capability set to `false` hides its surface regardless of env.

## 2. Rebrand (white-label checklist)

No component code changes — just these four:

1. `aios/src/config/brand.ts` — product name, tagline, assistant name, company, tier labels.
2. `aios/src/index.css` — the HSL color tokens (`:root` / `.dark`).
3. `aios/public/logo.svg` + `emblem.svg` — your marks.
4. `aios/index.html` — `<title>` + meta.

## 3. Add an agent tool — the "do anything" lever

This is what makes the agent able to *act* in your domain. Each tool is an `AgentTool`
(`{ name, description, input_schema, handler }`); register it in
`aios/server/assistant/tools.ts` (push to `TOOLS`, or add to `EXAMPLE_TOOLS` / replace
the two examples):

```ts
TOOLS.push({
  name: "log_trade",
  description: "Record a trade for the portfolio and save it under raw/ecosystem/.",
  input_schema: {
    type: "object",
    properties: {
      ticker: { type: "string", description: "Symbol, e.g. AAPL." },
      shares: { type: "number", description: "Share count (negative = sell)." },
    },
    required: ["ticker", "shares"],
  },
  handler: async (input) => {
    // Do the work; return a JSON-serializable value — the model sees it as tool_result.
    return { ok: true };
  },
});
```

Rules of the road: handlers run **server-side**; return JSON-serializable values; never
throw (errors are caught and returned to the model). The only **write** tool that ships is
`propose_review_item`, which appends a NEEDS SIGN-OFF item to today's
`outputs/review-*.md` — it proposes, a human approves, `improve-system` applies. Keep new
write tools behind that same gate when the action is consequential.

## 4. Add a knowledge source

- **One-off:** run the `add-new-resource` skill — it lands the file in `raw/` and indexes
  it in `wiki/`.
- **Recurring external data:** configure `sync-ecosystem-data` (its
  `.claude/skills/sync-ecosystem-data/config.json` — sources + connection + filters).
- **Creators/publications:** add rows to `wiki/sources.md`; `sync-curated-content` reads them.
- After ingesting, run `npm run kb:index` (in `aios/`) to refresh the search index.

## 5. Add a skill

Create `.claude/skills/<name>/SKILL.md` with frontmatter (`name`, `description`) and a
procedure that honors `CLAUDE.md` (raw immutable, wiki AI-written, write only within the
approval gates). Run it manually with zero arguments first. New skills proposed by
`improve-system` land in `wiki/_candidates/` until you approve them.

## 6. Add a console surface

For project-specific UI (a dashboard, a form, a board):

1. `aios/src/pages/MyPage.tsx` — the page (reuse `PageHeader`, `StatCard`, `Card`, the
   `useKb` hooks / `fileApi` client; add a server endpoint in the Vite middleware if you
   need new data).
2. Register a `<Route>` in `aios/src/App.tsx` and a nav entry in
   `aios/src/components/layout/AppLayout.tsx`.
3. Add a flag in `aios/src/config/features.ts` so it can be toggled per clone.

## 7. Add a knowledge-store backend

Implement the `KnowledgeStore` interface (`reindex` / `search` / `stats`) in
`aios/server/kb/store.ts` and wire it into `getActiveStore()`, keyed off an env value
(the shipped `LocalStore` and `SupabaseStore` are the templates). The file API and the
agent both go through `storeSearch`, so a new backend lights up everywhere at once.

## 8. Choose your capability tier

All opt-in via `aios/.env` (copy `aios/.env.example`). See the ladder in
`docs/USING-THIS-FOR-ANY-PROJECT.md`: Tier 0 zero-config (BM25) → local embeddings → the
Anthropic agent → API embeddings → Supabase pgvector. Each tier degrades gracefully if its
key/service is absent — you can't break the console by skipping one.
