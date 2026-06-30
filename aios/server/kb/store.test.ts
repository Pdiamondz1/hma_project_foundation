import { describe, it, expect } from "vitest";
import { resolveStoreKind, resolveEmbeddingsMode, hasSupabaseEnv } from "../env";
import { rankBm25 } from "./store";
import type { WikiDoc } from "./wiki";

describe("store selection by env", () => {
  it("defaults to the local store", () => {
    expect(resolveStoreKind({})).toBe("local");
    expect(resolveStoreKind({ KB_STORE: "local" })).toBe("local");
  });

  it("selects supabase only when KB_STORE=supabase AND both keys are present", () => {
    // Asked for supabase but no keys → degrade to local (search never breaks).
    expect(resolveStoreKind({ KB_STORE: "supabase" })).toBe("local");
    expect(
      resolveStoreKind({ KB_STORE: "supabase", SUPABASE_URL: "u", SUPABASE_SERVICE_ROLE_KEY: "k" })
    ).toBe("supabase");
    // Keys present but not selected → still local.
    expect(
      resolveStoreKind({ KB_STORE: "local", SUPABASE_URL: "u", SUPABASE_SERVICE_ROLE_KEY: "k" })
    ).toBe("local");
  });

  it("hasSupabaseEnv requires both URL and service-role key", () => {
    expect(hasSupabaseEnv({})).toBe(false);
    expect(hasSupabaseEnv({ SUPABASE_URL: "u" })).toBe(false);
    expect(hasSupabaseEnv({ SUPABASE_SERVICE_ROLE_KEY: "k" })).toBe(false);
    expect(hasSupabaseEnv({ SUPABASE_URL: "u", SUPABASE_SERVICE_ROLE_KEY: "k" })).toBe(true);
  });
});

describe("embeddings mode by env", () => {
  it("defaults to local (attempt local model, else BM25)", () => {
    expect(resolveEmbeddingsMode({})).toBe("local");
    expect(resolveEmbeddingsMode({ EMBEDDINGS: "local" })).toBe("local");
  });

  it("none stays none (pure BM25)", () => {
    expect(resolveEmbeddingsMode({ EMBEDDINGS: "none" })).toBe("none");
  });

  it("openai requires OPENAI_API_KEY, else falls back to none", () => {
    expect(resolveEmbeddingsMode({ EMBEDDINGS: "openai" })).toBe("none");
    expect(resolveEmbeddingsMode({ EMBEDDINGS: "openai", OPENAI_API_KEY: "x" })).toBe("openai");
  });
});

function doc(p: string, title: string, body: string): WikiDoc {
  const content = [title, "", "", body].join("\n");
  return { source_id: `wiki:${p}`, path: p, title, tags: [], content, body, hash: "h" };
}

describe("BM25 ranking", () => {
  const docs = [
    doc("alpha.md", "Alpha", "the quick brown fox jumps over the lazy dog"),
    doc("beta.md", "Beta", "embeddings and vector search power semantic retrieval"),
    doc("gamma.md", "Gamma", "vector vector vector pgvector cosine similarity vector"),
  ];

  it("ranks by term frequency for a single term and excludes non-matches", () => {
    const hits = rankBm25(docs, "vector", 10);
    expect(hits[0].path).toBe("gamma.md"); // 'vector' appears most here
    expect(hits.map((h) => h.path)).toContain("beta.md");
    expect(hits.map((h) => h.path)).not.toContain("alpha.md"); // no query terms
  });

  it("returns only the doc that contains the query terms", () => {
    const hits = rankBm25(docs, "semantic retrieval", 10);
    expect(hits.map((h) => h.path)).toEqual(["beta.md"]);
  });

  it("returns the SearchResult shape and respects k", () => {
    const hits = rankBm25(docs, "vector", 1);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        path: expect.any(String),
        snippet: expect.any(String),
        score: expect.any(Number),
      })
    );
  });

  it("returns nothing for a query with no matching terms", () => {
    expect(rankBm25(docs, "zzzznotpresent", 10)).toHaveLength(0);
  });
});
