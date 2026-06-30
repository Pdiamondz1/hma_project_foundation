/**
 * Tiny, zero-dependency `.env` loader + capability detection.
 *
 * GRACEFUL-OFF CONTRACT: with no `aios/.env` this is a complete no-op and the
 * console behaves EXACTLY as v1 (lexical/BM25 search, search-panel Assistant).
 * Every capability below is opt-in via an environment variable and degrades to
 * the v1 behavior when its key is absent.
 *
 * Importing this module has the side effect of loading `aios/.env` ONCE (values
 * already present in `process.env` win — we never clobber a real env var).
 */
import { readFileSync, existsSync } from "node:fs";
import { ENV_FILE } from "./kb/paths";

let loaded = false;

/** Parse `KEY=VALUE` lines from `aios/.env` into process.env (no heavy dep). */
export function loadDotEnv(file: string = ENV_FILE): void {
  if (loaded) return;
  loaded = true;
  if (!existsSync(file)) return;
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!key || key.startsWith("export ")) {
      // tolerate `export KEY=val`
    }
    const cleanKey = key.replace(/^export\s+/, "");
    let value = line.slice(eq + 1).trim();
    // Strip surrounding single or double quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[cleanKey] === undefined) {
      process.env[cleanKey] = value;
    }
  }
}

// Load on first import so any downstream env read sees aios/.env.
loadDotEnv();

export type StoreKind = "local" | "supabase";
export type EmbeddingsMode = "local" | "openai" | "none";

export interface Capabilities {
  /** Vector retrieval is *intended* (a provider is configured). */
  semanticSearch: boolean;
  /** The Anthropic agent is enabled (ANTHROPIC_API_KEY present). */
  assistant: boolean;
  /** The Supabase store is active (URL + service-role key present). */
  supabase: boolean;
  store: StoreKind;
  embeddings: EmbeddingsMode;
  model: string;
}

const DEFAULT_MODEL = "claude-sonnet-4-6";

/** True only when both Supabase env vars are present. */
export function hasSupabaseEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * The active store. `KB_STORE=supabase` only takes effect when both Supabase
 * env vars are set; otherwise we fall back to the local store so search never
 * breaks for want of a key.
 */
export function resolveStoreKind(env: NodeJS.ProcessEnv = process.env): StoreKind {
  if ((env.KB_STORE ?? "local").toLowerCase() === "supabase" && hasSupabaseEnv(env)) {
    return "supabase";
  }
  return "local";
}

/**
 * Embedding mode. `openai` requires OPENAI_API_KEY; `local` means "try the
 * optional local model, fall back to BM25 if it is not installed"; `none` keeps
 * pure-lexical BM25. Default (unset) = `local`.
 */
export function resolveEmbeddingsMode(env: NodeJS.ProcessEnv = process.env): EmbeddingsMode {
  const raw = (env.EMBEDDINGS ?? "local").toLowerCase();
  if (raw === "none") return "none";
  if (raw === "openai") return env.OPENAI_API_KEY ? "openai" : "none";
  return "local"; // local | auto | anything else → attempt local, BM25 fallback
}

/** The model the agent uses (env override, else the pinned default). */
export function resolveModel(env: NodeJS.ProcessEnv = process.env): string {
  return env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

/** True when the Anthropic agent should be live. */
export function assistantEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.trim());
}

/** Server-side mirror of the client's project capabilities (env is the truth). */
export function getCapabilities(env: NodeJS.ProcessEnv = process.env): Capabilities {
  const embeddings = resolveEmbeddingsMode(env);
  return {
    semanticSearch: embeddings !== "none",
    assistant: assistantEnabled(env),
    supabase: resolveStoreKind(env) === "supabase",
    store: resolveStoreKind(env),
    embeddings,
    model: resolveModel(env),
  };
}
