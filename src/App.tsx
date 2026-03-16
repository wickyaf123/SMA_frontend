import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/layout/AppLayout";
import { ChatLayout } from "./components/layout/ChatLayout";

// Import Views
import { Overview } from "./components/dashboard/Overview";
import { PipelineCanvas } from "./components/pipeline/PipelineCanvas";
import { Leads } from "./components/leads/Leads";
import { Campaigns } from "./components/campaigns/Campaigns";
import { Integrations } from "./components/integrations/Integrations";
import { Settings } from "./components/settings/Settings";

// Configure React Query with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Jerry Chat - default landing */}
            <Route path="/" element={<ChatLayout />} />
            <Route path="/chat" element={<ChatLayout />} />

            {/* Classic Dashboard */}
            <Route path="/classic" element={<AppLayout />}>
              <Route index element={<Navigate to="/classic/overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="pipeline" element={<PipelineCanvas />} />
              <Route path="leads" element={<Leads />} />
              <Route path="campaigns" element={<Campaigns onNavigateToSettings={() => {}} />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
