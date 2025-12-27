import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Plus, Lightbulb, BookOpen, Sparkles, LogOut, Settings, ChevronLeft, ChevronRight, Shield, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMyApps } from '@/hooks/useMyApps';
import { useMyCreatedIdeas, useMyClaimedIdeas } from '@/hooks/useMyIdeas';
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
import logoImage from '@/assets/logo.png';

const navigation = [
  { title: 'Hem', url: '/', icon: Home },
  { title: 'Utforska appar', url: '/apps', icon: Compass },
  { title: 'App-idéer', url: '/ideer', icon: Lightbulb },
];

const resources = [
  { title: 'Tips & tricks', url: '/resurser/tips', icon: Lightbulb },
  { title: 'Lär dig vibe-coda', url: '/resurser/lara', icon: BookOpen },
  { title: 'Inspiration', url: '/resurser/inspiration', icon: Sparkles },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: apps, isLoading: appsLoading } = useMyApps();
  const { data: createdIdeas, isLoading: createdIdeasLoading } = useMyCreatedIdeas();
  const { data: claimedIdeas, isLoading: claimedIdeasLoading } = useMyClaimedIdeas();
  const { data: profile } = useMyProfile();
  const { data: isAdmin } = useIsAdmin();
  
  const myIdeas = [...(createdIdeas || []), ...(claimedIdeas || [])];
  const ideasLoading = createdIdeasLoading || claimedIdeasLoading;

  const isActive = (path: string) => location.pathname === path;

  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          {collapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 mx-auto"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Link to="/" className="flex items-center gap-3">
                <img src={logoImage} alt="Skolappar" className="w-8 h-8" />
                <span className="font-heading font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  skolappar
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-7 w-7 shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          )}
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
              <Link to="/min-sida/ny">
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
                    <Link to="/min-sida/ny">
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
                    <Link to="/min-sida/ny">
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

        {/* My Ideas */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Mina idéer</span>
            {!collapsed && (
              <Link to="/min-sida/ideer/ny">
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
                  <SidebarMenuButton asChild tooltip="Föreslå idé">
                    <Link to="/min-sida/ideer/ny">
                      <MessageSquarePlus className="h-4 w-4" />
                      <span>Föreslå idé</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {ideasLoading ? (
                <div className="space-y-2 px-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : myIdeas.length === 0 ? (
                <div className="px-2 py-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    {collapsed ? '' : 'Inga idéer än'}
                  </p>
                  {!collapsed && (
                    <Link to="/min-sida/ideer/ny">
                      <Button size="sm" variant="outline" className="w-full gap-2">
                        <MessageSquarePlus className="h-3 w-3" />
                        Föreslå idé
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                myIdeas.slice(0, 5).map((idea) => (
                  <SidebarMenuItem key={idea.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === `/ideer/${idea.id}`}
                      tooltip={idea.title}
                    >
                      <Link to={`/ideer/${idea.id}`}>
                        <span className={`h-2 w-2 rounded-full ${
                          idea.status === 'open' ? 'bg-green-500' :
                          idea.status === 'claimed' ? 'bg-yellow-500' :
                          'bg-cyan-500'
                        }`} />
                        <span className="truncate">{idea.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
              {myIdeas.length > 5 && !collapsed && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/ideer" className="text-muted-foreground">
                      <span>Visa alla ({myIdeas.length})</span>
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
                    asChild
                    isActive={location.pathname.startsWith(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-2'}`}>
          <Link to="/profil/redigera">
            <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {profile?.display_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.display_name || 'Användare'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
