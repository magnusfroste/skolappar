import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Star, Clock, ExternalLink, Trash2, Plus, Edit2, Shield, Settings, FileText, Eye, EyeOff, Lightbulb, MessageSquare, ThumbsUp, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AppStatusBadge } from '@/components/AppStatusBadge';
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout';
import {
  useIsAdmin,
  usePendingApps,
  useAllApps,
  useUpdateAppStatus,
  useDeleteAppAdmin,
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useAdminResources,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  useAdminIdeas,
  useAdminIdeasStats,
  useUpdateIdeaStatus,
  useDeleteIdeaAdmin
} from '@/hooks/useAdmin';
import { IdeaStatusBadge } from '@/components/IdeaStatusBadge';
import { useSetting, useUpdateSetting } from '@/hooks/useSettings';
import { SeoSettingsPanel } from '@/components/SeoSettingsPanel';
import { BrandingSettingsPanel } from '@/components/BrandingSettingsPanel';
import { ThemeSettingsPanel } from '@/components/ThemeSettingsPanel';
import { FontSettingsPanel } from '@/components/FontSettingsPanel';
import { toast } from '@/hooks/use-toast';

export default function Admin() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: pendingApps, isLoading: pendingLoading } = usePendingApps();
  const { data: allApps, isLoading: allAppsLoading } = useAllApps();
  const { data: categories, isLoading: categoriesLoading } = useAdminCategories();
  const { data: resources, isLoading: resourcesLoading } = useAdminResources();
  const { data: ideas, isLoading: ideasLoading } = useAdminIdeas();
  const { data: ideasStats } = useAdminIdeasStats();

  const updateStatus = useUpdateAppStatus();
  const deleteApp = useDeleteAppAdmin();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();
  const updateIdeaStatus = useUpdateIdeaStatus();
  const deleteIdea = useDeleteIdeaAdmin();
  
  const { data: showFilters } = useSetting('show_filters');
  const { data: showTopApps } = useSetting('show_top_apps');
  const { data: showRecentApps } = useSetting('show_recent_apps');
  const { data: showTopIdeas } = useSetting('show_top_ideas');
  const { data: gaId } = useSetting('google_analytics_id');
  const updateSetting = useUpdateSetting();
  const [gaInput, setGaInput] = useState('');

  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    type: 'subject',
    icon: '',
    sort_order: 0
  });
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Resource state
  const [newResource, setNewResource] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'tips',
    icon: '',
    sort_order: 0,
    is_published: true
  });
  const [editingResource, setEditingResource] = useState<any>(null);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);

  // Delist dialog state
  const [delistDialogOpen, setDelistDialogOpen] = useState(false);
  const [delistingAppId, setDelistingAppId] = useState<string | null>(null);
  const [delistReason, setDelistReason] = useState('');

  const handleStatusChange = async (appId: string, status: 'approved' | 'rejected' | 'featured' | 'pending' | 'delisted', reason?: string) => {
    // If changing to delisted, open dialog first
    if (status === 'delisted' && !reason) {
      setDelistingAppId(appId);
      setDelistReason('');
      setDelistDialogOpen(true);
      return;
    }

    try {
      await updateStatus.mutateAsync({ appId, status, delistReason: reason });
      const statusLabels: Record<string, string> = {
        approved: 'godkänd',
        rejected: 'avvisad', 
        featured: 'utvald',
        pending: 'väntande',
        delisted: 'avlistad'
      };
      toast({
        title: 'Status uppdaterad',
        description: `Appen har markerats som ${statusLabels[status]}`
      });
    } catch (error) {
      toast({
        title: 'Kunde inte uppdatera status',
        variant: 'destructive'
      });
    }
  };

  const handleConfirmDelist = async () => {
    if (!delistingAppId) return;
    await handleStatusChange(delistingAppId, 'delisted', delistReason);
    setDelistDialogOpen(false);
    setDelistingAppId(null);
    setDelistReason('');
  };

  const handleDeleteApp = async (appId: string) => {
    try {
      await deleteApp.mutateAsync(appId);
      toast({ title: 'App borttagen' });
    } catch (error) {
      toast({ title: 'Kunde inte ta bort appen', variant: 'destructive' });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.slug) {
      toast({ title: 'Fyll i namn och slug', variant: 'destructive' });
      return;
    }
    try {
      await createCategory.mutateAsync(newCategory);
      toast({ title: 'Kategori skapad!' });
      setNewCategory({ name: '', slug: '', type: 'subject', icon: '', sort_order: 0 });
      setCategoryDialogOpen(false);
    } catch (error) {
      toast({ title: 'Kunde inte skapa kategorin', variant: 'destructive' });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    try {
      await updateCategory.mutateAsync(editingCategory);
      toast({ title: 'Kategori uppdaterad!' });
      setEditingCategory(null);
    } catch (error) {
      toast({ title: 'Kunde inte uppdatera kategorin', variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast({ title: 'Kategori borttagen!' });
    } catch (error) {
      toast({ title: 'Kunde inte ta bort kategorin', variant: 'destructive' });
    }
  };

  // Resource handlers
  const handleCreateResource = async () => {
    if (!newResource.title || !newResource.slug || !newResource.content) {
      toast({ title: 'Fyll i titel, slug och innehåll', variant: 'destructive' });
      return;
    }
    try {
      await createResource.mutateAsync(newResource);
      toast({ title: 'Resurs skapad!' });
      setNewResource({ title: '', slug: '', excerpt: '', content: '', category: 'tips', icon: '', sort_order: 0, is_published: true });
      setResourceDialogOpen(false);
    } catch (error) {
      toast({ title: 'Kunde inte skapa resursen', variant: 'destructive' });
    }
  };

  const handleUpdateResource = async () => {
    if (!editingResource) return;
    try {
      await updateResource.mutateAsync(editingResource);
      toast({ title: 'Resurs uppdaterad!' });
      setEditingResource(null);
    } catch (error) {
      toast({ title: 'Kunde inte uppdatera resursen', variant: 'destructive' });
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      await deleteResource.mutateAsync(id);
      toast({ title: 'Resurs borttagen!' });
    } catch (error) {
      toast({ title: 'Kunde inte ta bort resursen', variant: 'destructive' });
    }
  };

  const handleToggleResourcePublished = async (resource: any) => {
    try {
      await updateResource.mutateAsync({ id: resource.id, is_published: !resource.is_published });
      toast({ title: resource.is_published ? 'Resurs avpublicerad' : 'Resurs publicerad' });
    } catch (error) {
      toast({ title: 'Kunde inte uppdatera resursen', variant: 'destructive' });
    }
  };

  const handleIdeaStatusChange = async (ideaId: string, status: 'open' | 'claimed' | 'built') => {
    try {
      await updateIdeaStatus.mutateAsync({ ideaId, status });
      toast({
        title: 'Status uppdaterad',
        description: `Idén har markerats som ${status === 'open' ? 'öppen' : status === 'claimed' ? 'claimed' : 'byggd'}`
      });
    } catch (error) {
      toast({ title: 'Kunde inte uppdatera status', variant: 'destructive' });
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    try {
      await deleteIdea.mutateAsync(ideaId);
      toast({ title: 'Idé borttagen' });
    } catch (error) {
      toast({ title: 'Kunde inte ta bort idén', variant: 'destructive' });
    }
  };

  if (adminLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-primary">Laddar...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AuthenticatedLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Du har inte behörighet att se denna sida</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const subjectCategories = categories?.filter(c => c.type === 'subject') || [];
  const ageCategories = categories?.filter(c => c.type === 'age') || [];
  const typeCategories = categories?.filter(c => c.type === 'type') || [];

  return (
    <AuthenticatedLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              Hantera appar och kategorier
            </p>
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full max-w-4xl grid-cols-7">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Väntande</span> ({pendingApps?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="all">Alla appar</TabsTrigger>
            <TabsTrigger value="ideas" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Idéer</span>
            </TabsTrigger>
            <TabsTrigger value="categories">Kategorier</TabsTrigger>
            <TabsTrigger value="resources" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Resurser</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-2">
              🔍
              <span className="hidden sm:inline">SEO</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Inst.</span>
            </TabsTrigger>
          </TabsList>

          {/* Pending Apps Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Appar som väntar på granskning</CardTitle>
                <CardDescription>
                  Granska och godkänn eller avvisa inskickade appar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : pendingApps?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Inga väntande appar just nu!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApps?.map((app: any) => (
                      <div key={app.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start gap-4">
                          {app.image_url ? (
                            <img src={app.image_url} alt={app.title} className="h-20 w-20 rounded-lg object-cover" />
                          ) : (
                            <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl">
                              📱
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{app.title}</h3>
                              <AppStatusBadge status={app.status} />
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{app.description}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>Av: {app.profile?.display_name || 'Okänd'}</span>
                              <span>•</span>
                              <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                Besök
                              </a>
                            </div>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {app.categories?.slice(0, 5).map((cat: any) => (
                                <Badge key={cat.id} variant="outline" className="text-xs">
                                  {cat.icon} {cat.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(app.id, 'rejected')}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Avvisa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(app.id, 'featured')}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Utvald
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(app.id, 'approved')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Godkänn
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Apps Tab */}
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Alla appar</CardTitle>
                <CardDescription>
                  Översikt över alla appar i systemet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allAppsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allApps?.map((app: any) => (
                      <div key={app.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        {app.image_url ? (
                          <img src={app.image_url} alt={app.title} className="h-12 w-12 rounded-lg object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            📱
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{app.title}</span>
                            <AppStatusBadge status={app.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">{app.profile?.display_name || 'Okänd'}</p>
                          {app.status === 'delisted' && app.delist_reason && (
                            <p className="text-xs text-slate-500 mt-1 italic">📝 {app.delist_reason}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Select
                            value={app.status}
                            onValueChange={(value) => handleStatusChange(app.id, value as any)}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Väntande</SelectItem>
                              <SelectItem value="approved">Godkänd</SelectItem>
                              <SelectItem value="featured">Utvald</SelectItem>
                              <SelectItem value="rejected">Avvisad</SelectItem>
                              <SelectItem value="delisted">Avlistad</SelectItem>
                            </SelectContent>
                          </Select>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ta bort app?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Är du säker på att du vill ta bort "{app.title}"? Detta går inte att ångra.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteApp(app.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Ta bort
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ideas Tab */}
          <TabsContent value="ideas">
            <div className="space-y-6">
              {/* Ideas Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Lightbulb className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{ideasStats?.total || 0}</p>
                        <p className="text-xs text-muted-foreground">Totalt idéer</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <ThumbsUp className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{ideasStats?.totalUpvotes || 0}</p>
                        <p className="text-xs text-muted-foreground">Totalt röster</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{ideasStats?.totalComments || 0}</p>
                        <p className="text-xs text-muted-foreground">Kommentarer</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{ideasStats?.conversionRate || 0}%</p>
                        <p className="text-xs text-muted-foreground">Byggda</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Statusöversikt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-green-500"></span>
                      <span className="text-sm">Öppna: {ideasStats?.open || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                      <span className="text-sm">Claimed: {ideasStats?.claimed || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-cyan-500"></span>
                      <span className="text-sm">Byggda: {ideasStats?.built || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ideas List */}
              <Card>
                <CardHeader>
                  <CardTitle>Alla idéer</CardTitle>
                  <CardDescription>Hantera och moderera app-önskemål</CardDescription>
                </CardHeader>
                <CardContent>
                  {ideasLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : ideas?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Inga idéer ännu</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ideas?.map((idea: any) => (
                        <div key={idea.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link to={`/ideer/${idea.id}`} className="font-medium truncate hover:underline">
                                {idea.title}
                              </Link>
                              <IdeaStatusBadge status={idea.status} />
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>Av: {idea.profile?.display_name || 'Okänd'}</span>
                              {idea.claimer_profile && (
                                <>
                                  <span>•</span>
                                  <span>Claimed av: {idea.claimer_profile.display_name}</span>
                                </>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {idea.upvotes_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {idea.comments_count || 0}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Select
                              value={idea.status}
                              onValueChange={(value) => handleIdeaStatusChange(idea.id, value as any)}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Öppen</SelectItem>
                                <SelectItem value="claimed">Claimed</SelectItem>
                                <SelectItem value="built">Byggd</SelectItem>
                              </SelectContent>
                            </Select>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ta bort idé?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Är du säker på att du vill ta bort "{idea.title}"? Detta går inte att ångra.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteIdea(idea.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Ta bort
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Kategorier</CardTitle>
                  <CardDescription>Hantera ämnen, åldrar och apptyper</CardDescription>
                </div>
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Ny kategori
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-describedby={undefined}>
                    <DialogHeader>
                      <DialogTitle>Skapa ny kategori</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Namn</Label>
                        <Input
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          placeholder="t.ex. Matematik"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Slug</Label>
                        <Input
                          value={newCategory.slug}
                          onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                          placeholder="t.ex. matematik"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Typ</Label>
                        <Select
                          value={newCategory.type}
                          onValueChange={(value) => setNewCategory({ ...newCategory, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="subject">Ämne</SelectItem>
                            <SelectItem value="age">Ålder</SelectItem>
                            <SelectItem value="type">Apptyp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Ikon (emoji)</Label>
                        <Input
                          value={newCategory.icon}
                          onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                          placeholder="t.ex. 🔢"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sorteringsordning</Label>
                        <Input
                          type="number"
                          value={newCategory.sort_order}
                          onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Avbryt</Button>
                      <Button onClick={handleCreateCategory}>Skapa</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-6">
                {categoriesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Subject Categories */}
                    <div>
                      <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Ämnen</h3>
                      <div className="grid gap-2">
                        {subjectCategories.map((cat) => (
                          <CategoryRow
                            key={cat.id}
                            category={cat}
                            onEdit={() => setEditingCategory(cat)}
                            onDelete={() => handleDeleteCategory(cat.id)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Age Categories */}
                    <div>
                      <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Åldrar</h3>
                      <div className="grid gap-2">
                        {ageCategories.map((cat) => (
                          <CategoryRow
                            key={cat.id}
                            category={cat}
                            onEdit={() => setEditingCategory(cat)}
                            onDelete={() => handleDeleteCategory(cat.id)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Type Categories */}
                    <div>
                      <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Apptyper</h3>
                      <div className="grid gap-2">
                        {typeCategories.map((cat) => (
                          <CategoryRow
                            key={cat.id}
                            category={cat}
                            onEdit={() => setEditingCategory(cat)}
                            onDelete={() => handleDeleteCategory(cat.id)}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Edit Category Dialog */}
                <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                  <DialogContent aria-describedby={undefined}>
                    <DialogHeader>
                      <DialogTitle>Redigera kategori</DialogTitle>
                    </DialogHeader>
                    {editingCategory && (
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Namn</Label>
                          <Input
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Slug</Label>
                          <Input
                            value={editingCategory.slug}
                            onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Typ</Label>
                          <Select
                            value={editingCategory.type}
                            onValueChange={(value) => setEditingCategory({ ...editingCategory, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="subject">Ämne</SelectItem>
                              <SelectItem value="age">Ålder</SelectItem>
                              <SelectItem value="type">Apptyp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Ikon (emoji)</Label>
                          <Input
                            value={editingCategory.icon || ''}
                            onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Sorteringsordning</Label>
                          <Input
                            type="number"
                            value={editingCategory.sort_order || 0}
                            onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditingCategory(null)}>Avbryt</Button>
                      <Button onClick={handleUpdateCategory}>Spara</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Resurser</CardTitle>
                  <CardDescription>Hantera artiklar för Tips, Lär dig och Inspiration</CardDescription>
                </div>
                <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Ny resurs
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
                    <DialogHeader>
                      <DialogTitle>Skapa ny resurs</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Titel *</Label>
                          <Input
                            value={newResource.title}
                            onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                            placeholder="t.ex. Så skapar du en app"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Slug *</Label>
                          <Input
                            value={newResource.slug}
                            onChange={(e) => setNewResource({ ...newResource, slug: e.target.value })}
                            placeholder="t.ex. skapa-en-app"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Sammanfattning</Label>
                        <Input
                          value={newResource.excerpt}
                          onChange={(e) => setNewResource({ ...newResource, excerpt: e.target.value })}
                          placeholder="Kort beskrivning..."
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Kategori</Label>
                          <Select
                            value={newResource.category}
                            onValueChange={(value) => setNewResource({ ...newResource, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tips">Tips & tricks</SelectItem>
                              <SelectItem value="learn">Lär dig vibe-coda</SelectItem>
                              <SelectItem value="inspiration">Inspiration</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Ikon</Label>
                          <Input
                            value={newResource.icon}
                            onChange={(e) => setNewResource({ ...newResource, icon: e.target.value })}
                            placeholder="t.ex. Lightbulb"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Sortering</Label>
                          <Input
                            type="number"
                            value={newResource.sort_order}
                            onChange={(e) => setNewResource({ ...newResource, sort_order: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Innehåll (Markdown) *</Label>
                        <MarkdownEditor
                          value={newResource.content}
                          onChange={(value) => setNewResource({ ...newResource, content: value })}
                          minHeight="250px"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newResource.is_published}
                          onCheckedChange={(checked) => setNewResource({ ...newResource, is_published: checked })}
                        />
                        <Label>Publicerad</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setResourceDialogOpen(false)}>Avbryt</Button>
                      <Button onClick={handleCreateResource}>Skapa</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-6">
                {resourcesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Tips resources */}
                    <div>
                      <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Tips & tricks</h3>
                      <div className="grid gap-2">
                        {resources?.filter(r => r.category === 'tips').map((resource) => (
                          <ResourceRow
                            key={resource.id}
                            resource={resource}
                            onEdit={() => setEditingResource(resource)}
                            onDelete={() => handleDeleteResource(resource.id)}
                            onTogglePublished={() => handleToggleResourcePublished(resource)}
                          />
                        ))}
                        {resources?.filter(r => r.category === 'tips').length === 0 && (
                          <p className="text-sm text-muted-foreground py-2">Inga resurser</p>
                        )}
                      </div>
                    </div>

                    {/* Learn resources */}
                    <div>
                      <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Lär dig vibe-coda</h3>
                      <div className="grid gap-2">
                        {resources?.filter(r => r.category === 'learn').map((resource) => (
                          <ResourceRow
                            key={resource.id}
                            resource={resource}
                            onEdit={() => setEditingResource(resource)}
                            onDelete={() => handleDeleteResource(resource.id)}
                            onTogglePublished={() => handleToggleResourcePublished(resource)}
                          />
                        ))}
                        {resources?.filter(r => r.category === 'learn').length === 0 && (
                          <p className="text-sm text-muted-foreground py-2">Inga resurser</p>
                        )}
                      </div>
                    </div>

                    {/* Inspiration resources */}
                    <div>
                      <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Inspiration</h3>
                      <div className="grid gap-2">
                        {resources?.filter(r => r.category === 'inspiration').map((resource) => (
                          <ResourceRow
                            key={resource.id}
                            resource={resource}
                            onEdit={() => setEditingResource(resource)}
                            onDelete={() => handleDeleteResource(resource.id)}
                            onTogglePublished={() => handleToggleResourcePublished(resource)}
                          />
                        ))}
                        {resources?.filter(r => r.category === 'inspiration').length === 0 && (
                          <p className="text-sm text-muted-foreground py-2">Inga resurser</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Edit Resource Dialog */}
                <Dialog open={!!editingResource} onOpenChange={(open) => !open && setEditingResource(null)}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
                    <DialogHeader>
                      <DialogTitle>Redigera resurs</DialogTitle>
                    </DialogHeader>
                    {editingResource && (
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Titel</Label>
                            <Input
                              value={editingResource.title}
                              onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input
                              value={editingResource.slug}
                              onChange={(e) => setEditingResource({ ...editingResource, slug: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Sammanfattning</Label>
                          <Input
                            value={editingResource.excerpt || ''}
                            onChange={(e) => setEditingResource({ ...editingResource, excerpt: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Kategori</Label>
                            <Select
                              value={editingResource.category}
                              onValueChange={(value) => setEditingResource({ ...editingResource, category: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tips">Tips & tricks</SelectItem>
                                <SelectItem value="learn">Lär dig vibe-coda</SelectItem>
                                <SelectItem value="inspiration">Inspiration</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Ikon</Label>
                            <Input
                              value={editingResource.icon || ''}
                              onChange={(e) => setEditingResource({ ...editingResource, icon: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Sortering</Label>
                            <Input
                              type="number"
                              value={editingResource.sort_order || 0}
                              onChange={(e) => setEditingResource({ ...editingResource, sort_order: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Innehåll (Markdown)</Label>
                          <MarkdownEditor
                            value={editingResource.content}
                            onChange={(value) => setEditingResource({ ...editingResource, content: value })}
                            minHeight="250px"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={editingResource.is_published}
                            onCheckedChange={(checked) => setEditingResource({ ...editingResource, is_published: checked })}
                          />
                          <Label>Publicerad</Label>
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditingResource(null)}>Avbryt</Button>
                      <Button onClick={handleUpdateResource}>Spara</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO/AEO Tab */}
          <TabsContent value="seo">
            <div className="space-y-6">
              <BrandingSettingsPanel />
              <ThemeSettingsPanel />
              <FontSettingsPanel />
              <SeoSettingsPanel />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Inställningar</CardTitle>
                <CardDescription>Justera hur appen visas för användare</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <Label htmlFor="show-filters" className="text-base font-medium">Visa filter</Label>
                    <p className="text-sm text-muted-foreground">
                      När avaktiverad visas apparna i en enkel lista utan filtreringsmöjligheter
                    </p>
                  </div>
                  <Switch
                    id="show-filters"
                    checked={showFilters === true}
                    onCheckedChange={(checked) => {
                      updateSetting.mutate({ key: 'show_filters', value: checked });
                      toast({ title: checked ? 'Filter aktiverade' : 'Filter avaktiverade' });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <Label htmlFor="show-top-apps" className="text-base font-medium">Visa "Topp appar denna vecka"</Label>
                    <p className="text-sm text-muted-foreground">
                      Visar de mest populära apparna på startsidan
                    </p>
                  </div>
                  <Switch
                    id="show-top-apps"
                    checked={showTopApps === true}
                    onCheckedChange={(checked) => {
                      updateSetting.mutate({ key: 'show_top_apps', value: checked });
                      toast({ title: checked ? 'Top-appar aktiverade' : 'Top-appar avaktiverade' });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <Label htmlFor="show-recent-apps" className="text-base font-medium">Visa "Nyligen tillagda"</Label>
                    <p className="text-sm text-muted-foreground">
                      Visar de senaste apparna på startsidan
                    </p>
                  </div>
                  <Switch
                    id="show-recent-apps"
                    checked={showRecentApps === true}
                    onCheckedChange={(checked) => {
                      updateSetting.mutate({ key: 'show_recent_apps', value: checked });
                      toast({ title: checked ? 'Nyligen tillagda aktiverade' : 'Nyligen tillagda avaktiverade' });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <Label htmlFor="show-top-ideas" className="text-base font-medium">Visa "Populära app-idéer"</Label>
                    <p className="text-sm text-muted-foreground">
                      Visar de mest efterfrågade idéerna på startsidan
                    </p>
                  </div>
                  <Switch
                    id="show-top-ideas"
                    checked={showTopIdeas === true}
                    onCheckedChange={(checked) => {
                      updateSetting.mutate({ key: 'show_top_ideas', value: checked });
                      toast({ title: checked ? 'Top-idéer aktiverade' : 'Top-idéer avaktiverade' });
                    }}
                  />
                </div>

                <div className="p-4 rounded-lg border space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="ga-id" className="text-base font-medium">Google Analytics ID</Label>
                    <p className="text-sm text-muted-foreground">
                      Ange ditt GA4 mät-ID (t.ex. G-XXXXXXXXXX)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="ga-id"
                      placeholder="G-XXXXXXXXXX"
                      value={gaInput || (gaId as string) || ''}
                      onChange={(e) => setGaInput(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        updateSetting.mutate({ key: 'google_analytics_id', value: gaInput });
                        toast({ title: gaInput ? 'Google Analytics aktiverat' : 'Google Analytics borttaget' });
                      }}
                    >
                      Spara
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border opacity-60">
                  <div className="space-y-1">
                    <Label htmlFor="google-login" className="text-base font-medium">Google-inloggning</Label>
                    <p className="text-sm text-muted-foreground">
                      Tillåt inloggning via Google (kommer snart)
                    </p>
                  </div>
                  <Switch
                    id="google-login"
                    checked={false}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delist Reason Dialog */}
        <Dialog open={delistDialogOpen} onOpenChange={setDelistDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Avlista app</DialogTitle>
              <DialogDescription>
                Ange en anledning till varför appen avlistas. Detta syns för admin och kan användas för uppföljning.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="delist-reason">Anledning</Label>
                <Input
                  id="delist-reason"
                  placeholder="T.ex. Appen fungerar inte längre..."
                  value={delistReason}
                  onChange={(e) => setDelistReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDelistDialogOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleConfirmDelist}>
                Avlista
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}

function CategoryRow({ category, onEdit, onDelete }: { category: any; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-xl">{category.icon || '📁'}</span>
        <div>
          <p className="font-medium">{category.name}</p>
          <p className="text-xs text-muted-foreground">{category.slug}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-xs">#{category.sort_order}</Badge>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ta bort kategori?</AlertDialogTitle>
              <AlertDialogDescription>
                Är du säker på att du vill ta bort "{category.name}"? Appar med denna kategori kommer förlora kopplingen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Ta bort
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function ResourceRow({ 
  resource, 
  onEdit, 
  onDelete, 
  onTogglePublished 
}: { 
  resource: any; 
  onEdit: () => void; 
  onDelete: () => void;
  onTogglePublished: () => void;
}) {
  const categoryLabels: Record<string, string> = {
    tips: 'Tips',
    learn: 'Lär dig',
    inspiration: 'Inspiration'
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{resource.title}</p>
            {!resource.is_published && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <EyeOff className="h-3 w-3 mr-1" />
                Utkast
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{resource.slug}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-xs">{categoryLabels[resource.category]}</Badge>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={onTogglePublished}
          title={resource.is_published ? 'Avpublicera' : 'Publicera'}
        >
          {resource.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ta bort resurs?</AlertDialogTitle>
              <AlertDialogDescription>
                Är du säker på att du vill ta bort "{resource.title}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Ta bort
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
