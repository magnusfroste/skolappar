import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IdeaStatusBadge } from './IdeaStatusBadge';
import { IdeaUpvoteButton } from './IdeaUpvoteButton';
import { MessageCircle, User } from 'lucide-react';
import type { Idea } from '@/hooks/useIdeas';

interface IdeaCardProps {
  idea: Idea;
  hasUpvoted?: boolean;
  onUpvote?: () => void;
  isUpvoting?: boolean;
}

export function IdeaCard({ idea, hasUpvoted, onUpvote, isUpvoting }: IdeaCardProps) {
  const displayName = idea.profiles?.display_name || 'Anonym';

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <IdeaStatusBadge status={idea.status} size="sm" />
          <IdeaUpvoteButton
            count={idea.upvotes_count}
            hasUpvoted={hasUpvoted}
            onUpvote={onUpvote}
            isLoading={isUpvoting}
            size="sm"
          />
        </div>

        <Link to={`/ideer/${idea.id}`} className="block group/link">
          <h3 className="font-semibold text-lg text-foreground mb-2 group-hover/link:text-primary transition-colors line-clamp-2">
            {idea.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
            {idea.description}
          </p>
        </Link>

        <div className="flex flex-wrap gap-2 mb-4">
          {idea.target_subject && (
            <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full">
              📐 {idea.target_subject}
            </span>
          )}
          {idea.target_age && (
            <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full">
              👶 {idea.target_age}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={idea.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-muted">
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{displayName}</span>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{idea.comments_count}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
