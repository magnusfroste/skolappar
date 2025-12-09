import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Apps from "./pages/Apps";
import Dashboard from "./pages/Dashboard";
import DashboardEdit from "./pages/DashboardEdit";
import DashboardCreate from "./pages/DashboardCreate";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import AppDetail from "./pages/AppDetail";
import Resources from "./pages/Resources";
import ResourceList from "./pages/ResourceList";
import ResourceDetail from "./pages/ResourceDetail";
import NotFound from "./pages/NotFound";
import StarterDemo from "./pages/StarterDemo";
import Terms from "./pages/Terms";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/apps" element={<Apps />} />
            <Route path="/min-sida" element={<Dashboard />} />
            <Route path="/min-sida/app/:id" element={<DashboardEdit />} />
            <Route path="/min-sida/ny" element={<DashboardCreate />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profil/:id" element={<Profile />} />
            <Route path="/profil/redigera" element={<EditProfile />} />
            <Route path="/app/:id" element={<AppDetail />} />
            <Route path="/resurser" element={<Resources />} />
            <Route path="/resurser/:category" element={<ResourceList />} />
            <Route path="/resurser/:category/:slug" element={<ResourceDetail />} />
            <Route path="/startmall" element={<StarterDemo />} />
            <Route path="/villkor" element={<Terms />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
