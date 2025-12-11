import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { IdeaStatusBadge } from '@/components/IdeaStatusBadge';
import { IdeaUpvoteButton } from '@/components/IdeaUpvoteButton';
import { ClaimIdeaButton } from '@/components/ClaimIdeaButton';
import { IdeaCommentSection } from '@/components/IdeaCommentSection';
import { SEO } from '@/components/SEO';
import { useIdeaDetails, useUserIdeaUpvotes, useToggleIdeaUpvote } from '@/hooks/useIdeas';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ArrowLeft, User, ExternalLink, Hammer } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: idea, isLoading } = useIdeaDetails(id || '');
  const { data: userUpvotes } = useUserIdeaUpvotes();
  const toggleUpvote = useToggleIdeaUpvote();

  const hasUpvoted = userUpvotes?.includes(id || '') || false;

  const handleUpvote = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    toggleUpvote.mutate(
      { ideaId: id!, hasUpvoted },
      {
        onError: () => toast.error('Kunde inte rösta'),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <main className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-12 w-full bg-muted rounded" />
              <div className="h-32 w-full bg-muted rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <main className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <h1 className="text-2xl font-bold mb-4">Idén hittades inte</h1>
            <Button asChild>
              <Link to="/ideer">Tillbaka till idéer</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${idea.title} | App-idéer | Skolappar`}
        description={idea.description.slice(0, 160)}
      />
      <PublicNav />

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Back button */}
          <Button variant="ghost" asChild className="mb-6 -ml-2">
            <Link to="/ideer" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till idéer
            </Link>
          </Button>

          <Card className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <IdeaUpvoteButton
                count={idea.upvotes_count}
                hasUpvoted={hasUpvoted}
                onUpvote={handleUpvote}
                isLoading={toggleUpvote.isPending}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <IdeaStatusBadge status={idea.status} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{idea.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={idea.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <span>{idea.profiles?.display_name || 'Anonym'}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(idea.created_at), {
                      addSuffix: true,
                      locale: sv,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {idea.target_subject && (
                <span className="text-sm bg-secondary/50 text-secondary-foreground px-3 py-1 rounded-full">
                  📐 {idea.target_subject}
                </span>
              )}
              {idea.target_age && (
                <span className="text-sm bg-secondary/50 text-secondary-foreground px-3 py-1 rounded-full">
                  👶 {idea.target_age}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="prose prose-neutral dark:prose-invert max-w-none mb-6">
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {idea.description}
              </p>
            </div>

            {/* Claimed by info */}
            {idea.status === 'claimed' && idea.claimer && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Hammer className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-600">Under utveckling</p>
                    <p className="text-sm text-muted-foreground">
                      {idea.claimer.display_name || 'En utvecklare'} har tagit sig
                      an denna idé
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Built app link */}
            {idea.status === 'built' && idea.built_app_id && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-primary">Appen är klar!</p>
                    <p className="text-sm text-muted-foreground">
                      Denna idé har blivit verklighet
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link to={`/app/${idea.built_app_id}`}>
                      <ExternalLink className="h-4 w-4" />
                      Se appen
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Action button */}
            <div className="flex justify-end mb-6">
              <ClaimIdeaButton
                ideaId={idea.id}
                status={idea.status}
                claimedBy={idea.claimed_by}
              />
            </div>

            <Separator className="my-6" />

            {/* Comments */}
            <IdeaCommentSection ideaId={idea.id} />
          </Card>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
