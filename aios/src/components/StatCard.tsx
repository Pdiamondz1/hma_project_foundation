import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  /** Left accent border color class, e.g. "border-l-primary". */
  accent?: string;
}

export function StatCard({ label, value, hint, icon: Icon, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border border-l-2 border-border bg-card p-4 shadow-card-sm ${
        accent ?? "border-l-primary"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="tnum mt-1 text-3xl font-bold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
