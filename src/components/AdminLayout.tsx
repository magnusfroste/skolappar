import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ExternalLink, KeyRound, Loader2, LogOut, Shield } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { ADMIN_SECTIONS } from '@/lib/adminSections';
import { ApiError, setAdminKey } from '@/lib/api';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useBranding } from '@/hooks/useBranding';
import logoFallback from '@/assets/kotten-mark.svg';

function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const branding = useBranding();
  const logoImage = branding.brand_logo_url || logoFallback;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          {collapsed ? (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 mx-auto" aria-label="Visa meny">
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Link to="/" className="flex items-center gap-3">
                <img src={logoImage} alt={branding.brand_name} className="w-8 h-8" />
                <span className="font-heading font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {branding.brand_name}
                </span>
              </Link>
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-7 w-7 shrink-0" aria-label="Fäll ihop menyn">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ADMIN_SECTIONS.map((item) => {
                const active = location.pathname === '/admin' && (new URLSearchParams(location.search).get('tab') || 'pending') === item.tab;
                return (
                  <SidebarMenuItem key={item.tab}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={`/admin?tab=${item.tab}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Till sajten">
                  <Link to="/">
                    <ExternalLink className="h-4 w-4" />
                    <span>Till sajten</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <Button variant="ghost" className={collapsed ? 'h-8 w-8 p-0 mx-auto' : 'justify-start gap-2'} onClick={onLogout} title="Logga ut">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Logga ut</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function KeyForm({ onSubmit, wrong }: { onSubmit: (key: string) => void; wrong: boolean }) {
  const [key, setKey] = useState('');
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Admin</CardTitle>
          </div>
          <CardDescription>Ange admin-nyckeln. Den sparas bara i den här fliken tills du stänger den.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (key.trim()) onSubmit(key.trim());
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="admin-key">Admin-nyckel</Label>
              <Input id="admin-key" type="password" autoComplete="current-password" value={key} onChange={(e) => setKey(e.target.value)} autoFocus />
              {wrong && <p className="text-sm text-destructive" role="alert">Fel nyckel. Försök igen.</p>}
            </div>
            <Button type="submit" className="w-full gap-2" disabled={!key.trim()}>
              <KeyRound className="h-4 w-4" />
              Logga in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/** Everything under /admin: asks for the admin key, then shows the admin sidebar layout. */
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [version, setVersion] = useState(0);
  const [tried, setTried] = useState(false);
  const { data: ok, isLoading, error } = useIsAdmin(version);

  const login = (key: string) => {
    setAdminKey(key);
    setTried(true);
    setVersion((v) => v + 1);
  };
  const logout = () => {
    setAdminKey(null);
    setTried(false);
    queryClient.removeQueries();
    setVersion((v) => v + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    const notSet = error instanceof ApiError && error.status === 503;
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md p-6 text-center space-y-3">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground" />
          <p>{notSet ? 'Administrationen är avstängd: ADMIN_KEY är inte satt på servern.' : 'Kunde inte nå servern. Försök igen om en stund.'}</p>
          <Button variant="outline" onClick={() => setVersion((v) => v + 1)}>Försök igen</Button>
        </Card>
      </div>
    );
  }
  if (!ok) return <KeyForm onSubmit={login} wrong={tried} />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <AdminSidebar onLogout={logout} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border/50 bg-background/80 backdrop-blur-sm px-4 py-3 md:hidden">
            <SidebarTrigger className="h-9 w-9" />
            <span className="font-heading font-bold text-lg">Admin</span>
            <DarkModeToggle />
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
