import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Renders a markdown string with the Tailwind Typography "prose" theme. */
export function MarkdownProse({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-invert prose-sm max-w-none",
        "prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em] prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-muted prose-pre:text-foreground prose-table:text-sm",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
