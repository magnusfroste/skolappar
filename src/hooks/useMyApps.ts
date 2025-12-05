import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MyApp {
  id: string;
  title: string;
  description: string;
  long_description: string | null;
  url: string;
  image_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'featured';
  upvotes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  categories: {
    id: string;
    name: string;
    icon: string | null;
    type: string;
  }[];
}

export function useMyApps() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-apps', user?.id],
    queryFn: async (): Promise<MyApp[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('apps')
        .select(`
          *,
          app_categories(category_id, categories(*))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(app => ({
        id: app.id,
        title: app.title,
        description: app.description,
        long_description: app.long_description,
        url: app.url,
        image_url: app.image_url,
        status: app.status as MyApp['status'],
        upvotes_count: app.upvotes_count || 0,
        comments_count: app.comments_count || 0,
        created_at: app.created_at,
        updated_at: app.updated_at,
        categories: app.app_categories?.map((ac: any) => ac.categories).filter(Boolean) || []
      }));
    },
    enabled: !!user
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appId: string) => {
      const { error } = await supabase
        .from('apps')
        .delete()
        .eq('id', appId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-apps'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    }
  });
}

export function useMyStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('apps')
        .select('upvotes_count, comments_count, status')
        .eq('user_id', user.id);

      if (error) throw error;

      const totalApps = data.length;
      const totalUpvotes = data.reduce((sum, app) => sum + (app.upvotes_count || 0), 0);
      const totalComments = data.reduce((sum, app) => sum + (app.comments_count || 0), 0);
      const pendingApps = data.filter(app => app.status === 'pending').length;
      const approvedApps = data.filter(app => app.status === 'approved' || app.status === 'featured').length;

      return {
        totalApps,
        totalUpvotes,
        totalComments,
        pendingApps,
        approvedApps
      };
    },
    enabled: !!user
  });
}
