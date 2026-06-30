/**
 * Reindex orchestration — used by `POST /api/kb/reindex` and the `npm run
 * kb:index` script. Loads the wiki pages and (re)builds the active store's
 * index, then reports a summary. Importing this also loads aios/.env.
 */
import "../env"; // side effect: load aios/.env before reading any capability
import { loadWikiDocs } from "./wiki";
import { getActiveStore } from "./store";
import { getCapabilities } from "../env";

export interface ReindexResult {
  count: number;
  backend: string;
  vectors: number;
  lastIndexed: string | null;
  embeddings: string;
}

/** (Re)build the active store's index from wiki/ pages. */
export async function runReindex(): Promise<ReindexResult> {
  const store = await getActiveStore();
  const pages = await loadWikiDocs();
  const { count } = await store.reindex(pages);
  const stats = await store.stats();
  const caps = getCapabilities();
  return {
    count,
    backend: stats.backend,
    vectors: stats.vectors,
    lastIndexed: stats.lastIndexed,
    embeddings: caps.embeddings,
  };
}

/** The `kb` summary spliced into GET /api/kb/stats. */
export async function kbStatsSummary(): Promise<{
  backend: string;
  vectors: number;
  lastIndexed: string | null;
  embeddings: string;
}> {
  const caps = getCapabilities();
  try {
    const store = await getActiveStore();
    const stats = await store.stats();
    return {
      backend: stats.backend,
      vectors: stats.vectors,
      lastIndexed: stats.lastIndexed,
      embeddings: caps.embeddings,
    };
  } catch {
    return { backend: `${caps.store}:unknown`, vectors: 0, lastIndexed: null, embeddings: caps.embeddings };
  }
}
