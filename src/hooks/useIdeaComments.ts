import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface IdeaComment {
  id: string;
  idea_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useIdeaComments(ideaId: string) {
  return useQuery({
    queryKey: ['idea-comments', ideaId],
    queryFn: async () => {
      const { data, error } = await supabase.from('idea_comments').select('*').eq('idea_id', ideaId).order('created_at', { ascending: true });
      if (error) throw error;

      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', userIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      return data.map(comment => ({
        ...comment,
        profiles: profileMap[comment.user_id] || null,
      })) as IdeaComment[];
    },
    enabled: !!ideaId,
  });
}

export function useAddIdeaComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ ideaId, content }: { ideaId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('idea_comments')
        .insert({
          idea_id: ideaId,
          user_id: user.id,
          content,
        });

      if (error) throw error;
    },
    onSuccess: (_, { ideaId }) => {
      queryClient.invalidateQueries({ queryKey: ['idea-comments', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
    },
  });
}

export function useDeleteIdeaComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, ideaId }: { commentId: string; ideaId: string }) => {
      const { error } = await supabase
        .from('idea_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return ideaId;
    },
    onSuccess: (ideaId) => {
      queryClient.invalidateQueries({ queryKey: ['idea-comments', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
    },
  });
}
