import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, ExternalLink, Edit, Trash2, ArrowLeft, Heart, MessageCircle, TrendingUp, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { AppStatusBadge } from '@/components/AppStatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { useMyApps, useMyStats, useDeleteApp } from '@/hooks/useMyApps';
import { toast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: apps, isLoading: appsLoading } = useMyApps();
  const { data: stats, isLoading: statsLoading } = useMyStats();
  const deleteMutation = useDeleteApp();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: '/min-sida' } });
    }
  }, [user, authLoading, navigate]);

  const handleDelete = async (appId: string, appTitle: string) => {
    try {
      await deleteMutation.mutateAsync(appId);
      toast({
        title: 'App borttagen',
        description: `"${appTitle}" har tagits bort`
      });
    } catch (error) {
      toast({
        title: 'Kunde inte ta bort appen',
        description: 'Något gick fel, försök igen',
        variant: 'destructive'
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="animate-pulse text-primary">Laddar...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Min sida
                </h1>
                <p className="text-sm text-muted-foreground">
                  Hantera dina appar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/profil/redigera">
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profil</span>
                </Button>
              </Link>
              <Link to="/submit">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Lägg till app</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.totalApps || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Appar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10">
                  <Heart className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.totalUpvotes || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Röster</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <MessageCircle className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.totalComments || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Kommentarer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.pendingApps || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Väntar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Apps List */}
        <Card>
          <CardHeader>
            <CardTitle>Mina appar</CardTitle>
          </CardHeader>
          <CardContent>
            {appsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-full max-w-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : apps?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Du har inte lagt till några appar ännu
                </p>
                <Link to="/submit">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Lägg till din första app
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {apps?.map(app => (
                  <div 
                    key={app.id} 
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    {app.image_url ? (
                      <img 
                        src={app.image_url} 
                        alt={app.title}
                        className="h-20 w-20 sm:h-16 sm:w-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-20 w-20 sm:h-16 sm:w-16 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">📱</span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{app.title}</h3>
                        <AppStatusBadge status={app.status} />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {app.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {app.upvotes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> {app.comments_count}
                        </span>
                        <div className="flex gap-1 flex-wrap">
                          {app.categories.slice(0, 3).map(cat => (
                            <Badge key={cat.id} variant="outline" className="text-xs py-0">
                              {cat.icon} {cat.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" asChild>
                        <a href={app.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/redigera/${app.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
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
                              onClick={() => handleDelete(app.id, app.title)}
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
      </main>
    </div>
  );
}
