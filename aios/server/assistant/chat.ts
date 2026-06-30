/**
 * The agent — an Anthropic tool-use loop, streamed over SSE.
 *
 * GRACEFUL-OFF: with no ANTHROPIC_API_KEY the status is `{enabled:false}` and
 * /chat returns `{disabled:true}` (handled in the route); the UI shows the
 * search panel. The Anthropic SDK is imported DYNAMICALLY so the lean path
 * (no key) never loads it.
 *
 * Model: env ANTHROPIC_MODEL (default claude-sonnet-4-6). System prompt is
 * GENERIC and project-agnostic, grounded in this project's KB via the tool
 * registry (search_knowledge / get_wiki_page / …). See ./tools.ts.
 */
import type { ServerResponse } from "node:http";
// Type-only import: erased at runtime, so it never loads the SDK on the lean path.
import type Anthropic from "@anthropic-ai/sdk";
import { assistantEnabled, resolveModel, getCapabilities, type Capabilities } from "../env";
import { kbStatsSummary } from "../kb/reindex";
import { toolDefinitions, runTool } from "./tools";

/** Project type, mirrored server-side (defaults to "general"; PROJECT_TYPE env). */
function projectType(env: NodeJS.ProcessEnv = process.env): string {
  return env.PROJECT_TYPE?.trim() || "general";
}

export interface AssistantStatus {
  enabled: boolean;
  model: string;
  backend: string;
}

/** `{ enabled, model, backend }` for GET /api/assistant/status. */
export async function assistantStatus(env: NodeJS.ProcessEnv = process.env): Promise<AssistantStatus> {
  let backend = "local:bm25";
  try {
    backend = (await kbStatsSummary()).backend;
  } catch {
    /* keep default */
  }
  return {
    enabled: assistantEnabled(env),
    model: resolveModel(env),
    backend,
  };
}

function systemPrompt(backend: string, caps: Capabilities, type: string): string {
  return [
    `You are a knowledge-base assistant for a file-first "second brain" project.`,
    `This project is of type "${type}". It is a reusable template, so keep your help general-purpose unless the knowledge base says otherwise.`,
    ``,
    `The knowledge base has three folders, surfaced through your tools:`,
    `- raw/    immutable original assets (ground truth; never edited).`,
    `- wiki/   an AI-written, cross-linked table of contents over raw/ (search this).`,
    `- outputs/ generated reports and the human approval queues.`,
    ``,
    `How to work:`,
    `- Ground every factual claim in the knowledge base. Call search_knowledge first, then get_wiki_page to read a page in full. Cite the wiki paths you used.`,
    `- Retrieval backend in use: ${backend}. Semantic search ${caps.semanticSearch ? "is" : "may not be"} enabled; results are always at least lexical (BM25).`,
    `- If you want to suggest a change to the knowledge base or a skill, use propose_review_item. It only PROPOSES (appends a NEEDS SIGN-OFF checkbox for the human); it never applies a change and never edits the change log. Tell the user you proposed it.`,
    `- If the knowledge base does not contain the answer, say so plainly rather than guessing.`,
    `- Be concise and cite sources.`,
  ].join("\n");
}

type Msg = { role: "user" | "assistant"; content: string };

function sse(res: ServerResponse, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Stream a chat turn. `history` is the full prior conversation plus the latest
 * user message. Runs the Anthropic tool-use loop and emits SSE events:
 *   text        { delta }
 *   tool_use    { name, input }
 *   tool_result { name }
 *   error       { message }
 *   done        {}
 */
export async function streamChat(
  res: ServerResponse,
  history: Msg[],
  env: NodeJS.ProcessEnv = process.env
): Promise<void> {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const model = resolveModel(env);
  let backend = "local:bm25";
  try {
    backend = (await kbStatsSummary()).backend;
  } catch {
    /* keep default */
  }

  try {
    // Dynamic import keeps the SDK off the lean path.
    const mod = await import("@anthropic-ai/sdk");
    const AnthropicCtor = mod.default;
    const client = new AnthropicCtor({ apiKey: env.ANTHROPIC_API_KEY });

    const tools = toolDefinitions() as Anthropic.Tool[];
    const messages: Anthropic.MessageParam[] = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const MAX_ITERATIONS = 8;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const stream = client.messages.stream({
        model,
        max_tokens: 4096,
        system: systemPrompt(backend, getCapabilities(env), projectType(env)),
        tools,
        messages,
      });
      stream.on("text", (delta: string) => sse(res, "text", { delta }));

      const final = await stream.finalMessage();
      messages.push({ role: "assistant", content: final.content });

      const toolUses = final.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      if (toolUses.length === 0) break;

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tu of toolUses) {
        sse(res, "tool_use", { name: tu.name, input: tu.input });
        const result = await runTool(tu.name, (tu.input ?? {}) as Record<string, unknown>);
        sse(res, "tool_result", { name: tu.name });
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify(result).slice(0, 20000),
        });
      }
      messages.push({ role: "user", content: toolResults });
    }

    sse(res, "done", {});
  } catch (err) {
    sse(res, "error", { message: err instanceof Error ? err.message : "Assistant error" });
    sse(res, "done", {});
  } finally {
    res.end();
  }
}
