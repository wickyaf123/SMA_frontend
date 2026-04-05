import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import NotFound from "./pages/NotFound";
import JobDetailPage from "./pages/JobDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { ChatLayout } from "./components/layout/ChatLayout";

// Import Views
import { Overview } from "./components/dashboard/Overview";
import { PipelineCanvas } from "./components/pipeline/PipelineCanvas";
import { Leads } from "./components/leads/Leads";
import { Campaigns } from "./components/campaigns/Campaigns";
import { Integrations } from "./components/integrations/Integrations";
import { Settings } from "./components/settings/Settings";
import { HistoryLog } from "./components/history/HistoryLog";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Wrapper so we can call useNavigate() inside the Campaigns route element */
const CampaignsPage = () => {
  const navigate = useNavigate();
  return <Campaigns onNavigateToSettings={() => navigate('/classic/settings')} />;
};

const AppRoutes = () => (
  <Routes>
    {/* ── Public auth routes (no layout, no protection) ── */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    {/* ── Protected: Jerry Chat — default landing ── */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Navigate to="/chat" replace />
        </ProtectedRoute>
      }
    />
    <Route
      path="/chat/:conversationId?"
      element={
        <ProtectedRoute>
          <ChatLayout />
        </ProtectedRoute>
      }
    />

    {/* ── Protected: Job Detail ── */}
    <Route
      path="/jobs/:id"
      element={
        <ProtectedRoute>
          <JobDetailPage />
        </ProtectedRoute>
      }
    />

    {/* ── Protected: Classic Dashboard ── */}
    <Route
      path="/classic"
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Navigate to="/classic/overview" replace />} />
      <Route path="overview" element={<Overview />} />
      <Route path="pipeline" element={<PipelineCanvas />} />
      <Route path="leads" element={<Leads />} />
      <Route path="campaigns" element={<CampaignsPage />} />
      <Route path="integrations" element={<Integrations />} />
      <Route path="settings" element={<Settings />} />
      <Route path="history" element={<HistoryLog />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
