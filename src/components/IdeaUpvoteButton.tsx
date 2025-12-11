import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IdeaUpvoteButtonProps {
  count: number;
  hasUpvoted?: boolean;
  onUpvote?: () => void;
  isLoading?: boolean;
  size?: 'sm' | 'md';
}

export function IdeaUpvoteButton({
  count,
  hasUpvoted,
  onUpvote,
  isLoading,
  size = 'md',
}: IdeaUpvoteButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onUpvote?.();
      }}
      disabled={isLoading}
      className={cn(
        'flex-col gap-0 border-border/50 transition-all duration-200',
        size === 'sm' ? 'h-14 w-12 px-2' : 'h-16 w-14 px-3',
        hasUpvoted
          ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
          : 'hover:border-primary/50 hover:text-primary'
      )}
    >
      <ChevronUp className={cn('shrink-0', size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')} />
      <span className={cn('font-semibold', size === 'sm' ? 'text-sm' : 'text-base')}>
        {count}
      </span>
    </Button>
  );
}
