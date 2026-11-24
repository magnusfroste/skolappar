import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { DynamicFavicon } from "@/components/DynamicFavicon";
import { DynamicTheme } from "@/components/DynamicTheme";
import { DynamicFont } from "@/components/DynamicFont";

const Index = lazy(() => import("./pages/Index"));
const Apps = lazy(() => import("./pages/Apps"));
const Ideas = lazy(() => import("./pages/Ideas"));
const IdeaDetail = lazy(() => import("./pages/IdeaDetail"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminAppEdit = lazy(() => import("./pages/AdminAppEdit"));
const SuggestApp = lazy(() => import("./pages/SuggestApp"));
const NewIdea = lazy(() => import("./pages/NewIdea"));
const AppDetail = lazy(() => import("./pages/AppDetail"));
const Resources = lazy(() => import("./pages/Resources"));
const ResourceList = lazy(() => import("./pages/ResourceList"));
const ResourceDetail = lazy(() => import("./pages/ResourceDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StarterDemo = lazy(() => import("./pages/StarterDemo"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const TestYourApp = lazy(() => import("./pages/TestYourApp"));
const BuildGuide = lazy(() => import("./pages/BuildGuide"));
const SubjectApps = lazy(() => import("./pages/SubjectApps"));


const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
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
            <Route path="/apps" element={<Apps />} />
            <Route path="/tipsa" element={<SuggestApp />} />
            <Route path="/ideer" element={<Ideas />} />
            <Route path="/ideer/ny" element={<NewIdea />} />
            <Route path="/ideer/:id" element={<IdeaDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/app/:id" element={<AdminAppEdit />} />
            <Route path="/app/:id" element={<AppDetail />} />
            <Route path="/resurser" element={<Resources />} />
            <Route path="/resurser/:category" element={<ResourceList />} />
            <Route path="/resurser/:category/:slug" element={<ResourceDetail />} />
            <Route path="/startmall" element={<StarterDemo />} />
            <Route path="/villkor" element={<Terms />} />
            <Route path="/integritet" element={<Privacy />} />
            <Route path="/testa-din-app" element={<TestYourApp />} />
            <Route path="/bygg" element={<BuildGuide />} />
            <Route path="/appar/:subject" element={<SubjectApps />} />
            <Route path="/appar/:subject/:age" element={<SubjectApps />} />

            {/* Old account pages (there are no accounts any more) */}
            <Route path="/min-sida/ny" element={<Navigate to="/tipsa" replace />} />
            <Route path="/min-sida/ideer/ny" element={<Navigate to="/ideer/ny" replace />} />
            <Route path="/min-sida/*" element={<Navigate to="/" replace />} />
            <Route path="/auth" element={<Navigate to="/" replace />} />
            <Route path="/reset-password" element={<Navigate to="/" replace />} />
            <Route path="/profil/*" element={<Navigate to="/" replace />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
  </QueryClientProvider>
);

export default App;
