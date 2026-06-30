/**
 * Per-clone PROJECT configuration — the "what kind of project is this" lever.
 *
 * A cloner sets `projectType` to describe their build (web app, portfolio
 * manager, research vault, …) and flips `capabilities` to declare which
 * intelligence features they *want*. This composes with `features.ts`
 * (per-surface on/off) to gate the Assistant surface and an optional Knowledge
 * status.
 *
 * IMPORTANT — env is the source of truth for what is actually LIVE. These flags
 * are client intent; the server mirrors real capability from environment
 * variables (see server/env.ts `getCapabilities`) and the Assistant page asks
 * `/api/assistant/status` before showing the chat UI. So with `assistant: true`
 * here but no ANTHROPIC_API_KEY, the surface still degrades to the search panel.
 *
 * To customize for your clone:
 *   1. Set `projectType` (also settable server-side via the PROJECT_TYPE env var
 *      so the agent's system prompt agrees — default "general" matches here).
 *   2. Flip a capability to `false` to hide that surface regardless of env.
 */
import { features } from "./features";

export interface ProjectConfig {
  /** Free-text project kind, surfaced to the agent. Default "general". */
  projectType: string;
  capabilities: {
    /** Vector/semantic retrieval is desired (needs EMBEDDINGS env to be live). */
    semanticSearch: boolean;
    /** The Anthropic agent surface is desired (needs ANTHROPIC_API_KEY to be live). */
    assistant: boolean;
    /** The Supabase store is desired (needs SUPABASE_* env to be live). */
    supabase: boolean;
  };
}

export const project: ProjectConfig = {
  projectType: "general",
  capabilities: {
    semanticSearch: true,
    assistant: true,
    supabase: false,
  },
};

/** The Assistant surface shows only when the feature flag AND project intent agree. */
export function assistantSurfaceEnabled(): boolean {
  return features.assistant && project.capabilities.assistant;
}

/** Whether to show the optional Knowledge status (backend/embeddings) badge. */
export function knowledgeStatusEnabled(): boolean {
  return project.capabilities.semanticSearch || project.capabilities.supabase;
}
