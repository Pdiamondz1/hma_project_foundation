import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles, FileSearch, Send, Wrench, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fileApi, chatStream, type ChatMessage } from "@/lib/fileApi";
import { brand } from "@/config/brand";
import { knowledgeStatusEnabled } from "@/config/project";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MarkdownProse } from "@/components/MarkdownProse";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * The Assistant surface adapts to what the deployment has turned on:
 *  - ANTHROPIC_API_KEY present → a real streaming chat UI (renders tool calls).
 *  - no key → the v1 search panel over /api/search (unchanged), with a small
 *    note on how to enable the agent.
 * On-brand dark ops-deck either way.
 */
export default function Assistant() {
  const { data: status, isLoading } = useQuery({
    queryKey: ["assistant", "status"],
    queryFn: fileApi.assistantStatus,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-9 w-9" />
      </div>
    );
  }

  return status?.enabled ? (
    <ChatPanel backend={status.backend} model={status.model} />
  ) : (
    <SearchPanel backend={status?.backend} />
  );
}

/* ─────────────────────────── Knowledge status badge ─────────────────────── */

function KnowledgeBadge({ backend }: { backend?: string }) {
  if (!knowledgeStatusEnabled() || !backend) return null;
  return (
    <Badge variant="muted" className="gap-1.5">
      <Database className="h-3 w-3" />
      <span className="font-mono text-[0.7rem]">{backend}</span>
    </Badge>
  );
}

/* ─────────────────────────────── Chat (agent on) ─────────────────────────── */

interface UiMessage {
  role: "user" | "assistant";
  content: string;
  tools: string[];
}

function ChatPanel({ backend, model }: { backend: string; model: string }) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    setBusy(true);

    const history: UiMessage[] = [...messages, { role: "user", content: text, tools: [] }];
    // Add an empty assistant message we stream into.
    setMessages([...history, { role: "assistant", content: "", tools: [] }]);

    const wire: ChatMessage[] = history.map((m) => ({ role: m.role, content: m.content }));
    const idx = history.length; // index of the streaming assistant message

    const update = (fn: (m: UiMessage) => UiMessage) =>
      setMessages((prev) => prev.map((m, i) => (i === idx ? fn(m) : m)));

    await chatStream(wire, {
      onText: (delta) => update((m) => ({ ...m, content: m.content + delta })),
      onToolUse: (name) =>
        update((m) => (m.tools.includes(name) ? m : { ...m, tools: [...m.tools, name] })),
      onError: (message) =>
        update((m) => ({ ...m, content: m.content + `\n\n_⚠ ${message}_` })),
      onDone: () => setBusy(false),
    });
  };

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <PageHeader
        eyebrow="Knowledge base"
        title={`Ask ${brand.assistantName}`}
        description={`${brand.assistantName} reads this project's knowledge base and cites the pages it uses.`}
        actions={
          <div className="flex items-center gap-2">
            <KnowledgeBadge backend={backend} />
            <Badge variant="outline" className="font-mono text-[0.7rem]">
              {model}
            </Badge>
          </div>
        }
      />

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-card/40 p-4"
      >
        {messages.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={`Chat with ${brand.assistantName}`}
            description="Ask anything about this project's knowledge base. The assistant searches the wiki, reads pages, and can propose review items for your sign-off."
          />
        ) : (
          messages.map((m, i) => <MessageBubble key={i} message={m} />)
        )}
        {busy && messages[messages.length - 1]?.content === "" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            Thinking…
          </div>
        )}
      </div>

      <form onSubmit={send} className="mt-4 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${brand.assistantName}…`}
          aria-label="Message the assistant"
          disabled={busy}
        />
        <Button type="submit" disabled={!draft.trim() || busy}>
          <Send className="h-4 w-4" />
          Send
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
            : "max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5"
        }
      >
        {message.tools.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {message.tools.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1">
                <Wrench className="h-3 w-3" />
                {t}
              </Badge>
            ))}
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : message.content ? (
          <MarkdownProse>{message.content}</MarkdownProse>
        ) : null}
      </div>
    </div>
  );
}

/* ───────────────────────────── Search (agent off) ────────────────────────── */

function SearchPanel({ backend }: { backend?: string }) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");

  const { data: results, isFetching } = useQuery({
    queryKey: ["kb", "search", query],
    queryFn: () => fileApi.search(query),
    enabled: query.trim().length > 0,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(draft.trim());
  };

  return (
    <div>
      <PageHeader
        eyebrow="Knowledge base"
        title={`Ask ${brand.assistantName}`}
        description={`${brand.assistantName} is ${brand.assistantPersona}.`}
        actions={<KnowledgeBadge backend={backend} />}
      />

      <p className="mb-4 rounded-lg border border-dashed border-border bg-card/40 px-3 py-2 text-xs text-muted-foreground">
        Set <code className="rounded bg-muted px-1 py-0.5 font-mono">ANTHROPIC_API_KEY</code> to enable the
        assistant (a streaming chat agent). Without it, this is a search panel over the knowledge base.
      </p>

      <form onSubmit={submit} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search the wiki — e.g. a topic, source, or term…"
            className="pl-9"
            aria-label="Search the knowledge base"
          />
        </div>
        <Button type="submit" disabled={!draft.trim()}>
          Search
        </Button>
      </form>

      {!query.trim() ? (
        <EmptyState
          icon={Sparkles}
          title="Search across the wiki"
          description="Ranked search over every wiki page's title, tags, and body. Results link straight to the page. Turn on embeddings for semantic retrieval — same panel, no rework."
        />
      ) : isFetching ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : !results || results.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title={`No matches for "${query}"`}
          description="Try a different term, or add more to the knowledge base with the sync skills."
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"} for{" "}
            <span className="font-semibold text-foreground">{query}</span>
          </p>
          {results.map((r) => (
            <Link
              key={r.path}
              to={`/wiki?open=${encodeURIComponent(r.path)}`}
              className="block rounded-xl border border-border bg-card p-4 shadow-card-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-foreground">{r.title}</h3>
                <Badge variant="outline">score {r.score}</Badge>
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{r.path}</p>
              {r.snippet && <p className="mt-2 text-sm text-muted-foreground">{r.snippet}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
