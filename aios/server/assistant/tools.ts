/**
 * EXTENSIBLE TOOL REGISTRY for the agent.
 *
 * ── Register your own tool (one line) ─────────────────────────────────────────
 *   TOOLS.push({ name, description, input_schema, handler: async (input) => {…} })
 * …or add it to EXAMPLE_TOOLS below. Each tool is `{ name, description,
 * input_schema, handler }`; `input_schema` is a JSON Schema (Anthropic tool-use
 * shape). The agent loop calls `handler(input)` server-side and feeds the
 * returned value back to the model as a tool_result.
 *
 * Ships GENERIC, project-agnostic tools (search_knowledge, get_wiki_page,
 * list_raw, get_change_log, propose_review_item) plus 2 clearly-marked EXAMPLE
 * template tools that show a cloned project how to register its own domain tool.
 *
 * SAFETY: `propose_review_item` is the only writer the agent gets, and it only
 * PROPOSES — it appends a NEEDS SIGN-OFF checkbox to today's review file. It
 * never applies a change and never writes outputs/change-log.md (skills own that
 * ledger). The console's human-gated approval flow stays in control.
 */
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import { OUTPUTS_DIR, RAW_DIR } from "../kb/paths";
import { readWikiDoc, listRawAssets, readChangeLog } from "../kb/wiki";
import { storeSearch } from "../kb/store";

export interface AgentTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

/* ───────────────────── propose_review_item (pure helpers) ─────────────────── */

/** YYYY-MM-DD for `d` in local time. */
export function todayStamp(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Next NNN sequence for `rv-<compact>-NNN` ids already present in `body`. */
export function nextReviewSeq(body: string, compact: string): number {
  const re = new RegExp("`rv-" + compact + "-(\\d{3,})`", "g");
  let max = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) max = Math.max(max, parseInt(m[1], 10));
  return max + 1;
}

/** Build a contract-valid NEEDS SIGN-OFF line. Pure. */
export function buildReviewItemLine(
  id: string,
  args: { text: string; target?: string; detail?: string }
): string {
  let line = `- [ ] \`${id}\` — ${String(args.text).trim()}`;
  if (args.target && String(args.target).trim()) line += `  ·  target: ${String(args.target).trim()}`;
  if (args.detail && String(args.detail).trim()) line += `  ·  detail: ${String(args.detail).trim()}`;
  return line;
}

function reviewFrontmatter(date: string): string {
  return (
    `---\n` +
    `title: Review Queue — ${date}\n` +
    `source_id: outputs:review-${date}\n` +
    `generated_by: assistant:propose_review_item\n` +
    `updated: ${date}\n` +
    `---\n\n` +
    `# Review Queue — ${date}\n\n` +
    `Proposed items awaiting human sign-off. The assistant PROPOSES; it never\n` +
    `applies a change and never writes outputs/change-log.md.\n`
  );
}

export interface ProposeResult {
  id: string;
  file: string;
  line: string;
  created: boolean;
}

/**
 * Append a NEEDS SIGN-OFF item to today's `outputs/review-YYYY-MM-DD.md`,
 * creating the file (with frontmatter) if needed. Writes ONLY that review file;
 * never touches change-log.md. `opts` is injectable for tests.
 */
export async function proposeReviewItem(
  args: { text: string; target?: string; detail?: string },
  opts?: { outputsDir?: string; today?: string }
): Promise<ProposeResult> {
  if (!args || !String(args.text ?? "").trim()) {
    throw new Error("propose_review_item requires a non-empty `text`.");
  }
  const today = opts?.today ?? todayStamp();
  const compact = today.replace(/-/g, "");
  const dir = opts?.outputsDir ?? OUTPUTS_DIR;
  const file = `review-${today}.md`;
  const abs = path.join(dir, file);

  await fs.mkdir(dir, { recursive: true });
  let created = false;
  let body: string;
  if (existsSync(abs)) {
    body = await fs.readFile(abs, "utf8");
  } else {
    body = reviewFrontmatter(today);
    created = true;
  }

  const seq = nextReviewSeq(body, compact);
  const id = `rv-${compact}-${String(seq).padStart(3, "0")}`;
  const line = buildReviewItemLine(id, args);
  const sep = body.endsWith("\n") ? "" : "\n";
  body = `${body}${sep}${line}\n`;
  await fs.writeFile(abs, body, "utf8");

  return { id, file, line, created };
}

/* ─────────────────────────────── Generic tools ───────────────────────────── */

