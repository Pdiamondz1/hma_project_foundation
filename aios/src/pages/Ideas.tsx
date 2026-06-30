import { Lightbulb } from "lucide-react";
import { useIdeas, useToggleIdea } from "@/hooks/useKb";
import type { IdeaItem } from "@/lib/fileApi";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const byWeightDesc = (a: IdeaItem, b: IdeaItem) => (b.weight ?? 0) - (a.weight ?? 0);

export default function Ideas() {
  const { data: files, isLoading } = useIdeas();
  const toggle = useToggleIdea();

  const totalOpen =
    files?.reduce(
      (acc, f) => acc + f.items.filter((i) => !i.archived && !i.checked).length,
      0
    ) ?? 0;
  // Count across all files so the empty state fires even when files exist but carry no items.
  const totalItems = files?.reduce((acc, f) => acc + f.items.length, 0) ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Proactive advisor"
        title="Ideas"
        description="The advisor proposes these from your knowledge base, activity, and metrics. Check a box to approve one — approving drafts a brief or a review item, it never ships a change."
      />

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : !files || totalItems === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas yet"
          description="The advisor proposes ranked ideas on the maintenance tick. When it does, they show up here for you to approve."
        />
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{totalOpen}</span> idea
            {totalOpen === 1 ? "" : "s"} awaiting approval across {files.length} file
            {files.length === 1 ? "" : "s"}.
          </div>

          <div className="space-y-6">
            {files.map((file) => {
              const active = file.items.filter((i) => !i.archived).sort(byWeightDesc);
              const archived = file.items.filter((i) => i.archived).sort(byWeightDesc);
              return (
                <Card key={file.file}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-3">
                      <span>{file.title}</span>
                      <span className="font-mono text-xs font-normal text-muted-foreground">
                        {file.file}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {file.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No ideas in this file.</p>
                    ) : (
                      <>
                        {active.map((item) => (
                          <IdeaRow
                            key={item.id}
                            item={item}
                            pending={toggle.isPending}
                            onToggle={(checked) =>
                              toggle.mutate({ file: file.file, id: item.id, checked })
                            }
                          />
                        ))}
                        {archived.length > 0 && (
                          <details className="rounded-lg border border-border bg-background/40">
                            <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                              Archived ({archived.length})
                            </summary>
                            <div className="space-y-2 px-3 pb-3 pt-2">
                              {archived.map((item) => (
                                <IdeaRow
                                  key={item.id}
                                  item={item}
                                  pending={toggle.isPending}
                                  onToggle={(checked) =>
                                    toggle.mutate({ file: file.file, id: item.id, checked })
                                  }
                                />
                              ))}
                            </div>
                          </details>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {toggle.isError && (
            <p className="mt-4 text-sm text-destructive-foreground">
              Couldn't write the change: {(toggle.error as Error).message}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function IdeaRow({
  item,
  pending,
  onToggle,
}: {
  item: IdeaItem;
  pending: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors ${
        item.checked
          ? "border-success/40 bg-success/5"
          : "border-border bg-background/40 hover:bg-accent/30"
      }`}
    >
      <input
        type="checkbox"
        checked={item.checked}
        disabled={pending}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {item.dim && <Badge>{item.dim}</Badge>}
          {item.weight !== undefined && (
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              weight: {item.weight}
            </code>
          )}
          {item.checked && <Badge variant="success">approved</Badge>}
        </div>
        <p className="mt-1.5 text-sm font-medium text-foreground">{item.text}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {item.why && (
            <span>
              <span className="font-semibold">why:</span> {item.why}
            </span>
          )}
          {item.score && (
            <span>
              <span className="font-semibold">score:</span> {item.score}
            </span>
          )}
          {item.next && (
            <span>
              <span className="font-semibold">next:</span> {item.next}
            </span>
          )}
        </div>
        {item.from && item.from.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.from.map((src, i) => (
              <span
                key={i}
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {src}
              </span>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}
