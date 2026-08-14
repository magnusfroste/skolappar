import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { DynamicFavicon } from "@/components/DynamicFavicon";
import { DynamicTheme } from "@/components/DynamicTheme";
import { DynamicFont } from "@/components/DynamicFont";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Apps = lazy(() => import("./pages/Apps"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardEdit = lazy(() => import("./pages/DashboardEdit"));
const DashboardCreate = lazy(() => import("./pages/DashboardCreate"));
const DashboardCreateIdea = lazy(() => import("./pages/DashboardCreateIdea"));
const Ideas = lazy(() => import("./pages/Ideas"));
const IdeaDetail = lazy(() => import("./pages/IdeaDetail"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const AppDetail = lazy(() => import("./pages/AppDetail"));
const Resources = lazy(() => import("./pages/Resources"));
const ResourceList = lazy(() => import("./pages/ResourceList"));
const ResourceDetail = lazy(() => import("./pages/ResourceDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StarterDemo = lazy(() => import("./pages/StarterDemo"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const TestYourApp = lazy(() => import("./pages/TestYourApp"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <GoogleAnalytics />
        <DynamicFavicon />
        <DynamicTheme />
        <DynamicFont />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/apps" element={<Apps />} />
            <Route path="/min-sida" element={<Dashboard />} />
            <Route path="/min-sida/app/:id" element={<DashboardEdit />} />
            <Route path="/min-sida/ny" element={<DashboardCreate />} />
            <Route path="/min-sida/ideer/ny" element={<DashboardCreateIdea />} />
            <Route path="/ideer" element={<Ideas />} />
            <Route path="/ideer/:id" element={<IdeaDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profil/:id" element={<Profile />} />
            <Route path="/profil/redigera" element={<EditProfile />} />
            <Route path="/app/:id" element={<AppDetail />} />
            <Route path="/resurser" element={<Resources />} />
            <Route path="/resurser/:category" element={<ResourceList />} />
            <Route path="/resurser/:category/:slug" element={<ResourceDetail />} />
            <Route path="/startmall" element={<StarterDemo />} />
            <Route path="/villkor" element={<Terms />} />
            <Route path="/integritet" element={<Privacy />} />
            <Route path="/testa-din-app" element={<TestYourApp />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
