import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Plus, Lightbulb, BookOpen, Sparkles, LogOut, Settings, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMyApps } from '@/hooks/useMyApps';
import { useIsAdmin } from '@/hooks/useAdmin';
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyProfile } from '@/hooks/useProfile';

const navigation = [
  { title: 'Hem', url: '/', icon: Home },
  { title: 'Utforska appar', url: '/apps', icon: Compass },
];

const resources = [
  { title: 'Tips & tricks', url: '#', icon: Lightbulb, disabled: true },
  { title: 'Lär dig vibe-coda', url: '#', icon: BookOpen, disabled: true },
  { title: 'Inspiration', url: '#', icon: Sparkles, disabled: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: apps, isLoading: appsLoading } = useMyApps();
  const { data: profile } = useMyProfile();
  const { data: isAdmin } = useIsAdmin();

  const isActive = (path: string) => location.pathname === path;

  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm">
              S
            </div>
            {!collapsed && (
              <span className="font-heading font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                skolappar
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-7 w-7 shrink-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/admin')}
                    tooltip="Admin"
                  >
                    <Link to="/admin">
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* My Apps */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Mina appar</span>
            {!collapsed && (
              <Link to="/submit">
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Plus className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {collapsed && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Lägg till app">
                    <Link to="/submit">
                      <Plus className="h-4 w-4" />
                      <span>Lägg till</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {appsLoading ? (
                <div className="space-y-2 px-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : apps?.length === 0 ? (
                <div className="px-2 py-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    {collapsed ? '' : 'Inga appar än'}
                  </p>
                  {!collapsed && (
                    <Link to="/submit">
                      <Button size="sm" variant="outline" className="w-full gap-2">
                        <Plus className="h-3 w-3" />
                        Lägg till
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                apps?.slice(0, 5).map((app) => (
                  <SidebarMenuItem key={app.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === `/min-sida/app/${app.id}`}
                      tooltip={app.title}
                    >
                      <Link to={`/min-sida/app/${app.id}`}>
                        {app.image_url ? (
                          <img
                            src={app.image_url}
                            alt=""
                            className="h-4 w-4 rounded object-cover"
                          />
                        ) : (
                          <div className="h-4 w-4 rounded bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-[8px]">
                            📱
                          </div>
                        )}
                        <span className="truncate">{app.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
              {apps && apps.length > 5 && !collapsed && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/min-sida" className="text-muted-foreground">
                      <span>Visa alla ({apps.length})</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Resources */}
        <SidebarGroup>
          <SidebarGroupLabel>Resurser</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resources.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.disabled ? `${item.title} (kommer snart)` : item.title}
                    disabled={item.disabled}
                    className={item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    {item.disabled && !collapsed && (
                      <span className="ml-auto text-[10px] text-muted-foreground">Snart</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {profile?.display_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.display_name || 'Användare'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
          {!collapsed && (
            <div className="flex gap-1">
              <Link to="/profil/redigera">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
