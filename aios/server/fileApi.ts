/**
 * Local File API — the "file-first" heart of the AIOS console.
 *
 * A tiny Connect/Vite middleware that reads the on-disk knowledge base
 * (raw/ wiki/ outputs/ at the repo root) and serves it as JSON. It is mounted
 * in vite.config.ts via BOTH `configureServer` and `configurePreviewServer`,
 * so it works under `npm run dev` AND `npm run preview` with no separate
 * process.
 *
 * WRITE OWNERSHIP (load-bearing): the ONLY writes this API performs are toggling
 * checkboxes in `outputs/review-*.md` and `outputs/ideas-*.md` files. It NEVER
 * writes `outputs/change-log.md` (skills own that ledger) and NEVER touches `raw/`.
 *
 * RAG-READY SEAM: `searchWiki()` is a lexical substring/term search today. In
 * Phase 4 it is swapped for pgvector + embeddings with no change to the route
 * shape (see src/lib/tools.ts and aios/README.md).
 */
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import matter from "gray-matter";
import { handleIntelligenceApi } from "./intelligence";
import { storeSearch } from "./kb/store";
import { kbStatsSummary } from "./kb/reindex";
import { parseIdeaItems, toggleIdeaCheckbox, type IdeaItem } from "./ideas";

/* ─────────────────────────── KB root resolution ─────────────────────────── */

// Dir of this module. Works both when bundled into vite.config (Vite injects
// import.meta.url = the config dir) and when loaded directly by Vitest.
const moduleDir = path.dirname(fileURLToPath(import.meta.url));

