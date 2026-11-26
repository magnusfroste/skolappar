import { AppThumbnail } from '@/components/AppThumbnail';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, ArrowLeft, ExternalLink, ChevronUp, Eye, Monitor, Tablet, Smartphone, Layers, Play, Flag } from 'lucide-react';
import { AppPlayer } from '@/components/AppPlayer';
import { useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NeedsInternet } from '@/components/NeedsInternet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ShareButton } from '@/components/ShareButton';
import { RelatedApps } from '@/components/RelatedApps';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { SEO, createAppSchema } from '@/components/SEO';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { useAppDetails } from '@/hooks/useAppDetails';
import { useToggleUpvote, useUserUpvotes } from '@/hooks/useApps';
import { useTrackClick } from '@/hooks/useTrackClick';

const deviceConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  desktop: { icon: <Monitor className="h-4 w-4" />, label: 'Desktop' },
  tablet: { icon: <Tablet className="h-4 w-4" />, label: 'Platta' },
  mobile: { icon: <Smartphone className="h-4 w-4" />, label: 'Mobil' },
  'all-devices': { icon: <Layers className="h-4 w-4" />, label: 'Alla enheter' },
};

export default function AppDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);
  const config = useSiteConfig();

  const { data: app, isLoading: appLoading } = useAppDetails(id);
  const { data: userUpvotes } = useUserUpvotes();
  const toggleUpvote = useToggleUpvote();
  const trackClick = useTrackClick();

  const hasUpvoted = userUpvotes?.includes(id || '');

  const handleUpvote = () => {
    if (id) toggleUpvote.mutate({ appId: id, hasUpvoted: !!hasUpvoted });
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

  const appSchema = createAppSchema({
    title: app.title,
    description: app.long_description || app.description,
    url: app.url,
    pageUrl: `/app/${app.id}`,
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
      
      {playing && <AppPlayer url={app.url} title={app.title} kotten={app.kotten} onClose={() => setPlaying(false)} />}

      {/* Navigation */}
      <PublicNav variant="solid" />

      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </Button>

        {/* Thumbnail + title side by side */}
        <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
          <button
            type="button"
            aria-label={`Starta ${app.title}`}
            onClick={() => {
              trackClick.mutate(app.id);
              setPlaying(true);
            }}
            className="w-full sm:w-64 shrink-0 aspect-[4/3] rounded-2xl overflow-hidden shadow-playful-lg bg-card"
          >
            <AppThumbnail title={app.title} imageUrl={app.image_url || undefined} appUrl={app.url} categories={app.categories} className="w-full h-full" />
          </button>
          <div className="min-w-0 flex-1 space-y-4">
        {/* Title & actions */}
        <div className="flex flex-col gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold line-clamp-2">{app.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {app.profile?.display_name && (
                <>
                  <span>{app.profile.display_name}</span>
                  <span>•</span>
                </>
              )}
              <span>{format(new Date(app.created_at), 'd MMM yyyy', { locale: sv })}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="lg"
              className="h-12 gap-2 rounded-full"
              onClick={() => {
                trackClick.mutate(app.id);
                setPlaying(true);
              }}
            >
              <Play className="w-4 h-4" />
              Spela
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full"
              aria-label="Öppna i ny flik"
              onClick={() => {
                trackClick.mutate(app.id);
                window.open(app.url, '_blank', 'noopener,noreferrer');
              }}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

          </div>
        </div>

        {/* Categories & Device support */}
        {app.curriculum && app.curriculum.length > 0 && (
          <section className="mb-6 rounded-xl border bg-card p-4" aria-labelledby="lgr22">
            <h2 id="lgr22" className="font-heading font-bold text-base mb-1">Tränar enligt läroplanen (Lgr22)</h2>
            <ul className="space-y-2">
              {app.curriculum.map((p) => (
                <li key={p.id} className="text-sm">
                  <Link to={`/apps?lgr=${encodeURIComponent(p.area_id)}`} className="font-medium text-primary hover:underline">
                    {p.subject_name}, årskurs {p.stage.replace('-', '–')} · {p.area}
                  </Link>
                  <p className="text-muted-foreground">{p.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Centralt innehåll ur grundskolans kursplaner. Källa: Skolverket.</p>
          </section>
        )}
        {app.guide_ok && (
          <Link
            to="/bygg"
            title="Appens adress har kontrollerats mot guiden Så bygger du en skolapp"
            className="inline-flex items-center gap-1.5 mb-4 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <BadgeCheck className="h-4 w-4" />
            Följer guiden
          </Link>
        )}
        {app.categories.length > 0 && (
          <div className="space-y-3">
            {/* Regular categories */}
            <div className="flex flex-wrap gap-2">
              {app.categories
                .filter((cat) => cat.type !== 'device')
                .map((cat) => (
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
            {app.categories.some((cat) => cat.type === 'device') && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Fungerar på:</span>
                <div className="flex items-center gap-1.5">
                  {app.categories
                    .filter((cat) => cat.type === 'device')
                    .map((cat) => {
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

        <NeedsInternet needs={app.needs_internet} variant="line" />

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
            <Eye className="w-4 h-4" />
            {app.clicks_count || 0}
          </span>
          <Link to={`/rapportera?app=${app.id}`} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Flag className="w-3.5 h-3.5" /> Rapportera
          </Link>
        </div>

        {/* Related Apps */}
        <RelatedApps 
          appId={app.id} 
          categoryIds={app.categories.filter((c) => c.type !== 'device').map((c) => c.id)} 
        />
      </div>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
