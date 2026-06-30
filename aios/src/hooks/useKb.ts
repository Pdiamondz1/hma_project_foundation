/**
 * TanStack Query hooks, one per File API surface. These mirror the shape of
 * harbormill-aios's Supabase hooks — in Phase 4 only the client underneath
 * changes (fetch → supabase.rpc), not these signatures.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fileApi, type ReviewFile } from "@/lib/fileApi";

export function useStats() {
  return useQuery({ queryKey: ["kb", "stats"], queryFn: fileApi.stats });
}

export function useWiki() {
  return useQuery({ queryKey: ["kb", "wiki"], queryFn: fileApi.wiki });
}

export function useWikiPage(file: string | null) {
  return useQuery({
    queryKey: ["kb", "wiki", "page", file],
    queryFn: () => fileApi.wikiPage(file as string),
    enabled: !!file,
  });
}

export function useRaw() {
  return useQuery({ queryKey: ["kb", "raw"], queryFn: fileApi.raw });
}

export function useReviews() {
  return useQuery({ queryKey: ["kb", "reviews"], queryFn: fileApi.reviews });
}

export function useNeedsContext() {
  return useQuery({ queryKey: ["kb", "needs-context"], queryFn: fileApi.needsContext });
}

export function useChangeLog() {
  return useQuery({ queryKey: ["kb", "change-log"], queryFn: fileApi.changeLog });
}

/**
 * Toggle a review checkbox — the one GUI mutation. Optimistically flips the
 * item in the cached review list, then reconciles with the server, and finally
 * invalidates stats (open-count changes).
 */
export function useToggleReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, id, checked }: { file: string; id: string; checked: boolean }) =>
      fileApi.checkReview(file, id, checked),
    onMutate: async ({ file, id, checked }) => {
      await qc.cancelQueries({ queryKey: ["kb", "reviews"] });
      const previous = qc.getQueryData<ReviewFile[]>(["kb", "reviews"]);
      qc.setQueryData<ReviewFile[]>(["kb", "reviews"], (old) =>
        old?.map((rf) =>
          rf.file === file
            ? { ...rf, items: rf.items.map((it) => (it.id === id ? { ...it, checked } : it)) }
            : rf
        )
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["kb", "reviews"], ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["kb", "reviews"] });
      void qc.invalidateQueries({ queryKey: ["kb", "stats"] });
    },
  });
}
