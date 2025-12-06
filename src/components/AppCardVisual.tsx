import { Link } from 'react-router-dom';
import { ChevronUp, MessageCircle, ExternalLink, MousePointerClick } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTrackClick } from '@/hooks/useTrackClick';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

interface AppCardVisualProps {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  upvotesCount: number;
  commentsCount: number;
  clicksCount: number;
  creatorId?: string;
  creatorName?: string;
  categories: Category[];
  hasUpvoted?: boolean;
  onUpvote?: () => void;
}

export function AppCardVisual({
  id,
  title,
  description,
  url,
  imageUrl,
  upvotesCount,
  commentsCount,
  clicksCount,
  creatorId,
  creatorName,
  categories,
  hasUpvoted,
  onUpvote,
}: AppCardVisualProps) {
  const trackClick = useTrackClick();
  return (
    <Card className="group overflow-hidden border-0 bg-card/90 backdrop-blur-sm shadow-playful hover:shadow-playful-lg transition-all duration-300 hover:-translate-y-1">
      {/* Thumbnail */}
      <Link to={`/app/${id}`} className="block relative aspect-video overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-primary/10 to-secondary/10">
            📱
          </div>
        )}
        
        {/* Upvote overlay */}
        <Button
          variant={hasUpvoted ? "default" : "secondary"}
          size="sm"
          className={`absolute top-3 right-3 flex-col h-auto py-1.5 px-2.5 gap-0 opacity-90 hover:opacity-100 ${
            hasUpvoted ? 'bg-primary text-primary-foreground' : 'bg-background/90 backdrop-blur-sm'
          }`}
          onClick={(e) => {
            e.preventDefault();
            onUpvote?.();
          }}
        >
          <ChevronUp className="w-4 h-4" />
          <span className="text-xs font-bold">{upvotesCount}</span>
        </Button>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <Link to={`/app/${id}`}>
            <h3 className="font-heading font-bold text-base line-clamp-1 hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {description}
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1.5">
          {categories.slice(0, 3).map((cat) => (
            <Badge
              key={cat.id}
              variant="secondary"
              className="text-xs font-medium px-2 py-0.5"
              style={{
                backgroundColor: `${cat.color}15`,
                color: cat.color,
              }}
            >
              {cat.icon} {cat.name}
            </Badge>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 min-w-0">
            {creatorName && creatorId ? (
              <Link 
                to={`/profil/${creatorId}`} 
                className="truncate hover:text-foreground transition-colors text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {creatorName}
              </Link>
            ) : creatorName ? (
              <span className="truncate text-xs">{creatorName}</span>
            ) : null}
            <Link
              to={`/app/${id}#kommentarer`}
              className="flex items-center gap-1 text-xs hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="w-3 h-3" />
              {commentsCount}
            </Link>
            <span className="flex items-center gap-1 text-xs">
              <MousePointerClick className="w-3 h-3" />
              {clicksCount}
            </span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              trackClick.mutate(id);
            }}
          >
            Öppna
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </Card>
  );
}
