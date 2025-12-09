import { Link } from 'react-router-dom';
import { ChevronUp, MessageCircle, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
  return (
    <Link to={`/app/${id}`} className="block group">
      <Card className="overflow-hidden border-0 bg-card/90 backdrop-blur-sm shadow-playful hover:shadow-playful-lg transition-all duration-300 hover:-translate-y-2 hover:border-primary/20">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors duration-300">
              <span className="group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">📱</span>
            </div>
          )}
          
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Upvote overlay */}
          <Button
            variant={hasUpvoted ? "default" : "secondary"}
            size="sm"
            className={`absolute top-3 right-3 flex-col h-auto py-1.5 px-2.5 gap-0 transition-all duration-200 hover:scale-110 ${
              hasUpvoted 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'bg-background/90 backdrop-blur-sm opacity-80 group-hover:opacity-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUpvote?.();
            }}
          >
            <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${hasUpvoted ? 'animate-bounce' : ''}`} />
            <span className="text-xs font-bold">{upvotesCount}</span>
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-heading font-bold text-base line-clamp-1 group-hover:text-primary transition-colors duration-200">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1 group-hover:text-muted-foreground/80 transition-colors duration-200">
              {description}
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 3).map((cat, index) => (
              <Badge
                key={cat.id}
                variant="secondary"
                className="text-xs font-medium px-2 py-0.5 transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: `${cat.color}15`,
                  color: cat.color,
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                {cat.icon} {cat.name}
              </Badge>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-3 min-w-0">
              {creatorName && creatorId ? (
                <Link 
                  to={`/profil/${creatorId}`} 
                  className="truncate hover:text-primary transition-colors text-xs font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  {creatorName}
                </Link>
              ) : creatorName ? (
                <span className="truncate text-xs">{creatorName}</span>
              ) : null}
              <span className="flex items-center gap-1 text-xs group-hover:text-foreground/70 transition-colors">
                <MessageCircle className="w-3 h-3" />
                {commentsCount}
              </span>
              <span className="flex items-center gap-1 text-xs group-hover:text-foreground/70 transition-colors">
                <Eye className="w-3 h-3" />
                {clicksCount}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
