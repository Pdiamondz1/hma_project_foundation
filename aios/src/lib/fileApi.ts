/**
 * Typed fetch client for the local File API (server/fileApi.ts).
 *
 * Every call is a thin `fetch('/api/...')`. In Phase 4 the same client points
 * at Supabase edge functions instead — the surfaces and hooks don't change.
 */

/* ─────────────────────────────── Types ──────────────────────────────────── */

export interface KbStats {
  raw: { files: number };
  wiki: { pages: number };
  reviews: { open: number; total: number; files: number };
  needsContext: { open: number };
  changeLog: { recent: string[] };
}

export interface WikiPageMeta {
  file: string;
  title: string;
  indexes: string;
  source_id: string;
  tags: string[];
  updated: string;
}

export interface WikiPage {
  file: string;
  title: string;
  frontmatter: Record<string, unknown>;
  tags: string[];
  body: string;
}

export interface RawAsset {
  path: string;
  size: number;
  mtime: string;
}

export interface ReviewItem {
  id: string;
  checked: boolean;
  text: string;
  target?: string;
  detail?: string;
  raw: string;
}

export interface ReviewFile {
  file: string;
  title: string;
  items: ReviewItem[];
}

export interface NeedsContextFile {
  file: string;
  title: string;
  questions: string[];
  body: string;
}

export interface SearchResult {
  title: string;
  path: string;
  snippet: string;
  score: number;
}

/* ─────────────────────────────── Client ─────────────────────────────────── */

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`GET ${url} failed (${res.status}): ${detail}`);
  }
  return (await res.json()) as T;
}

export const fileApi = {
  stats: () => getJson<KbStats>("/api/kb/stats"),

  wiki: () => getJson<{ pages: WikiPageMeta[] }>("/api/wiki").then((r) => r.pages),

  wikiPage: (file: string) =>
    getJson<WikiPage>(`/api/wiki/page?path=${encodeURIComponent(file)}`),

  raw: () => getJson<{ assets: RawAsset[] }>("/api/raw").then((r) => r.assets),

  reviews: () =>
    getJson<{ files: ReviewFile[] }>("/api/outputs/reviews").then((r) => r.files),

  /** The ONLY mutation the GUI performs: toggle one review checkbox in place. */
  checkReview: async (file: string, id: string, checked: boolean) => {
    const res = await fetch("/api/outputs/reviews/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file, id, checked }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Toggle failed (${res.status}): ${detail}`);
    }
    return (await res.json()) as { ok: boolean; changed: boolean; item: ReviewItem | null };
  },

  needsContext: () =>
    getJson<{ files: NeedsContextFile[] }>("/api/outputs/needs-context").then((r) => r.files),

  changeLog: () =>
    getJson<{ markdown: string }>("/api/outputs/change-log").then((r) => r.markdown),

  search: (q: string) =>
    getJson<{ query: string; results: SearchResult[] }>(
      `/api/search?q=${encodeURIComponent(q)}`
    ).then((r) => r.results),
};
