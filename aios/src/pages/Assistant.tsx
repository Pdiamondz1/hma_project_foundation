import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles, FileSearch } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fileApi } from "@/lib/fileApi";
import { brand } from "@/config/brand";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * "Ask the knowledge base" — a SEARCH panel over /api/search, not a chat UI and
 * not a simulated transcript. This is the RAG-ready seam: lexical results today,
 * vector retrieval + a live agent in Phase 4 (see src/lib/tools.ts).
 */
export default function Assistant() {
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
      />

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
          description="Lexical search over every wiki page's title, tags, and body. Results link straight to the page. (Vector retrieval arrives in Phase 4 — same panel, no rework.)"
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