const GENERIC_TOOLS: AgentTool[] = [
  {
    name: "search_knowledge",
    description:
      "Search the wiki/ knowledge base (the AI-written index over raw/). Returns ranked hits (semantic when embeddings are enabled, else BM25). Use this first to ground any answer, then cite the wiki paths you used.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural-language search query." },
        k: { type: "number", description: "Max results (default 6)." },
      },
      required: ["query"],
    },
    handler: async (input) => {
      const k = typeof input.k === "number" ? input.k : 6;
      return storeSearch(String(input.query ?? ""), k);
    },
  },
  {
    name: "get_wiki_page",
    description:
      "Read one wiki/ page in full (frontmatter + markdown body) by its wiki-relative path, e.g. 'index.md'.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Wiki-relative path, e.g. 'index.md'." },
      },
      required: ["path"],
    },
    handler: async (input) => {
      const page = await readWikiDoc(String(input.path ?? ""));
      return page ?? { error: "Wiki page not found or outside wiki/." };
    },
  },
  {
    name: "list_raw",
    description:
      "List the immutable raw/ assets (path, size, mtime). Read-only — raw/ is ground truth and is never edited.",
    input_schema: { type: "object", properties: {} },
    handler: async () => listRawAssets(),
  },
  {
    name: "get_change_log",
    description:
      "Return the applied-changes ledger (outputs/change-log.md). Read-only — the assistant never writes it.",
    input_schema: { type: "object", properties: {} },
    handler: async () => ({ markdown: await readChangeLog() }),
  },
  {
    name: "propose_review_item",
    description:
      "PROPOSE a change for human sign-off by appending a NEEDS SIGN-OFF checkbox to today's outputs/review-YYYY-MM-DD.md. This only proposes — it never applies the change and never writes the change-log. Use it whenever you want to suggest an edit to the knowledge base or a skill.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Concise description of the proposed change." },
        target: { type: "string", description: "Path the change targets, e.g. 'wiki/index.md'." },
        detail: { type: "string", description: "What specifically would change." },
      },
      required: ["text"],
    },
    handler: async (input) =>
      proposeReviewItem({
        text: String(input.text ?? ""),
        target: input.target ? String(input.target) : undefined,
        detail: input.detail ? String(input.detail) : undefined,
      }),
  },
];

/* ─────────────────────────── EXAMPLE template tools ──────────────────────────
 * These two are TEMPLATES, not core capability. They demonstrate how a cloned
 * project registers its OWN domain tool. Replace or delete them for your build.
 * ──────────────────────────────────────────────────────────────────────────── */

const EXAMPLE_TOOLS: AgentTool[] = [
  {
    // EXAMPLE 1 — a domain "write" tool. Appends a NEW timestamped file under
    // raw/ecosystem/ (raw/ is append-only: add new files, never mutate existing
    // ones). A real clone might record a journal entry, a transaction, a lead…
    name: "record_entry",
    description:
      "EXAMPLE TOOL — record a new entry as an immutable file under raw/ecosystem/. Demonstrates a domain 'write' tool a cloned project would customize.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short title (used in the filename)." },
        content: { type: "string", description: "The entry body (markdown)." },
      },
      required: ["title", "content"],
    },
    handler: async (input) => {
      const title = String(input.title ?? "entry").trim() || "entry";
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
      const stamp = todayStamp();
      const dir = path.join(RAW_DIR, "ecosystem");
      await fs.mkdir(dir, { recursive: true });
      // Unique, never-overwriting filename (raw/ is immutable/append-only).
      let file = `${stamp}-${slug || "entry"}.md`;
      let n = 1;
      while (existsSync(path.join(dir, file))) file = `${stamp}-${slug || "entry"}-${++n}.md`;
      const abs = path.join(dir, file);
      await fs.writeFile(abs, `# ${title}\n\n${String(input.content ?? "")}\n`, "utf8");
      return { ok: true, path: `ecosystem/${file}` };
    },
  },
  {
    // EXAMPLE 2 — a domain "read/lookup" tool, stubbed. Wire your own provider
    // (web search, an internal API, a database) inside the handler.
    name: "web_lookup",
    description:
      "EXAMPLE TOOL (stub) — look something up on the web. Returns a not-configured notice until a cloned project wires a real provider into the handler.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to look up." },
      },
      required: ["query"],
    },
    handler: async (input) => ({
      configured: false,
      query: String(input.query ?? ""),
      note: "web_lookup is a stub. Wire a fetch/search provider into this handler to enable it.",
    }),
  },
];

/** The live registry handed to the agent loop. */
export const TOOLS: AgentTool[] = [...GENERIC_TOOLS, ...EXAMPLE_TOOLS];

/** Anthropic tool definitions (name/description/input_schema), no handlers. */
export function toolDefinitions(): { name: string; description: string; input_schema: AgentTool["input_schema"] }[] {
  return TOOLS.map(({ name, description, input_schema }) => ({ name, description, input_schema }));
}

/** Run a tool by name; returns a JSON-serializable result (never throws). */
export async function runTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { error: `Unknown tool: ${name}` };
  try {
    return await tool.handler(input ?? {});
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
