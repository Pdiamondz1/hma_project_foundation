/**
 * HTTP routing for the Phase-4 intelligence endpoints, delegated to from the
 * existing File API middleware (server/fileApi.ts). Returns `true` when it has
 * handled the request, `false` to fall through to the v1 routes.
 *
 *   POST /api/kb/reindex        — (re)build the active store's index
 *   GET  /api/assistant/status  — { enabled, model, backend }
 *   POST /api/assistant/chat    — SSE chat (or { disabled:true } with no key)
 *
 * /api/search and /api/kb/stats stay in fileApi.ts (rewired there to the store).
 */
import "./env"; // side effect: load aios/.env
import type { IncomingMessage, ServerResponse } from "node:http";
import { runReindex } from "./kb/reindex";
import { assistantStatus, streamChat } from "./assistant/chat";
import { assistantEnabled } from "./env";

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

type ChatMsg = { role: "user" | "assistant"; content: string };

/** Coerce the request body into a clean message history. */
function parseHistory(body: Record<string, unknown>): ChatMsg[] {
  const out: ChatMsg[] = [];
  const raw = Array.isArray(body.messages) ? body.messages : [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const role = (m as Record<string, unknown>).role;
    const content = (m as Record<string, unknown>).content;
    if ((role === "user" || role === "assistant") && typeof content === "string" && content.trim()) {
      out.push({ role, content });
    }
  }
  // Allow a bare { message } shorthand for the latest user turn.
  if (typeof body.message === "string" && body.message.trim()) {
    out.push({ role: "user", content: body.message });
  }
  return out;
}

export async function handleIntelligenceApi(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  method: string
): Promise<boolean> {
  const route = url.pathname;

  if (method === "POST" && route === "/api/kb/reindex") {
    try {
      const result = await runReindex();
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 500, { error: err instanceof Error ? err.message : "Reindex failed" });
    }
    return true;
  }

  if (method === "GET" && route === "/api/assistant/status") {
    sendJson(res, 200, await assistantStatus());
    return true;
  }

  if (method === "POST" && route === "/api/assistant/chat") {
    if (!assistantEnabled()) {
      // Graceful-off: 200 with a flag so the UI falls back to the search panel.
      sendJson(res, 200, { disabled: true });
      return true;
    }
    const body = await readJsonBody(req);
    const history = parseHistory(body);
    if (history.length === 0) {
      sendJson(res, 400, { error: "No message provided." });
      return true;
    }
    await streamChat(res, history);
    return true;
  }

  return false;
}
