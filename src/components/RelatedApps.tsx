import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRelatedApps } from '@/hooks/useRelatedApps';

interface RelatedAppsProps {
  appId: string;
  categoryIds: string[];
}

export function RelatedApps({ appId, categoryIds }: RelatedAppsProps) {
  const { data: apps, isLoading } = useRelatedApps(appId, categoryIds);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="font-heading font-semibold text-lg">Liknande appar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video" />
              <div className="p-3">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!apps || apps.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 pt-6 border-t border-border/50">
      <h3 className="font-heading font-semibold text-lg">Liknande appar</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {apps.map((app) => (
          <Link key={app.id} to={`/app/${app.id}`}>
            <Card className="overflow-hidden hover:shadow-playful transition-shadow group">
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
                  <span className="text-3xl">📱</span>
                </div>
              )}
              <div className="p-3">
                <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                  {app.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {app.description}
                </p>
                {app.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {app.categories.slice(0, 2).map((cat) => (
                      <Badge 
                        key={cat.id} 
                        variant="outline" 
                        className="text-xs py-0 px-1.5"
                      >
                        {cat.icon} {cat.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
