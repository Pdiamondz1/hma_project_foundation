/**
 * STUB tool registry — shaped like harbormill-aios's
 * `supabase/functions/assistant-chat/tools.ts`, kept here as the RAG-ready
 * seam. INERT in v1: nothing executes a live agent yet.
 *
 * ── Phase-4 swap ──────────────────────────────────────────────────────────
 * Today the Assistant page calls the lexical `/api/search` endpoint directly.
 * In Phase 4:
 *   1. Add Supabase + pgvector; embed every wiki/ page (OpenAI embeddings).
 *   2. Replace the lexical scorer in server/fileApi.ts `searchWiki()` with a
 *      vector `match_knowledge` RPC — same route shape, no frontend change.
 *   3. Stand up a live agent (Aria/Donny) that calls these tools via the
 *      Anthropic tool-use loop; `execute()` runs server-side against the KB.
 * Reference: dragoncandy-v3/supabase/functions/donny-orchestrator/rag.ts
 *            harbormill-aios/supabase/functions/assistant-chat/tools.ts
 *
 * Each tool keeps the same Anthropic tool schema shape (`name`, `description`,
 * `input_schema`) so the registry is drop-in when the agent arrives.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

export interface Tool {
  definition: ToolDefinition;
  /**
   * Phase-4: runs server-side against the knowledge base / vector store.
   * Inert in v1 — present only to pin the contract.
   */
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

const notWired = async (): Promise<never> => {
  throw new Error(
    "Tool execution is inert in v1. Wire a live agent in Phase 4 (see header)."
  );
};

export const TOOLS: Tool[] = [
  {
    definition: {
      name: "search_knowledge",
      description:
        "Search the wiki/ knowledge base (the AI-written table of contents over raw/) for context. Lexical today; pgvector in Phase 4.",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Natural-language search query" },
        },
        required: ["query"],
      },
    },
    execute: notWired,
  },
  {
    definition: {
      name: "get_wiki_page",
      description:
        "Read one wiki/ page in full (frontmatter + markdown body) by its wiki-relative path.",
      input_schema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Wiki-relative path, e.g. 'index.md'." },
        },
        required: ["path"],
      },
    },
    execute: notWired,
  },
  {
    definition: {
      name: "get_change_log",
      description:
        "Return the applied-changes ledger (outputs/change-log.md). Read-only — the assistant never writes it.",
      input_schema: { type: "object", properties: {} },
    },
    execute: notWired,
  },
  {
    definition: {
      name: "list_review_queue",
      description:
        "List open NEEDS SIGN-OFF items from outputs/review-*.md awaiting a human checkbox.",
      input_schema: { type: "object", properties: {} },
    },
    execute: notWired,
  },
];
