import { FileStack, BookOpen, CheckSquare, HelpCircle, ScrollText } from "lucide-react";
import { Link } from "react-router-dom";
import { useStats } from "@/hooks/useKb";
import { brand } from "@/config/brand";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Overview() {
  const { data: stats, isLoading, isError } = useStats();

  return (
    <div>
      <PageHeader
        eyebrow="Operating deck"
        title="Overview"
        description={brand.tagline}
      />

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : isError || !stats ? (
        <EmptyState
          icon={FileStack}
          title="Couldn't load knowledge-base stats"
          description="Make sure the dev server is running (npm run dev) so the local File API is mounted."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Raw assets" value={stats.raw.files} icon={FileStack} hint="immutable" accent="border-l-primary" />
            <StatCard label="Wiki pages" value={stats.wiki.pages} icon={BookOpen} accent="border-l-primary" />
            <StatCard
              label="Open reviews"
              value={stats.reviews.open}
              icon={CheckSquare}
              hint={`${stats.reviews.total} total · ${stats.reviews.files} file(s)`}
              accent="border-l-warning"
            />
            <StatCard
              label="Open questions"
              value={stats.needsContext.open}
              icon={HelpCircle}
              accent="border-l-secondary"
            />
            <StatCard
              label="Recent changes"
              value={stats.changeLog.recent.length}
              icon={ScrollText}
              accent="border-l-success"
            />
          </div>

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Recent change-log</h2>
              <Link to="/change-log" className="text-xs font-semibold text-primary hover:underline">
                View ledger →
              </Link>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Applied changes (written by skills only)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.changeLog.recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No changes applied yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {stats.changeLog.recent.map((line, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-border bg-background/40 px-3 py-2 font-mono text-xs text-foreground"
                      >
                        {line.replace(/^-\s*/, "")}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
