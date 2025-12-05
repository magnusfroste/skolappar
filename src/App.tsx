import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Apps from "./pages/Apps";
import Submit from "./pages/Submit";
import Dashboard from "./pages/Dashboard";
import EditApp from "./pages/EditApp";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import AppDetail from "./pages/AppDetail";
import NotFound from "./pages/NotFound";

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
            <Route path="/submit" element={<Submit />} />
            <Route path="/min-sida" element={<Dashboard />} />
            <Route path="/redigera/:id" element={<EditApp />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profil/:id" element={<Profile />} />
            <Route path="/profil/redigera" element={<EditProfile />} />
            <Route path="/app/:id" element={<AppDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
