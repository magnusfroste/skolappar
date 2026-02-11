import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ChevronUp, MessageCircle, Trash2, Send, Eye, Monitor, Tablet, Smartphone, Layers } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ShareButton } from '@/components/ShareButton';
import { RelatedApps } from '@/components/RelatedApps';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { SEO, createAppSchema } from '@/components/SEO';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { useAppDetails, useAppComments, useAddComment, useDeleteComment } from '@/hooks/useAppDetails';
import { useToggleUpvote, useUserUpvotes } from '@/hooks/useApps';
import { useTrackClick } from '@/hooks/useTrackClick';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const deviceConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  desktop: { icon: <Monitor className="h-4 w-4" />, label: 'Desktop' },
  tablet: { icon: <Tablet className="h-4 w-4" />, label: 'Platta' },
  mobile: { icon: <Smartphone className="h-4 w-4" />, label: 'Mobil' },
  'all-devices': { icon: <Layers className="h-4 w-4" />, label: 'Alla enheter' },
};

export default function AppDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');

  const { data: app, isLoading: appLoading } = useAppDetails(id);
  const { data: comments, isLoading: commentsLoading } = useAppComments(id);
  const { data: userUpvotes } = useUserUpvotes();
  const toggleUpvote = useToggleUpvote();
  const trackClick = useTrackClick();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  const hasUpvoted = userUpvotes?.includes(id || '');

  const handleUpvote = () => {
    if (!user) {
      toast.error('Du måste vara inloggad för att gilla');
      return;
    }
    if (id) toggleUpvote.mutate({ appId: id, hasUpvoted: !!hasUpvoted });
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) {
      toast.error('Du måste vara inloggad för att kommentera');
      return;
    }
    addComment.mutate(
      { appId: id!, content: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText('');
          toast.success('Kommentar tillagd');
        },
        onError: () => toast.error('Kunde inte lägga till kommentar'),
      }
    );
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment.mutate(
      { commentId, appId: id! },
      {
        onSuccess: () => toast.success('Kommentar borttagen'),
        onError: () => toast.error('Kunde inte ta bort kommentar'),
      }
    );
  };

  if (appLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Appen kunde inte hittas</p>
          <Button onClick={() => navigate('/apps')}>Tillbaka till appar</Button>
        </Card>
      </div>
    );
  }

  const config = useSiteConfig();
  const appSchema = createAppSchema({
    title: app.title,
    description: app.long_description || app.description,
    url: app.url,
    image: app.image_url || undefined,
    creator: app.profile?.display_name,
    datePublished: app.created_at,
  }, config);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEO 
        title={app.title}
        description={app.long_description || app.description}
        image={app.image_url || undefined}
        url={`/app/${app.id}`}
        type="product"
        jsonLd={appSchema}
      />
      
      {/* Navigation */}
      <PublicNav variant="solid" />

      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </Button>

        {/* Thumbnail */}
        <div className="aspect-video rounded-2xl overflow-hidden shadow-playful-lg bg-card">
          {app.image_url ? (
            <img src={app.image_url} alt={app.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-primary/10 to-secondary/10">
              📱
            </div>
          )}
        </div>

        {/* Title & actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold line-clamp-2">{app.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {app.profile && (
                <Link to={`/profil/${app.user_id}`} className="hover:text-foreground transition-colors">
                  {app.profile.display_name || 'Anonym'}
                </Link>
              )}
              <span>•</span>
              <span>{format(new Date(app.created_at), 'd MMM yyyy', { locale: sv })}</span>
            </div>
          </div>
          <Button 
            className="gap-2"
            onClick={() => {
              trackClick.mutate(app.id);
              window.open(app.url, '_blank', 'noopener,noreferrer');
            }}
          >
            Öppna
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        {/* Categories & Device support */}
        {app.categories.length > 0 && (
          <div className="space-y-3">
            {/* Regular categories */}
            <div className="flex flex-wrap gap-2">
              {app.categories
                .filter((cat: any) => cat.type !== 'device')
                .map((cat: any) => (
                  <Badge
                    key={cat.id}
                    variant="secondary"
                    className="text-sm px-3 py-1"
                    style={{
                      backgroundColor: `${cat.color}15`,
                      color: cat.color || undefined,
                    }}
                  >
                    {cat.icon} {cat.name}
                  </Badge>
                ))}
            </div>
            
            {/* Device badges */}
            {app.categories.some((cat: any) => cat.type === 'device') && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Fungerar på:</span>
                <div className="flex items-center gap-1.5">
                  {app.categories
                    .filter((cat: any) => cat.type === 'device')
                    .map((cat: any) => {
                      const config = deviceConfig[cat.slug] || deviceConfig[cat.name.toLowerCase()];
                      if (!config) return null;
                      return (
                        <Tooltip key={cat.id}>
                          <TooltipTrigger asChild>
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                              {config.icon}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{config.label}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <Card className="p-5 bg-card/80 backdrop-blur-sm">
          <p className="text-foreground whitespace-pre-wrap">
            {app.long_description || app.description}
          </p>
        </Card>

        {/* Actions row */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant={hasUpvoted ? 'default' : 'secondary'}
            size="sm"
            className="gap-2"
            onClick={handleUpvote}
          >
            <ChevronUp className="w-4 h-4" />
            <span className="font-bold">{app.upvotes_count}</span>
            <span>Gilla</span>
          </Button>
          <ShareButton appId={app.id} appTitle={app.title} />
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            {app.comments_count}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            {app.clicks_count || 0}
          </span>
        </div>

        {/* Comments section */}
        <section id="kommentarer" className="space-y-4 pt-4">
          <h2 className="font-heading text-xl font-bold">Kommentarer</h2>

          {/* Comment form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <Textarea
                placeholder="Skriv en kommentar..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <Button type="submit" size="sm" disabled={!commentText.trim() || addComment.isPending} className="gap-2">
                <Send className="w-4 h-4" />
                Skicka
              </Button>
            </form>
          ) : (
            <Card className="p-4 bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                <Link to="/auth" className="text-primary hover:underline">
                  Logga in
                </Link>{' '}
                för att skriva en kommentar
              </p>
            </Card>
          )}

          {/* Comments list */}
          {commentsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id} className="p-4 bg-card/80 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10">
                        {comment.profile?.display_name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium truncate">
                          {comment.profile?.display_name || 'Anonym'}
                        </span>
                        <span className="text-muted-foreground">
                          {format(new Date(comment.created_at), 'd MMM', { locale: sv })}
                        </span>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    {user?.id === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Inga kommentarer än. Bli först att kommentera!
            </p>
          )}
        </section>

        {/* Related Apps */}
        <RelatedApps 
          appId={app.id} 
          categoryIds={app.categories.filter((c: any) => c.type !== 'device').map((c: any) => c.id)} 
        />
      </div>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
