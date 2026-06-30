/**
 * KnowledgeStore — the pluggable retrieval backend.
 *
 *   interface KnowledgeStore {
 *     reindex(pages): Promise<{count}>;
 *     search(query, k): Promise<Hit[]>;
 *     stats(): Promise<{backend, vectors, lastIndexed}>;
 *   }
 *
 * Implementations:
 *   - LocalStore (default): persists an index under aios/.kb-index/ (gitignored).
 *     Embeds wiki pages via the EmbeddingProvider and ranks by cosine. If
 *     embeddings are unavailable it falls back to a pure-JS BM25 ranker over the
 *     live wiki text, so search ALWAYS works with zero setup.
 *   - SupabaseStore (opt-in): pgvector via @supabase/supabase-js. The adapter is
 *     INERT unless SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set. Calls the
 *     `match_knowledge` RPC with a full-text-search fallback.
 *
 * Selected by KB_STORE=local|supabase (default local).
 */
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import {
  loadWikiDocs,
  makeSnippet,
  type WikiDoc,
} from "./wiki";
import { KB_INDEX_DIR, KB_INDEX_FILE } from "./paths";
import { buildBm25Index, scoreBm25, tokenize } from "./bm25";
import {
  resolveEmbeddingProvider,
  cosine,
  type EmbeddingProvider,
} from "./embeddings";
import { resolveStoreKind } from "../env";

/** A single search result — identical shape to /api/search's SearchResult. */
export interface Hit {
  title: string;
  path: string;
  snippet: string;
  score: number;
}

export interface StoreStats {
  backend: string;
  vectors: number;
  lastIndexed: string | null;
}

export interface KnowledgeStore {
  reindex(pages: WikiDoc[]): Promise<{ count: number }>;
  search(query: string, k: number): Promise<Hit[]>;
  stats(): Promise<StoreStats>;
}

/* ───────────────────────── Pure rankers (testable) ───────────────────────── */

/** BM25 rank wiki docs for a query. Pure — no fs, no env. */
export function rankBm25(docs: WikiDoc[], query: string, k: number): Hit[] {
  const index = buildBm25Index(docs.map((d) => ({ id: d.path, tokens: tokenize(d.content) })));
  const scored = scoreBm25(index, query);
  const byPath = new Map(docs.map((d) => [d.path, d]));
  const terms = tokenize(query);
  return scored.slice(0, k).map(({ id, score }) => {
    const doc = byPath.get(id)!;
    return {
      title: doc.title,
      path: doc.path,
      snippet: makeSnippet(doc.body, terms),
      score: Math.round(score * 1000) / 1000,
    };
  });
}

interface VectorDoc extends WikiDoc {
  embedding: number[];
}

