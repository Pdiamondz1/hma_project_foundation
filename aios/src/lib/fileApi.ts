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
  /** Phase-4 retrieval summary (optional — absent on a pure-v1 backend). */
  kb?: { backend: string; vectors: number; lastIndexed: string | null; embeddings: string };
}

export interface AssistantStatus {
  enabled: boolean;
  model: string;
  backend: string;
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

export interface IdeaItem {
  id: string;
  checked: boolean;
  text: string;
  dim?: string;
  weight?: number;
  lane?: string;
  why?: string;
  score?: string;
  from?: string[];
  next?: string;
  archived: boolean;
  raw: string;
}

export interface IdeaFile {
  file: string;
  title: string;
  items: IdeaItem[];
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

  ideas: () =>
    getJson<{ files: IdeaFile[] }>("/api/outputs/ideas").then((r) => r.files),

  /** The ONLY mutation the GUI performs on ideas: toggle one idea checkbox in place. */
  checkIdea: async (file: string, id: string, checked: boolean) => {
    const res = await fetch("/api/outputs/ideas/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file, id, checked }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Toggle failed (${res.status}): ${detail}`);
    }
    return (await res.json()) as { ok: boolean; changed: boolean; item: IdeaItem | null };
  },

  needsContext: () =>
    getJson<{ files: NeedsContextFile[] }>("/api/outputs/needs-context").then((r) => r.files),

  changeLog: () =>
    getJson<{ markdown: string }>("/api/outputs/change-log").then((r) => r.markdown),

  search: (q: string) =>
    getJson<{ query: string; results: SearchResult[] }>(
      `/api/search?q=${encodeURIComponent(q)}`
    ).then((r) => r.results),

  /** Phase-4: the agent's status. enabled=false → fall back to the search panel. */
  assistantStatus: () => getJson<AssistantStatus>("/api/assistant/status"),

  /** Phase-4: (re)build the active store's index from wiki/ pages. */
  kbReindex: async () => {
    const res = await fetch("/api/kb/reindex", { method: "POST" });
    if (!res.ok) throw new Error(`Reindex failed (${res.status})`);
    return (await res.json()) as {
      count: number;
      backend: string;
      vectors: number;
      lastIndexed: string | null;
      embeddings: string;
    };
  },
};

/* ─────────────────────────── Assistant SSE chat ─────────────────────────── */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatHandlers {
  onText?: (delta: string) => void;
  onToolUse?: (name: string, input: unknown) => void;
  onToolResult?: (name: string) => void;
  onError?: (message: string) => void;
  onDisabled?: () => void;
  onDone?: () => void;
}

function dispatchSseEvent(chunk: string, h: ChatHandlers): void {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of chunk.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return;
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
  } catch {
    return;
  }
  switch (event) {
    case "text":
      h.onText?.(String(data.delta ?? ""));
      break;
    case "tool_use":
      h.onToolUse?.(String(data.name ?? ""), data.input);
      break;
    case "tool_result":
      h.onToolResult?.(String(data.name ?? ""));
      break;
    case "error":
      h.onError?.(String(data.message ?? "Assistant error"));
      break;
    case "done":
      h.onDone?.();
      break;
  }
}

/**
 * Stream a chat turn from POST /api/assistant/chat. Parses the SSE event stream
 * and invokes the matching handler. If the server responds with JSON
 * `{ disabled:true }` (no ANTHROPIC_API_KEY), `onDisabled` fires instead.
 */
export async function chatStream(messages: ChatMessage[], handlers: ChatHandlers): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch (err) {
    handlers.onError?.(err instanceof Error ? err.message : "Network error");
    handlers.onDone?.();
    return;
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!res.body || contentType.includes("application/json")) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (data.disabled) handlers.onDisabled?.();
    else handlers.onError?.(String(data.error ?? `Request failed (${res.status})`));
    handlers.onDone?.();
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      if (chunk.trim()) dispatchSseEvent(chunk, handlers);
    }
  }
  if (buffer.trim()) dispatchSseEvent(buffer, handlers);
}
