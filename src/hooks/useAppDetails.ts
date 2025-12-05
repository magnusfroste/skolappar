import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: string;
}

interface AppDetails {
  id: string;
  title: string;
  description: string;
  long_description: string | null;
  url: string;
  image_url: string | null;
  upvotes_count: number;
  comments_count: number;
  status: string;
  created_at: string;
  user_id: string;
  profile: Profile | null;
  categories: Category[];
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: Profile | null;
}

export function useAppDetails(appId: string | undefined) {
  return useQuery({
    queryKey: ['app', appId],
    queryFn: async (): Promise<AppDetails | null> => {
      if (!appId) return null;

      const { data: app, error } = await supabase
        .from('apps')
        .select('*')
        .eq('id', appId)
        .single();

      if (error) throw error;
      if (!app) return null;

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', app.user_id)
        .single();

      // Fetch categories
      const { data: appCategories } = await supabase
        .from('app_categories')
        .select('category_id')
        .eq('app_id', appId);

      let categories: Category[] = [];
      if (appCategories && appCategories.length > 0) {
        const categoryIds = appCategories.map((ac) => ac.category_id);
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name, icon, color, type')
          .in('id', categoryIds);
        categories = cats || [];
      }

      return {
        ...app,
        profile: profile || null,
        categories,
      };
    },
    enabled: !!appId,
  });
}

export function useAppComments(appId: string | undefined) {
  return useQuery({
    queryKey: ['comments', appId],
    queryFn: async (): Promise<Comment[]> => {
      if (!appId) return [];

      const { data: comments, error } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id')
        .eq('app_id', appId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!comments) return [];

      // Fetch profiles for all comments
      const userIds = [...new Set(comments.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return comments.map((comment) => ({
        ...comment,
        profile: profileMap.get(comment.user_id) || null,
      }));
    },
    enabled: !!appId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ appId, content }: { appId: string; content: string }) => {
      if (!user) throw new Error('Du måste vara inloggad');

      const { error } = await supabase.from('comments').insert({
        app_id: appId,
        user_id: user.id,
        content,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.appId] });
      queryClient.invalidateQueries({ queryKey: ['app', variables.appId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, appId }: { commentId: string; appId: string }) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      return appId;
    },
    onSuccess: (appId) => {
      queryClient.invalidateQueries({ queryKey: ['comments', appId] });
      queryClient.invalidateQueries({ queryKey: ['app', appId] });
    },
  });
}
