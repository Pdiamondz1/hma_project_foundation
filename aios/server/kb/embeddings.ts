/**
 * EmbeddingProvider — the pluggable seam for vector search.
 *
 *   interface EmbeddingProvider { embed(texts): Promise<number[][]>; dim; id }
 *
 * Providers:
 *   - LocalEmbeddings  (default attempt): transformers.js `all-MiniLM-L6-v2`,
 *     384-dim, loaded DYNAMICALLY as an OPTIONAL dependency. If `@xenova/
 *     transformers` is not installed (or fails to load), construction throws and
 *     the store falls back to BM25 — the base install never needs it.
 *   - ApiEmbeddings    (opt-in): OpenAI `text-embedding-3-small`, 1536-dim, when
 *     OPENAI_API_KEY is set. Uses fetch — no SDK dependency.
 *
 * Selected by EMBEDDINGS=local|openai|none (default: try local, else BM25).
 */
import { CACHE_DIR } from "./paths";
import { resolveEmbeddingsMode, type EmbeddingsMode } from "../env";

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  readonly dim: number;
  readonly id: string;
}

/* ───────────────────────────── Local (optional) ──────────────────────────── */

/**
 * transformers.js feature-extraction pipeline. The import is dynamic and the
 * package is an OPTIONAL dependency: a failure here is expected on a lean
 * install and is caught by `resolveEmbeddingProvider`, which falls back to BM25.
 */
export class LocalEmbeddings implements EmbeddingProvider {
  readonly dim = 384;
  readonly id = "local:all-MiniLM-L6-v2";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pipe: any = null;

  private async pipeline(): Promise<(text: string, opts: unknown) => Promise<{ data: Float32Array }>> {
    if (this.pipe) return this.pipe;
    // Dynamic, string-built specifier so bundlers/typecheck don't require the
    // optional package to be present.
    const spec = "@xenova/transformers";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import(/* @vite-ignore */ spec);
    if (mod?.env) {
      mod.env.cacheDir = CACHE_DIR; // keep the model cache under aios/.cache
      mod.env.allowLocalModels = true;
    }
    this.pipe = await mod.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    return this.pipe;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const pipe = await this.pipeline();
    const out: number[][] = [];
    for (const text of texts) {
      const res = await pipe(text, { pooling: "mean", normalize: true });
      out.push(Array.from(res.data as Float32Array));
    }
    return out;
  }
}

/* ───────────────────────────── OpenAI (opt-in) ───────────────────────────── */

export class ApiEmbeddings implements EmbeddingProvider {
  readonly dim = 1536;
  readonly id = "openai:text-embedding-3-small";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: "text-embedding-3-small", input: texts }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`OpenAI embeddings failed (${res.status}): ${detail}`);
    }
    const json = (await res.json()) as { data: { embedding: number[] }[] };
    return json.data.map((d) => d.embedding);
  }
}

/* ─────────────────────────────── Selection ───────────────────────────────── */

/**
 * Resolve the active provider for the current env. Returns `null` to mean "no
 * embeddings — use BM25". Never throws: a local-model load failure is treated
 * as "fall back to BM25" so search always works.
 */
export async function resolveEmbeddingProvider(
  env: NodeJS.ProcessEnv = process.env
): Promise<{ provider: EmbeddingProvider | null; mode: EmbeddingsMode; reason: string }> {
  const mode = resolveEmbeddingsMode(env);
  if (mode === "none") return { provider: null, mode, reason: "embeddings disabled (EMBEDDINGS=none / no key)" };

  if (mode === "openai") {
    const key = env.OPENAI_API_KEY;
    if (!key) return { provider: null, mode: "none", reason: "OPENAI_API_KEY missing" };
    return { provider: new ApiEmbeddings(key), mode, reason: "openai" };
  }

  // mode === "local": attempt the optional local model; fall back to BM25.
  try {
    const local = new LocalEmbeddings();
    // Warm the pipeline so a missing/broken dep fails HERE (→ BM25), not later.
    await local.embed(["warmup"]);
    return { provider: local, mode, reason: "local model loaded" };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return {
      provider: null,
      mode: "none",
      reason: `local embeddings unavailable, using BM25 (${reason.slice(0, 120)})`,
    };
  }
}

/** Cosine similarity for two equal-length vectors (assumes finite numbers). */
export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
