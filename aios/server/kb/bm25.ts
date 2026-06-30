/**
 * Pure-JS BM25 lexical ranker — ZERO dependencies. This is the always-available
 * floor for `/api/search`: when no embedding provider is configured (or the
 * optional local model is not installed), search still returns ranked results.
 *
 * Standard Okapi BM25 (k1 = 1.5, b = 0.75) over a tokenized corpus.
 */

const K1 = 1.5;
const B = 0.75;

/** Lowercase, split on non-alphanumerics, drop empties + 1-char tokens. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length > 1);
}

export interface Bm25Doc {
  id: string;
  /** Tokens for ranking. */
  tokens: string[];
}

export interface Bm25Index {
  docs: { id: string; len: number; tf: Map<string, number> }[];
  /** document frequency per term */
  df: Map<string, number>;
  avgdl: number;
  n: number;
}

/** Build the corpus statistics needed to score queries. Pure. */
export function buildBm25Index(docs: Bm25Doc[]): Bm25Index {
  const df = new Map<string, number>();
  const indexed = docs.map((d) => {
    const tf = new Map<string, number>();
    for (const tok of d.tokens) tf.set(tok, (tf.get(tok) ?? 0) + 1);
    for (const term of tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
    return { id: d.id, len: d.tokens.length, tf };
  });
  const totalLen = indexed.reduce((acc, d) => acc + d.len, 0);
  return {
    docs: indexed,
    df,
    avgdl: indexed.length ? totalLen / indexed.length : 0,
    n: indexed.length,
  };
}

/** Inverse document frequency (BM25 variant, floored at 0). */
function idf(index: Bm25Index, term: string): number {
  const df = index.df.get(term) ?? 0;
  if (df === 0) return 0;
  return Math.max(0, Math.log((index.n - df + 0.5) / (df + 0.5) + 1));
}

/** Score every doc for `query`, returning id+score sorted desc (score > 0). */
export function scoreBm25(index: Bm25Index, query: string): { id: string; score: number }[] {
  const terms = tokenize(query);
  if (terms.length === 0 || index.n === 0) return [];
  const results: { id: string; score: number }[] = [];
  for (const doc of index.docs) {
    let score = 0;
    for (const term of terms) {
      const f = doc.tf.get(term);
      if (!f) continue;
      const denom = f + K1 * (1 - B + (B * doc.len) / (index.avgdl || 1));
      score += idf(index, term) * ((f * (K1 + 1)) / denom);
    }
    if (score > 0) results.push({ id: doc.id, score });
  }
  return results.sort((a, b) => b.score - a.score);
}
