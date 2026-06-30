/**
 * Wiki source loader for the knowledge store. Walks `wiki/`, parses each page's
 * frontmatter (the RAG-ready schema: title, source_id, path, tags), and returns
 * a flat list of documents the store can index or rank.
 *
 * Shares the contracts with server/fileApi.ts but stays import-independent of
 * it (uses kb/paths.ts) to avoid an import cycle.
 */
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import matter from "gray-matter";
import { WIKI_DIR, RAW_DIR, OUTPUTS_DIR } from "./paths";

export interface WikiDoc {
  /** Stable id: frontmatter `source_id`, else `wiki:<relpath>`. */
  source_id: string;
  /** wiki-relative path, POSIX-style (e.g. "index.md"). */
  path: string;
  title: string;
  tags: string[];
  /** Plain text used for embedding / lexical ranking (title + tags + body). */
  content: string;
  /** The markdown body only (used for snippets). */
  body: string;
  /** sha1 of the content — drives incremental reindex. */
  hash: string;
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

/** Recursively list files under `dir`, skipping dotfiles (incl. .gitkeep). */
async function walk(dir: string, base = dir): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(abs, base)));
    else if (entry.isFile()) out.push(path.relative(base, abs).split(path.sep).join("/"));
  }
  return out;
}

/** Load every indexable wiki page (excludes `_candidates/` proposals). */
export async function loadWikiDocs(): Promise<WikiDoc[]> {
  const rels = await walk(WIKI_DIR);
  const docs: WikiDoc[] = [];
  for (const rel of rels) {
    if (!rel.endsWith(".md")) continue;
    if (rel.split("/").includes("_candidates")) continue;
    const parsed = matter(await fs.readFile(path.join(WIKI_DIR, rel), "utf8"));
    const fm = parsed.data as Record<string, unknown>;
    const title = typeof fm.title === "string" ? fm.title : rel;
    const tags = asStringArray(fm.tags);
    const source_id = typeof fm.source_id === "string" && fm.source_id ? fm.source_id : `wiki:${rel}`;
    const body = parsed.content;
    const content = [title, tags.join(" "), source_id, body].join("\n");
    const hash = createHash("sha1").update(content).digest("hex");
    docs.push({ source_id, path: rel, title, tags, content, body, hash });
  }
  return docs;
}

/** Read one wiki page in full (frontmatter + body) by wiki-relative path. */
export async function readWikiDoc(
  rel: string
): Promise<{ path: string; title: string; frontmatter: Record<string, unknown>; body: string } | null> {
  const cleaned = rel.replace(/^\/+/, "");
  const abs = path.resolve(WIKI_DIR, cleaned);
  const within = abs === WIKI_DIR || abs.startsWith(WIKI_DIR + path.sep);
  if (!within || !abs.endsWith(".md") || !existsSync(abs)) return null;
  const parsed = matter(await fs.readFile(abs, "utf8"));
  const fm = parsed.data as Record<string, unknown>;
  return {
    path: cleaned,
    title: typeof fm.title === "string" ? fm.title : cleaned,
    frontmatter: fm,
    body: parsed.content,
  };
}

/** List immutable raw/ assets (path, size, mtime). Read-only. */
export async function listRawAssets(): Promise<{ path: string; size: number; mtime: string }[]> {
  const rels = await walk(RAW_DIR);
  const out: { path: string; size: number; mtime: string }[] = [];
  for (const rel of rels) {
    const stat = await fs.stat(path.join(RAW_DIR, rel));
    out.push({ path: rel, size: stat.size, mtime: stat.mtime.toISOString() });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/** Read outputs/change-log.md (read-only — the agent never writes it). */
export async function readChangeLog(): Promise<string> {
  const p = path.join(OUTPUTS_DIR, "change-log.md");
  if (!existsSync(p)) return "";
  return fs.readFile(p, "utf8");
}

/** Build a short snippet around the first matched term in `body`. */
export function makeSnippet(body: string, terms: string[]): string {
  const lower = body.toLowerCase();
  let hit = -1;
  for (const term of terms) {
    const i = lower.indexOf(term.toLowerCase());
    if (i !== -1 && (hit === -1 || i < hit)) hit = i;
  }
  const start = hit === -1 ? 0 : Math.max(0, hit - 60);
  return (
    (start > 0 ? "…" : "") +
    body.slice(start, start + 180).replace(/\s+/g, " ").trim() +
    (body.length > start + 180 ? "…" : "")
  );
}
