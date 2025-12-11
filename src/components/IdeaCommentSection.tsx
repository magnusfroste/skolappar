import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useIdeaComments, useAddIdeaComment, useDeleteIdeaComment } from '@/hooks/useIdeaComments';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Trash2, User, Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface IdeaCommentSectionProps {
  ideaId: string;
}

export function IdeaCommentSection({ ideaId }: IdeaCommentSectionProps) {
  const { user } = useAuth();
  const { data: comments, isLoading } = useIdeaComments(ideaId);
  const addComment = useAddIdeaComment();
  const deleteComment = useDeleteIdeaComment();
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await addComment.mutateAsync({ ideaId, content: content.trim() });
      setContent('');
      toast.success('Kommentar tillagd');
    } catch (error) {
      toast.error('Kunde inte lägga till kommentar');
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ commentId, ideaId });
      toast.success('Kommentar borttagen');
    } catch (error) {
      toast.error('Kunde inte ta bort kommentar');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        Kommentarer ({comments?.length || 0})
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Dela dina tankar om denna idé..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <Button
            type="submit"
            disabled={!content.trim() || addComment.isPending}
            size="sm"
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Kommentera
          </Button>
        </form>
      ) : (
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-muted-foreground text-sm">
            <Link to="/auth" className="text-primary hover:underline">
              Logga in
            </Link>{' '}
            för att kommentera
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-12 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {comment.profiles?.display_name || 'Anonym'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: sv,
                    })}
                  </span>
                  {user?.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm text-center py-4">
          Inga kommentarer ännu. Var först med att dela dina tankar!
        </p>
      )}
    </div>
  );
}
