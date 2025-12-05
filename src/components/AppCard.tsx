import { Link } from 'react-router-dom';
import { ChevronUp, MessageCircle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

interface AppCardProps {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  upvotesCount: number;
  commentsCount: number;
  creatorId?: string;
  creatorName?: string;
  categories: Category[];
  hasUpvoted?: boolean;
  onUpvote?: () => void;
}

export function AppCard({
  id,
  title,
  description,
  url,
  imageUrl,
  upvotesCount,
  commentsCount,
  creatorId,
  creatorName,
  categories,
  hasUpvoted,
  onUpvote,
}: AppCardProps) {
  return (
    <Card className="group overflow-hidden border-0 bg-card/80 backdrop-blur-sm shadow-playful hover:shadow-playful-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          {/* Image */}
          <Link to={`/app/${id}`} className="flex-shrink-0">
            <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-muted">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-primary/10 to-secondary/10">
                  📱
                </div>
              )}
            </div>
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link to={`/app/${id}`}>
                  <h3 className="font-heading font-bold text-lg truncate hover:text-primary transition-colors">
                    {title}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {description}
                </p>
              </div>
              
              {/* Upvote button */}
              <Button
                variant={hasUpvoted ? "default" : "outline"}
                size="sm"
                className={`flex-shrink-0 flex-col h-auto py-2 px-3 gap-0 ${
                  hasUpvoted ? 'bg-primary text-primary-foreground' : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onUpvote?.();
                }}
              >
                <ChevronUp className="w-4 h-4" />
                <span className="text-xs font-bold">{upvotesCount}</span>
              </Button>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {categories.slice(0, 4).map((cat) => (
                <Badge
                  key={cat.id}
                  variant="secondary"
                  className="text-xs font-medium"
                  style={{
                    backgroundColor: `${cat.color}20`,
                    color: cat.color,
                  }}
                >
                  {cat.icon} {cat.name}
                </Badge>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                {creatorName && creatorId && (
                  <Link 
                    to={`/profil/${creatorId}`} 
                    className="truncate hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    av {creatorName}
                  </Link>
                )}
                {creatorName && !creatorId && (
                  <span className="truncate">av {creatorName}</span>
                )}
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {commentsCount}
                </span>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Öppna
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
