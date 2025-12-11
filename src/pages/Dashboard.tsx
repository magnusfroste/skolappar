import { Link } from 'react-router-dom';
import { Plus, ExternalLink, Edit, Trash2, Heart, MessageCircle, TrendingUp, Clock, Star, BarChart3, MousePointerClick, Share2, Lightbulb, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
import { NotificationBell } from '@/components/NotificationBell';
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout';
import { MilestoneBadge, getNextMilestone } from '@/components/MilestoneBadge';
import { IdeaStatusBadge } from '@/components/IdeaStatusBadge';
import { useMyApps, useMyStats, useDeleteApp } from '@/hooks/useMyApps';
import { useMyCreatedIdeas, useMyClaimedIdeas, useDeleteIdea } from '@/hooks/useMyIdeas';
import { toast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { data: apps, isLoading: appsLoading } = useMyApps();
  const { data: stats, isLoading: statsLoading } = useMyStats();
  const { data: createdIdeas, isLoading: createdIdeasLoading } = useMyCreatedIdeas();
  const { data: claimedIdeas, isLoading: claimedIdeasLoading } = useMyClaimedIdeas();
  const deleteMutation = useDeleteApp();
  const deleteIdeaMutation = useDeleteIdea();

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

  const handleDeleteIdea = async (ideaId: string, ideaTitle: string) => {
    try {
      await deleteIdeaMutation.mutateAsync(ideaId);
      toast({
        title: 'Idé borttagen',
        description: `"${ideaTitle}" har tagits bort`
      });
    } catch (error) {
      toast({
        title: 'Kunde inte ta bort idén',
        description: 'Något gick fel, försök igen',
        variant: 'destructive'
      });
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Min sida
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Hantera dina appar och se statistik
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <NotificationBell />
            </div>
            <Link to="/min-sida/ny">
              <Button className="gap-2 shadow-playful">
                <Plus className="h-4 w-4" />
                Lägg till app
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards with Milestones */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm shadow-playful">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.totalApps || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Appar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm shadow-playful">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose/10">
                  <Heart className="h-5 w-5 text-rose" />
                </div>
                <div className="flex-1">
                  {statsLoading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.totalUpvotes || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Röster</p>
                </div>
              </div>
              {!statsLoading && stats?.totalUpvotes ? (
                <MilestoneBadge count={stats.totalUpvotes} type="upvotes" />
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm shadow-playful">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-secondary/10">
                  <MessageCircle className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.totalComments || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Kommentarer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm shadow-playful">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/10">
                  <MousePointerClick className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  {statsLoading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.totalClicks || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Öppningar</p>
                </div>
              </div>
              {!statsLoading && stats?.totalClicks ? (
                <>
                  <MilestoneBadge count={stats.totalClicks} type="clicks" />
                  {getNextMilestone(stats.totalClicks) && (
                    <div className="space-y-1">
                      <Progress 
                        value={(stats.totalClicks / getNextMilestone(stats.totalClicks)!.threshold) * 100} 
                        className="h-1.5"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        {getNextMilestone(stats.totalClicks)!.remaining} till nästa nivå
                      </p>
                    </div>
                  )}
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="apps" className="space-y-6">
          <TabsList className="bg-card/80 backdrop-blur-sm flex-wrap h-auto gap-1">
            <TabsTrigger value="apps" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Mina appar
            </TabsTrigger>
            <TabsTrigger value="ideas" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Mina idéer
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Star className="h-4 w-4" />
              Favoriter
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistik
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apps">
            {appsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-40 w-full" />
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : apps?.length === 0 ? (
              <Card className="bg-card/80 backdrop-blur-sm">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📱</span>
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">
                    Inga appar än
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                    Dela din första pedagogiska app med andra föräldrar!
                  </p>
                  <Link to="/min-sida/ny">
                    <Button className="gap-2 shadow-playful">
                      <Plus className="h-4 w-4" />
                      Lägg till din första app
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {apps?.map((app) => (
                  <Card key={app.id} className="overflow-hidden bg-card/80 backdrop-blur-sm shadow-playful hover:shadow-playful-lg transition-shadow group">
                    <Link to={`/app/${app.id}`} className="block">
                      {app.image_url ? (
                        <div className="aspect-video overflow-hidden bg-muted">
                          <img
                            src={app.image_url}
                            alt={app.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                          <span className="text-4xl">📱</span>
                        </div>
                      )}
                    </Link>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Link to={`/app/${app.id}`}>
                          <h3 className="font-heading font-semibold truncate hover:text-primary transition-colors">
                            {app.title}
                          </h3>
                        </Link>
                        <AppStatusBadge status={app.status} />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {app.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {app.upvotes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> {app.comments_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" /> {app.clicks_count}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {app.categories.slice(0, 3).map((cat) => (
                          <Badge
                            key={cat.id}
                            variant="outline"
                            className="text-xs py-0 px-2"
                          >
                            {cat.icon} {cat.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <a href={app.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Öppna
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/min-sida/app/${app.id}`}>
                            <Edit className="h-3 w-3" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ideas">
            {createdIdeasLoading || claimedIdeasLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (createdIdeas?.length === 0 && claimedIdeas?.length === 0) ? (
              <Card className="bg-card/80 backdrop-blur-sm">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="h-8 w-8 text-amber-500" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">
                    Inga idéer än
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                    Föreslå en app-idé som andra föräldrar kan bygga!
                  </p>
                  <Link to="/min-sida/ideer/ny">
                    <Button className="gap-2 shadow-playful">
                      <MessageSquarePlus className="h-4 w-4" />
                      Föreslå din första idé
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Created Ideas */}
                {createdIdeas && createdIdeas.length > 0 && (
                  <div>
                    <h3 className="font-heading font-semibold mb-4">Idéer jag föreslagit</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {createdIdeas.map((idea) => (
                        <Card key={idea.id} className="bg-card/80 backdrop-blur-sm shadow-playful">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <Link to={`/ideer/${idea.id}`}>
                                <h4 className="font-heading font-semibold hover:text-primary transition-colors">
                                  {idea.title}
                                </h4>
                              </Link>
                              <IdeaStatusBadge status={idea.status as 'open' | 'claimed' | 'built'} />
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {idea.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" /> {idea.upvotes_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" /> {idea.comments_count}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" asChild className="flex-1">
                                <Link to={`/ideer/${idea.id}`}>Visa</Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-3 w-3" />
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
                                      onClick={() => handleDeleteIdea(idea.id, idea.title)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Ta bort
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Claimed Ideas */}
                {claimedIdeas && claimedIdeas.length > 0 && (
                  <div>
                    <h3 className="font-heading font-semibold mb-4">Idéer jag bygger på</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {claimedIdeas.map((idea) => (
                        <Card key={idea.id} className="bg-card/80 backdrop-blur-sm shadow-playful border-l-4 border-l-amber-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <Link to={`/ideer/${idea.id}`}>
                                <h4 className="font-heading font-semibold hover:text-primary transition-colors">
                                  {idea.title}
                                </h4>
                              </Link>
                              <IdeaStatusBadge status={idea.status as 'open' | 'claimed' | 'built'} />
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {idea.description}
                            </p>
                            {idea.profiles && (
                              <p className="text-xs text-muted-foreground mb-3">
                                Idé av {idea.profiles.display_name || 'Anonym'}
                              </p>
                            )}
                            <Button variant="outline" size="sm" asChild className="w-full">
                              <Link to={`/ideer/${idea.id}`}>Visa detaljer</Link>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-rose/10 flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-rose" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">
                  Favoriter kommer snart
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Här kommer du kunna se alla appar du har gillat.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">
                  Statistik kommer snart
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Här kommer du kunna se detaljerad statistik för dina appar.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
