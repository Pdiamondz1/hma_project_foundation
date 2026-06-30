import { cn } from "@/lib/utils";

/** Minimal accessible spinner using the brand ring color. */
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary",
        className
      )}
    />
  );
}