/** Cosine rank pre-embedded docs against a query vector. Pure. */
export function rankCosine(docs: VectorDoc[], queryVec: number[], query: string, k: number): Hit[] {
  const terms = tokenize(query);
  return docs
    .map((d) => ({ doc: d, score: cosine(queryVec, d.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ doc, score }) => ({
      title: doc.title,
      path: doc.path,
      snippet: makeSnippet(doc.body, terms),
      score: Math.round(score * 1000) / 1000,
    }));
}

/* ─────────────────────────────── LocalStore ──────────────────────────────── */

interface IndexedDoc {
  source_id: string;
  path: string;
  title: string;
  body: string;
  hash: string;
  embedding?: number[];
}

interface IndexFile {
  version: 1;
  backend: string;
  embeddingId: string | null;
  dim: number | null;
  lastIndexed: string | null;
  docs: IndexedDoc[];
}

export class LocalStore implements KnowledgeStore {
  private readonly provider: EmbeddingProvider | null;
  private readonly indexFile: string;
  private readonly indexDir: string;

  constructor(
    provider: EmbeddingProvider | null,
    opts?: { indexFile?: string; indexDir?: string }
  ) {
    this.provider = provider;
    this.indexFile = opts?.indexFile ?? KB_INDEX_FILE;
    this.indexDir = opts?.indexDir ?? KB_INDEX_DIR;
  }

  private async load(): Promise<IndexFile | null> {
    if (!existsSync(this.indexFile)) return null;
    try {
      return JSON.parse(await fs.readFile(this.indexFile, "utf8")) as IndexFile;
    } catch {
      return null;
    }
  }

  private async persist(index: IndexFile): Promise<void> {
    await fs.mkdir(this.indexDir, { recursive: true });
    await fs.writeFile(this.indexFile, JSON.stringify(index), "utf8");
  }

  /** (Re)build the index from wiki pages — incremental by source_id + hash. */
  async reindex(pages: WikiDoc[]): Promise<{ count: number }> {
    const prev = await this.load();
    const prevById = new Map((prev?.docs ?? []).map((d) => [d.source_id, d]));
    const dim = this.provider?.dim ?? null;

    // Decide which pages need a fresh embedding (changed hash, or no usable vec).
    const needEmbed: WikiDoc[] = [];
    if (this.provider) {
      for (const page of pages) {
        const old = prevById.get(page.source_id);
        const reusable =
          old && old.hash === page.hash && old.embedding && old.embedding.length === dim;
        if (!reusable) needEmbed.push(page);
      }
    }

    const fresh = new Map<string, number[]>();
    if (this.provider && needEmbed.length) {
      const vectors = await this.provider.embed(needEmbed.map((p) => p.content));
      needEmbed.forEach((p, i) => fresh.set(p.source_id, vectors[i]));
    }

    const docs: IndexedDoc[] = pages.map((page) => {
      const old = prevById.get(page.source_id);
      const embedding = this.provider
        ? fresh.get(page.source_id) ??
          (old && old.hash === page.hash ? old.embedding : undefined)
        : undefined;
      return {
        source_id: page.source_id,
        path: page.path,
        title: page.title,
        body: page.body,
        hash: page.hash,
        ...(embedding ? { embedding } : {}),
      };
    });

    const index: IndexFile = {
      version: 1,
      backend: this.provider ? `local:${this.provider.id}` : "local:bm25",
      embeddingId: this.provider?.id ?? null,
      dim,
      lastIndexed: new Date().toISOString(),
      docs,
    };
    await this.persist(index);
    return { count: docs.length };
  }

  async search(query: string, k: number): Promise<Hit[]> {
    // Semantic path: only when a provider is active AND we have vectors indexed.
    if (this.provider) {
      const index = await this.load();
      const vecDocs = (index?.docs ?? []).filter(
        (d) => d.embedding && d.embedding.length === this.provider!.dim
      );
      if (vecDocs.length) {
        const [queryVec] = await this.provider.embed([query]);
        const docs: VectorDoc[] = vecDocs.map((d) => ({
          source_id: d.source_id,
          path: d.path,
          title: d.title,
          tags: [],
          content: d.body,
          body: d.body,
          hash: d.hash,
          embedding: d.embedding!,
        }));
        return rankCosine(docs, queryVec, query, k);
      }
      // No vectors yet — fall through to live BM25 so search still works.
    }
    // BM25 path: always available, reads the wiki live (zero setup required).
    const live = await loadWikiDocs();
    return rankBm25(live, query, k);
  }

  async stats(): Promise<StoreStats> {
    const index = await this.load();
    const vectors = index ? index.docs.filter((d) => d.embedding?.length).length : 0;
    return {
      backend: this.provider ? `local:${this.provider.id}` : "local:bm25",
      vectors,
      lastIndexed: index?.lastIndexed ?? null,
    };
  }
}

/* ───────────────────────────── SupabaseStore ─────────────────────────────── */

/**
 * pgvector-backed store, modeled on dragoncandy `donny_knowledge` / harbormill
 * `knowledge`. INERT unless SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set;
 * `@supabase/supabase-js` is imported dynamically so it never runs on the lean
 * path. See aios/supabase/migrations/0001_knowledge.sql for the schema + RPC.
 */
export class SupabaseStore implements KnowledgeStore {
  private readonly provider: EmbeddingProvider | null;
  private readonly url: string;
  private readonly key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;

  constructor(provider: EmbeddingProvider | null, url: string, key: string) {
    this.provider = provider;
    this.url = url;
    this.key = key;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async db(): Promise<any> {
    if (this.client) return this.client;
    const { createClient } = await import("@supabase/supabase-js");
    this.client = createClient(this.url, this.key, { auth: { persistSession: false } });
    return this.client;
  }

  async reindex(pages: WikiDoc[]): Promise<{ count: number }> {
    const db = await this.db();
    const embeddings = this.provider
      ? await this.provider.embed(pages.map((p) => p.content))
      : null;
    const rows = pages.map((p, i) => ({
      source_id: p.source_id,
      content: p.content,
      embedding: embeddings ? embeddings[i] : null,
      metadata: { title: p.title, path: p.path, tags: p.tags, hash: p.hash },
    }));
    const { error } = await db.from("knowledge").upsert(rows, { onConflict: "source_id" });
    if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
    return { count: rows.length };
  }

  async search(query: string, k: number): Promise<Hit[]> {
    const db = await this.db();
    // Vector path via the match_knowledge RPC.
    if (this.provider) {
      const [queryVec] = await this.provider.embed([query]);
      const { data, error } = await db.rpc("match_knowledge", {
        query_embedding: queryVec,
        match_count: k,
      });
      if (!error && Array.isArray(data)) return data.map((r: unknown) => toHit(r, query));
    }
    // FTS fallback: rank by the stored tsvector.
    const { data, error } = await db
      .from("knowledge")
      .select("content, metadata")
      .textSearch("search", query, { type: "websearch" })
      .limit(k);
    if (error || !Array.isArray(data)) return [];
    return data.map((r: unknown) => toHit(r, query));
  }

  async stats(): Promise<StoreStats> {
    const db = await this.db();
    const { count } = await db
      .from("knowledge")
      .select("id", { count: "exact", head: true });
    return {
      backend: this.provider ? `supabase:${this.provider.id}` : "supabase:fts",
      vectors: typeof count === "number" ? count : 0,
      lastIndexed: null,
    };
  }
}

/** Map a knowledge row (RPC or table) to a Hit. */
function toHit(row: unknown, query: string): Hit {
  const r = row as { content?: string; metadata?: Record<string, unknown>; similarity?: number };
  const meta = r.metadata ?? {};
  const body = typeof r.content === "string" ? r.content : "";
  return {
    title: typeof meta.title === "string" ? meta.title : String(meta.path ?? "knowledge"),
    path: typeof meta.path === "string" ? meta.path : "",
    snippet: makeSnippet(body, tokenize(query)),
    score: typeof r.similarity === "number" ? Math.round(r.similarity * 1000) / 1000 : 0,
  };
}

/* ─────────────────────────── Active-store singleton ──────────────────────── */

let cached: { store: KnowledgeStore; kind: string } | null = null;

/** Build (and memoize) the store selected by env. */
export async function getActiveStore(): Promise<KnowledgeStore> {
  if (cached) return cached.store;
  const kind = resolveStoreKind();
  const { provider } = await resolveEmbeddingProvider();
  let store: KnowledgeStore;
  if (kind === "supabase") {
    store = new SupabaseStore(provider, process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  } else {
    store = new LocalStore(provider);
  }
  cached = { store, kind };
  return store;
}

/** Reset the memoized store (used by tests). */
export function resetActiveStore(): void {
  cached = null;
}

/**
 * Store-backed search facade for /api/search. Never throws — on any failure it
 * degrades to a live BM25 pass so search ALWAYS returns something.
 */
export async function storeSearch(query: string, k = 25): Promise<Hit[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const store = await getActiveStore();
    return await store.search(q, k);
  } catch {
    try {
      return rankBm25(await loadWikiDocs(), q, k);
    } catch {
      return [];
    }
  }
}
