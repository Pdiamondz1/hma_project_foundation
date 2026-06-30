import { ScrollText, Lock } from "lucide-react";
import { useChangeLog } from "@/hooks/useKb";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MarkdownProse } from "@/components/MarkdownProse";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";

export default function ChangeLog() {
  const { data: markdown, isLoading } = useChangeLog();

  return (
    <div>
      <PageHeader
        eyebrow="Applied changes"
        title="Change log"
        description="Append-only ledger of changes the system has applied. Written by skills only — the console never writes here."
      />

      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        Read-only — change-log.md is owned by the skills, not the GUI.
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : !markdown || !markdown.trim() ? (
        <EmptyState icon={ScrollText} title="No change log found" />
      ) : (
        <Card>
          <CardContent className="pt-5">
            <MarkdownProse>{markdown}</MarkdownProse>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
