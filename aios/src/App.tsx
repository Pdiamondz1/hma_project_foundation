import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { features } from "@/config/features";
import { assistantSurfaceEnabled } from "@/config/project";

import Overview from "@/pages/Overview";
import Wiki from "@/pages/Wiki";
import Raw from "@/pages/Raw";
import Review from "@/pages/Review";
import Ideas from "@/pages/Ideas";
import NeedsContext from "@/pages/NeedsContext";
import ChangeLog from "@/pages/ChangeLog";
import Assistant from "@/pages/Assistant";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Overview />} />
            {features.wiki && <Route path="wiki" element={<Wiki />} />}
            {features.raw && <Route path="raw" element={<Raw />} />}
            {features.review && <Route path="review" element={<Review />} />}
            {features.ideas && <Route path="ideas" element={<Ideas />} />}
            {features.needsContext && <Route path="needs-context" element={<NeedsContext />} />}
            {features.changeLog && <Route path="change-log" element={<ChangeLog />} />}
            {assistantSurfaceEnabled() && <Route path="assistant" element={<Assistant />} />}
            {/* Disabled surfaces + unknown deep links fall back to Overview. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
