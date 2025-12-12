import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { IdeaCard } from './IdeaCard';
import { useTopIdeas, useUserIdeaUpvotes, useToggleIdeaUpvote } from '@/hooks/useIdeas';
import { useAuth } from '@/hooks/useAuth';
import { useSetting } from '@/hooks/useSettings';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function TopIdeasSection() {
  const { data: showTopIdeas } = useSetting('show_top_ideas');
  const { data: ideas, isLoading } = useTopIdeas(3);
  const { data: userUpvotes } = useUserIdeaUpvotes();
  const toggleUpvote = useToggleIdeaUpvote();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Don't render if disabled
  if (showTopIdeas !== true) return null;

  const handleUpvote = (ideaId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const hasUpvoted = userUpvotes?.includes(ideaId) || false;
    toggleUpvote.mutate(
      { ideaId, hasUpvoted },
      {
        onError: () => toast.error('Kunde inte rösta'),
      }
    );
  };

  if (isLoading || !ideas?.length) {
    return null;
  }

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Lightbulb className="h-6 w-6 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold">Mest efterfrågade appar</h2>
          </div>
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/ideer">
              Se alla idéer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              hasUpvoted={userUpvotes?.includes(idea.id)}
              onUpvote={() => handleUpvote(idea.id)}
              isUpvoting={toggleUpvote.isPending}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
