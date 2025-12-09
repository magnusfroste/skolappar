import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentApps } from '@/hooks/useRecentApps';
import { useSetting } from '@/hooks/useSettings';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

export function RecentAppsSection() {
  const { data: showRecentApps } = useSetting('show_recent_apps');
  const { data: recentApps, isLoading } = useRecentApps(showRecentApps === true);

  // Don't render if disabled or no apps
  if (showRecentApps !== true) return null;
  if (!isLoading && (!recentApps || recentApps.length === 0)) return null;

  return (
    <section className="relative z-10 container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-secondary/50">
              <Clock className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold">
                Nyligen tillagda
              </h2>
              <p className="text-sm text-muted-foreground">
                Senaste apparna från communityn
              </p>
            </div>
          </div>
          <Button variant="ghost" asChild className="hidden sm:flex gap-1">
            <Link to="/apps">
              Visa alla
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentApps?.slice(0, 3).map((app: any) => (
              <Link key={app.id} to={`/app/${app.id}`}>
                <Card className="group relative overflow-hidden rounded-2xl border-0 bg-card/80 backdrop-blur-sm shadow-playful hover:shadow-playful-lg transition-all duration-300 hover:-translate-y-1">
                  {/* New badge */}
                  <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium shadow-lg">
                    Nytt
                  </div>
                  
                  {/* Image */}
                  <div className="aspect-video overflow-hidden">
                    {app.image_url ? (
                      <img
                        src={app.image_url}
                        alt={app.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-4xl">
                        📱
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-heading font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                      {app.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {app.description}
                    </p>
                    <div className="flex items-center mt-3 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: sv })}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Mobile "visa alla" button */}
        <div className="flex justify-center mt-6 sm:hidden">
          <Button variant="outline" asChild className="gap-1">
            <Link to="/apps">
              Visa alla appar
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
