import { CheckSquare } from "lucide-react";
import { useReviews, useToggleReview } from "@/hooks/useKb";
import type { ReviewItem } from "@/lib/fileApi";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Review() {
  const { data: files, isLoading } = useReviews();
  const toggle = useToggleReview();

  const totalOpen =
    files?.reduce((acc, f) => acc + f.items.filter((i) => !i.checked).length, 0) ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Self-improvement"
        title="Review queue"
        description="NEEDS SIGN-OFF items proposed by improve-system. Check a box to approve it — improve-system applies only checked items on its next run. This is the console's only write."
      />

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : !files || files.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Nothing awaiting sign-off"
          description="When improve-system finds a structural change or a new/edited skill, it writes a review-*.md checkbox list here."
        />
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{totalOpen}</span> item
            {totalOpen === 1 ? "" : "s"} awaiting sign-off across {files.length} file
            {files.length === 1 ? "" : "s"}.
          </div>

          <div className="space-y-6">
            {files.map((file) => (
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
                    <p className="text-sm text-muted-foreground">No checkbox items in this file.</p>
                  ) : (
                    file.items.map((item) => (
                      <ReviewRow
                        key={item.id}
                        item={item}
                        pending={toggle.isPending}
                        onToggle={(checked) =>
                          toggle.mutate({ file: file.file, id: item.id, checked })
                        }
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
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

function ReviewRow({
  item,
  pending,
  onToggle,
}: {
  item: ReviewItem;
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
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {item.id}
          </code>
          {item.checked && <Badge variant="success">approved</Badge>}
        </div>
        <p className="mt-1.5 text-sm font-medium text-foreground">{item.text}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {item.target && (
            <span>
              <span className="font-semibold">target:</span>{" "}
              <span className="font-mono">{item.target}</span>
            </span>
          )}
          {item.detail && (
            <span>
              <span className="font-semibold">detail:</span> {item.detail}
            </span>
          )}
        </div>
      </div>
    </label>
  );
}
