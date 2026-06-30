import { ArrowLeft, BookOpen } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useWiki, useWikiPage } from "@/hooks/useKb";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MarkdownProse } from "@/components/MarkdownProse";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Wiki() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openFile = searchParams.get("open");
  const setOpenFile = (file: string | null) => {
    if (file) setSearchParams({ open: file });
    else setSearchParams({});
  };
  const { data: pages, isLoading } = useWiki();
  const { data: page, isLoading: pageLoading } = useWikiPage(openFile);

  if (openFile) {
    return (
      <div>
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => setOpenFile(null)}>
          <ArrowLeft className="h-4 w-4" /> All pages
        </Button>
        {pageLoading || !page ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Spinner className="h-9 w-9" />
          </div>
        ) : (
          <article>
            <PageHeader
              eyebrow={page.frontmatter.path ? String(page.frontmatter.path) : "wiki"}
              title={page.title}
            />
            {page.tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-1.5">
                {page.tags.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
            <Card>
              <CardContent className="pt-5">
                <MarkdownProse>{page.body}</MarkdownProse>
              </CardContent>
            </Card>
          </article>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Knowledge base"
        title="Wiki"
        description="The AI-written table of contents over raw/. Pages are maintained only by skills — never hand-edited. Click any page to read it."
      />

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : !pages || pages.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No wiki pages yet"
          description="Add an asset with the add-new-resource skill and the wiki entries that index it will appear here."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pages.map((p) => (
            <button
              key={p.file}
              onClick={() => setOpenFile(p.file)}
              className="group rounded-xl border border-border bg-card p-4 text-left shadow-card-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-foreground group-hover:text-primary">
                  {p.title}
                </h3>
                {p.updated && (
                  <span className="shrink-0 text-xs text-muted-foreground">{p.updated}</span>
                )}
              </div>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{p.file}</p>
              {p.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.slice(0, 6).map((t) => (
                    <Badge key={t} variant="muted">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