/** Walk up from `start` to the first dir that looks like the KB root. */
function findKbRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (
      existsSync(path.join(dir, "wiki")) &&
      existsSync(path.join(dir, "raw")) &&
      existsSync(path.join(dir, "outputs"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

/**
 * KB root = `KB_ROOT` env override, else the repo root (parent of `aios/`).
 * Exported so it is testable / overridable.
 */
export const KB_ROOT: string = process.env.KB_ROOT
  ? path.resolve(process.env.KB_ROOT)
  : findKbRoot(path.resolve(moduleDir, ".."));

const RAW_DIR = path.join(KB_ROOT, "raw");
const WIKI_DIR = path.join(KB_ROOT, "wiki");
const OUTPUTS_DIR = path.join(KB_ROOT, "outputs");

/* ─────────────────────────── Pure parse helpers ─────────────────────────── */
/* These are factored out and exported so they can be unit-tested in isolation
   (server/fileApi.test.ts) without touching the filesystem. */

export interface ReviewItem {
  /** Stable id token, e.g. `rv-20260629-001`. The GUI/skill contract key. */
  id: string;
  checked: boolean;
  text: string;
  target?: string;
  detail?: string;
  /** The original source line, verbatim. */
  raw: string;
}

// Matches a NEEDS SIGN-OFF checkbox line:
//   - [ ] `rv-YYYYMMDD-NNN` — <text>  ·  target: <path>  ·  detail: <detail>
// Group 1 = checkbox state, group 2 = id token, group 3 = the trailing text.
const ITEM_RE = /^\s*-\s*\[([ xX])\]\s*`(rv-[^`]+)`\s*(.*)$/;

/** Parse every checkbox item out of a `review-*.md` body. Pure. */
export function parseReviewItems(markdown: string): ReviewItem[] {
  const items: ReviewItem[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const m = ITEM_RE.exec(line);
    if (!m) continue;
    const checked = m[1].toLowerCase() === "x";
    const id = m[2];
    // Strip a single leading em-dash / en-dash / hyphen separator after the id.
    const rest = m[3].trim().replace(/^[—–-]\s*/, "");
    const segments = rest
      .split("·")
      .map((s) => s.trim())
      .filter(Boolean);

    let text = "";
    let target: string | undefined;
    let detail: string | undefined;
    segments.forEach((seg, i) => {
      const low = seg.toLowerCase();
      if (low.startsWith("target:")) target = seg.slice(seg.indexOf(":") + 1).trim();
      else if (low.startsWith("detail:")) detail = seg.slice(seg.indexOf(":") + 1).trim();
      else if (i === 0 || !text) text = seg;
    });

    items.push({ id, checked, text, target, detail, raw: line });
  }
  return items;
}

/**
 * Flip ONLY the checkbox for `id` (`[ ]` ↔ `[x]`) in place and return the new
 * body. Does not renumber, reorder, or otherwise mutate any other line. An
 * unknown id (or a no-op toggle) returns the original string unchanged. Pure.
 */
export function toggleReviewCheckbox(markdown: string, id: string, checked: boolean): string {
  const eol = markdown.includes("\r\n") ? "\r\n" : "\n";
  const lines = markdown.split(/\r?\n/);
  let changed = false;
  const next = lines.map((line) => {
    const m = ITEM_RE.exec(line);
    if (m && m[2] === id) {
      const box = checked ? "x" : " ";
      const replaced = line.replace(/\[[ xX]\]/, `[${box}]`);
      if (replaced !== line) changed = true;
      return replaced;
    }
    return line;
  });
  return changed ? next.join(eol) : markdown;
}

/** Pull the open (unchecked) free-text questions out of a needs-context body. */
export function parseQuestions(markdown: string): string[] {
  const questions: string[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const m = /^\s*(?:[-*+]|\d+[.)])\s+(.*\S)\s*$/.exec(line);
    if (m) questions.push(m[1].trim());
  }
  return questions;
}

/* ─────────────────────────── Filesystem helpers ─────────────────────────── */

interface WalkedFile {
  /** POSIX-style path relative to the walked base dir. */
  rel: string;
  abs: string;
  size: number;
  mtime: string;
}

/** Recursively list files under `dir`, skipping dotfiles (incl. .gitkeep). */
async function walkFiles(dir: string, base = dir): Promise<WalkedFile[]> {
  if (!existsSync(dir)) return [];
  const out: WalkedFile[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue; // dotfiles + .gitkeep
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkFiles(abs, base)));
    } else if (entry.isFile()) {
      const stat = await fs.stat(abs);
      out.push({
        rel: path.relative(base, abs).split(path.sep).join("/"),
        abs,
        size: stat.size,
        mtime: stat.mtime.toISOString(),
      });
    }
  }
  return out;
}

/** List `outputs/` files whose basename matches `prefix-*.md`, sorted. */
async function listOutputFiles(prefix: string): Promise<string[]> {
  if (!existsSync(OUTPUTS_DIR)) return [];
  const names = await fs.readdir(OUTPUTS_DIR);
  return names
    .filter((n) => n.startsWith(`${prefix}-`) && n.endsWith(".md"))
    .sort();
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

/** Coerce a frontmatter value to a plain string (YAML parses bare dates to Date). */
function asDateString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  return "";
}

/* ─────────────────────────────── Endpoints ──────────────────────────────── */

export interface WikiPageMeta {
  /** Path relative to wiki/, used to fetch the page (e.g. "index.md"). */
  file: string;
  title: string;
  /** Frontmatter `path` — what raw/ asset this page indexes. */
  indexes: string;
  source_id: string;
  tags: string[];
  updated: string;
}

async function listWikiPages(): Promise<WikiPageMeta[]> {
  const files = await walkFiles(WIKI_DIR);
  const pages: WikiPageMeta[] = [];
  for (const f of files) {
    if (!f.rel.endsWith(".md")) continue;
    if (f.rel.split("/").includes("_candidates")) continue; // exclude proposals
    const fm = matter(await fs.readFile(f.abs, "utf8")).data as Record<string, unknown>;
    pages.push({
      file: f.rel,
      title: typeof fm.title === "string" ? fm.title : f.rel,
      indexes: typeof fm.path === "string" ? fm.path : "",
      source_id: typeof fm.source_id === "string" ? fm.source_id : "",
      tags: asStringArray(fm.tags),
      updated: asDateString(fm.updated),
    });
  }
  return pages.sort((a, b) => a.title.localeCompare(b.title));
}

/** Resolve a wiki-relative path safely (guards against `..` traversal). */
function resolveWikiPath(rel: string): string | null {
  const cleaned = rel.replace(/^\/+/, "");
  const abs = path.resolve(WIKI_DIR, cleaned);
  const within = abs === WIKI_DIR || abs.startsWith(WIKI_DIR + path.sep);
  if (!within) return null;
  if (!abs.endsWith(".md")) return null;
  return abs;
}

async function readWikiPage(rel: string) {
  const abs = resolveWikiPath(rel);
  if (!abs || !existsSync(abs)) return null;
  const parsed = matter(await fs.readFile(abs, "utf8"));
  const fm = parsed.data as Record<string, unknown>;
  return {
    file: rel.replace(/^\/+/, ""),
    title: typeof fm.title === "string" ? fm.title : rel,
    frontmatter: fm,
    tags: asStringArray(fm.tags),
    body: parsed.content,
  };
}

interface ReviewFilePayload {
  file: string;
  title: string;
  items: ReviewItem[];
}

async function listReviews(): Promise<ReviewFilePayload[]> {
  const files = await listOutputFiles("review");
  const out: ReviewFilePayload[] = [];
  for (const file of files) {
    const parsed = matter(await fs.readFile(path.join(OUTPUTS_DIR, file), "utf8"));
    const title =
      typeof (parsed.data as Record<string, unknown>).title === "string"
        ? String((parsed.data as Record<string, unknown>).title)
        : file;
    out.push({ file, title, items: parseReviewItems(parsed.content) });
  }
  return out;
}

interface IdeaFilePayload { file: string; title: string; items: IdeaItem[]; }

async function listIdeas(): Promise<IdeaFilePayload[]> {
  // listOutputFiles("ideas") ALSO matches the ideas-log* dedup ledger(s) (they
  // start with "ideas-"). Exclude them: they have no idea anchor lines, so they
  // would render a spurious empty card AND keep `files` non-empty, making the
  // page's EmptyState unreachable on a fresh clone.
  const files = (await listOutputFiles("ideas")).filter((f) => !/^ideas-log/.test(f));
  const out: IdeaFilePayload[] = [];
  for (const file of files) {
    const parsed = matter(await fs.readFile(path.join(OUTPUTS_DIR, file), "utf8"));
    const data = parsed.data as Record<string, unknown>;
    const title = typeof data.title === "string" ? data.title : file;
    out.push({ file, title, items: parseIdeaItems(parsed.content) });
  }
  return out;
}

interface NeedsContextPayload {
  file: string;
  title: string;
  questions: string[];
  body: string;
}

async function listNeedsContext(): Promise<NeedsContextPayload[]> {
  const files = await listOutputFiles("needs-context");
  const out: NeedsContextPayload[] = [];
  for (const file of files) {
    const parsed = matter(await fs.readFile(path.join(OUTPUTS_DIR, file), "utf8"));
    const title =
      typeof (parsed.data as Record<string, unknown>).title === "string"
        ? String((parsed.data as Record<string, unknown>).title)
        : file;
    out.push({ file, title, questions: parseQuestions(parsed.content), body: parsed.content });
  }
  return out;
}

async function readChangeLog(): Promise<string> {
  const p = path.join(OUTPUTS_DIR, "change-log.md");
  if (!existsSync(p)) return "";
  return fs.readFile(p, "utf8");
}

/** Extract the most recent dated entry lines from change-log.md (newest-first). */
function recentChangeLogEntries(markdown: string, n: number): string[] {
  const entries = markdown
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^-\s+\d{4}-\d{2}-\d{2}\b/.test(l));
  return entries.slice(0, n);
}

export interface SearchResult {
  title: string;
  /** wiki-relative file path to open the page. */
  path: string;
  snippet: string;
  score: number;
}

/**
 * Lexical search over wiki page bodies + frontmatter. The swappable RAG seam:
 * case-insensitive term/substring scoring now; pgvector later (Phase 4).
 */
export async function searchWiki(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const files = await walkFiles(WIKI_DIR);
  const results: SearchResult[] = [];

  for (const f of files) {
    if (!f.rel.endsWith(".md")) continue;
    if (f.rel.split("/").includes("_candidates")) continue;
    const parsed = matter(await fs.readFile(f.abs, "utf8"));
    const fm = parsed.data as Record<string, unknown>;
    const title = typeof fm.title === "string" ? fm.title : f.rel;
    const haystackParts = [
      title,
      asStringArray(fm.tags).join(" "),
      typeof fm.source_id === "string" ? fm.source_id : "",
      parsed.content,
    ];
    const haystack = haystackParts.join("\n").toLowerCase();

    let score = 0;
    for (const term of terms) {
      let idx = haystack.indexOf(term);
      while (idx !== -1) {
        score += 1;
        idx = haystack.indexOf(term, idx + term.length);
      }
    }
    // Title hits weigh more.
    if (title.toLowerCase().includes(q)) score += 5;
    if (score === 0) continue;

    const body = parsed.content;
    const lower = body.toLowerCase();
    let hit = -1;
    for (const term of terms) {
      const i = lower.indexOf(term);
      if (i !== -1 && (hit === -1 || i < hit)) hit = i;
    }
    const start = hit === -1 ? 0 : Math.max(0, hit - 60);
    const snippet =
      (start > 0 ? "…" : "") +
      body.slice(start, start + 180).replace(/\s+/g, " ").trim() +
      (body.length > start + 180 ? "…" : "");

    results.push({ title, path: f.rel, snippet, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 25);
}

export interface KbStats {
  raw: { files: number };
  wiki: { pages: number };
  reviews: { open: number; total: number; files: number };
  needsContext: { open: number };
  changeLog: { recent: string[] };
  /** Phase-4 retrieval-layer summary (additive; absent fields are harmless in v1). */
  kb: { backend: string; vectors: number; lastIndexed: string | null; embeddings: string };
}

async function getStats(): Promise<KbStats> {
  const rawFiles = await walkFiles(RAW_DIR);
  const wikiPages = await listWikiPages();
  const reviews = await listReviews();
  const needs = await listNeedsContext();
  const allItems = reviews.flatMap((r) => r.items);
  return {
    raw: { files: rawFiles.length },
    wiki: { pages: wikiPages.length },
    reviews: {
      open: allItems.filter((i) => !i.checked).length,
      total: allItems.length,
      files: reviews.length,
    },
    needsContext: { open: needs.reduce((acc, n) => acc + n.questions.length, 0) },
    changeLog: { recent: recentChangeLogEntries(await readChangeLog(), 5) },
    kb: await kbStatsSummary(),
  };
}

/* ─────────────────────────── HTTP glue (middleware) ─────────────────────── */

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(payload);
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

/**
 * The single request handler. Returns `true` if it handled the request,
 * `false` if the caller should fall through to the next middleware.
 */
export async function handleFileApi(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (!url.pathname.startsWith("/api/")) return false;

  const method = (req.method ?? "GET").toUpperCase();
  const route = url.pathname;

  try {
    // Phase-4 intelligence endpoints (opt-in; degrade gracefully). Delegated
    // first so /api/kb/reindex, /api/assistant/* are handled before the v1 switch.
    if (await handleIntelligenceApi(req, res, url, method)) return true;

    if (method === "GET" && route === "/api/kb/stats") {
      sendJson(res, 200, await getStats());
      return true;
    }

    if (method === "GET" && route === "/api/wiki") {
      sendJson(res, 200, { pages: await listWikiPages() });
      return true;
    }

    if (method === "GET" && route === "/api/wiki/page") {
      const rel = url.searchParams.get("path") ?? "";
      const page = await readWikiPage(rel);
      if (!page) {
        sendJson(res, 404, { error: "Wiki page not found or outside wiki/." });
        return true;
      }
      sendJson(res, 200, page);
      return true;
    }

    if (method === "GET" && route === "/api/raw") {
      const files = await walkFiles(RAW_DIR);
      sendJson(res, 200, {
        assets: files
          .map((f) => ({ path: f.rel, size: f.size, mtime: f.mtime }))
          .sort((a, b) => a.path.localeCompare(b.path)),
      });
      return true;
    }

    if (method === "GET" && route === "/api/outputs/reviews") {
      sendJson(res, 200, { files: await listReviews() });
      return true;
    }

    if (method === "POST" && route === "/api/outputs/reviews/check") {
      const body = await readJsonBody(req);
      const file = String(body.file ?? "");
      const id = String(body.id ?? "");
      const checked = Boolean(body.checked);

      // Guard: only outputs/review-*.md, no traversal.
      if (!/^review-[^/\\]+\.md$/.test(file)) {
        sendJson(res, 400, { error: "Invalid review file." });
        return true;
      }
      const abs = path.join(OUTPUTS_DIR, file);
      if (!existsSync(abs)) {
        sendJson(res, 404, { error: "Review file not found." });
        return true;
      }
      const original = await fs.readFile(abs, "utf8");
      const updated = toggleReviewCheckbox(original, id, checked);
      if (updated !== original) {
        await fs.writeFile(abs, updated, "utf8");
      }
      // Re-parse so the client gets the authoritative item state back.
      const item = parseReviewItems(matter(updated).content).find((i) => i.id === id) ?? null;
      sendJson(res, 200, { ok: true, changed: updated !== original, item });
      return true;
    }

    if (method === "GET" && route === "/api/outputs/ideas") {
      sendJson(res, 200, { files: await listIdeas() });
      return true;
    }

    if (method === "POST" && route === "/api/outputs/ideas/check") {
      const body = await readJsonBody(req);
      const file = String(body.file ?? "");
      const id = String(body.id ?? "");
      const checked = Boolean(body.checked);

      // Guard: only outputs/ideas-*.md, no traversal.
      if (!/^ideas-[^/\\]+\.md$/.test(file)) {
        sendJson(res, 400, { error: "Invalid ideas file." });
        return true;
      }
      const abs = path.join(OUTPUTS_DIR, file);
      if (!existsSync(abs)) {
        sendJson(res, 404, { error: "Ideas file not found." });
        return true;
      }
      const original = await fs.readFile(abs, "utf8");
      const updated = toggleIdeaCheckbox(original, id, checked);
      if (updated !== original) {
        await fs.writeFile(abs, updated, "utf8");
      }
      // Re-parse so the client gets the authoritative item state back.
      const item = parseIdeaItems(matter(updated).content).find((i) => i.id === id) ?? null;
      sendJson(res, 200, { ok: true, changed: updated !== original, item });
      return true;
    }

    if (method === "GET" && route === "/api/outputs/needs-context") {
      sendJson(res, 200, { files: await listNeedsContext() });
      return true;
    }

    if (method === "GET" && route === "/api/outputs/change-log") {
      sendJson(res, 200, { markdown: await readChangeLog() });
      return true;
    }

    if (method === "GET" && route === "/api/search") {
      const q = url.searchParams.get("q") ?? "";
      // Rewired to the active KnowledgeStore (semantic if embeddings are on,
      // else BM25). storeSearch never throws — it degrades to live BM25. Shape
      // is unchanged: { title, path, snippet, score }.
      sendJson(res, 200, { query: q, results: await storeSearch(q) });
      return true;
    }

    sendJson(res, 404, { error: `No such endpoint: ${method} ${route}` });
    return true;
  } catch (err) {
    sendJson(res, 500, { error: err instanceof Error ? err.message : "Internal error" });
    return true;
  }
}

/** Connect-style middleware adapter for Vite's dev & preview servers. */
export function fileApiMiddleware() {
  return (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
    if (!req.url || !req.url.startsWith("/api/")) {
      next();
      return;
    }
    void handleFileApi(req, res).then((handled) => {
      if (!handled) next();
    });
  };
}
