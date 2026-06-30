import { HelpCircle } from "lucide-react";
import { useNeedsContext } from "@/hooks/useKb";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MarkdownProse } from "@/components/MarkdownProse";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NeedsContext() {
  const { data: files, isLoading } = useNeedsContext();

  return (
    <div>
      <PageHeader
        eyebrow="Self-improvement"
        title="Needs context"
        description="MORE CONTEXT questions improve-system raised when a call was ambiguous. Read-only — answer them in your next session with the skill."
      />

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : !files || files.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No open questions"
          description="When a decision needs your input, improve-system writes a needs-context-*.md file here."
        />
      ) : (
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
              <CardContent>
                {file.questions.length > 0 ? (
                  <ul className="space-y-2">
                    {file.questions.map((q, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 rounded-lg border border-border bg-background/40 px-3 py-2.5 text-sm text-foreground"
                      >
                        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <MarkdownProse>{file.body}</MarkdownProse>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
