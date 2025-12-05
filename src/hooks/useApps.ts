import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface App {
  id: string;
  title: string;
  description: string;
  long_description?: string;
  url: string;
  image_url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'featured';
  is_featured: boolean;
  upvotes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  categories: {
    id: string;
    name: string;
    slug: string;
    type: string;
    icon: string;
    color: string;
  }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: string;
  icon: string;
  color: string;
  sort_order: number;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data as Category[];
    },
  });
}

interface AppsFilters {
  search?: string;
  subjects?: string[];
  ages?: string[];
  types?: string[];
  sort?: 'newest' | 'popular' | 'comments';
}

export function useApps(filters: AppsFilters = {}) {
  return useQuery({
    queryKey: ['apps', filters],
    queryFn: async () => {
      // Fetch apps with categories
      let query = supabase
        .from('apps')
        .select(`
          *,
          app_categories (
            category_id,
            categories (id, name, slug, type, icon, color)
          )
        `)
        .or('status.eq.approved,status.eq.featured');

      // Search filter
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Sorting
      switch (filters.sort) {
        case 'popular':
          query = query.order('upvotes_count', { ascending: false });
          break;
        case 'comments':
          query = query.order('comments_count', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data: appsData, error: appsError } = await query;

      if (appsError) throw appsError;

      if (!appsData || appsData.length === 0) return [];

      // Get unique user IDs and fetch profiles
      const userIds = [...new Set(appsData.map(app => app.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Transform data
      let transformedApps: App[] = appsData.map(app => ({
        id: app.id,
        title: app.title,
        description: app.description,
        long_description: app.long_description,
        url: app.url,
        image_url: app.image_url,
        status: app.status,
        is_featured: app.is_featured || false,
        upvotes_count: app.upvotes_count || 0,
        comments_count: app.comments_count || 0,
        created_at: app.created_at,
        user_id: app.user_id,
        profile: profilesMap.get(app.user_id) || null,
        categories: app.app_categories?.map((ac: any) => ac.categories).filter(Boolean) || [],
      }));

      // Filter by categories
      if (filters.subjects?.length) {
        transformedApps = transformedApps.filter(app =>
          app.categories.some(cat =>
            cat.type === 'subject' && filters.subjects?.includes(cat.slug)
          )
        );
      }

      if (filters.ages?.length) {
        transformedApps = transformedApps.filter(app =>
          app.categories.some(cat =>
            cat.type === 'age' && filters.ages?.includes(cat.slug)
          )
        );
      }

      if (filters.types?.length) {
        transformedApps = transformedApps.filter(app =>
          app.categories.some(cat =>
            cat.type === 'app_type' && filters.types?.includes(cat.slug)
          )
        );
      }

      return transformedApps;
    },
  });
}

export function useUserUpvotes() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['upvotes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('upvotes')
        .select('app_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(u => u.app_id);
    },
    enabled: !!user,
  });
}

export function useToggleUpvote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ appId, hasUpvoted }: { appId: string; hasUpvoted: boolean }) => {
      if (!user) throw new Error('Du måste vara inloggad för att rösta');

      if (hasUpvoted) {
        const { error } = await supabase
          .from('upvotes')
          .delete()
          .eq('app_id', appId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('upvotes')
          .insert({ app_id: appId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['upvotes'] });
    },
  });
}
