import { Lock, FileStack } from "lucide-react";
import { useRaw } from "@/hooks/useKb";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";
import { formatBytes, formatDate } from "@/lib/utils";

export default function Raw() {
  const { data: assets, isLoading } = useRaw();

  return (
    <div>
      <PageHeader
        eyebrow="Ground truth"
        title="Raw assets"
        description="Original, immutable assets. Everything in the wiki points back here. This view is strictly read-only — raw/ is never edited, reorganized, or deleted."
      />

      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        Immutable — append-only. The console cannot modify these files.
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : !assets || assets.length === 0 ? (
        <EmptyState
          icon={FileStack}
          title="No raw assets yet"
          description="Ingest sessions, ecosystem data, or curated content with the sync skills and they land here."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Path</th>
                  <th className="px-4 py-3 text-right font-medium">Size</th>
                  <th className="px-4 py-3 text-right font-medium">Modified</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr
                    key={a.path}
                    className="border-b border-border/60 last:border-0 hover:bg-accent/30"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">{a.path}</td>
                    <td className="tnum whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground">
                      {formatBytes(a.size)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground">
                      {formatDate(a.mtime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
