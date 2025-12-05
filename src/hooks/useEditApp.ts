import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UpdateAppData {
  title: string;
  description: string;
  long_description?: string;
  url: string;
  image_url?: string;
  categories: string[];
}

export function useApp(appId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['app', appId],
    queryFn: async () => {
      if (!appId) return null;

      const { data, error } = await supabase
        .from('apps')
        .select(`
          *,
          app_categories(category_id)
        `)
        .eq('id', appId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Check ownership
      if (data.user_id !== user?.id) {
        throw new Error('Du har inte behörighet att redigera denna app');
      }

      return {
        ...data,
        categories: data.app_categories?.map((ac: any) => ac.category_id) || []
      };
    },
    enabled: !!appId && !!user
  });
}

export function useUpdateApp() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ appId, data }: { appId: string; data: UpdateAppData }) => {
      if (!user) throw new Error('Du måste vara inloggad');

      // Update the app
      const { error: appError } = await supabase
        .from('apps')
        .update({
          title: data.title,
          description: data.description,
          long_description: data.long_description,
          url: data.url,
          image_url: data.image_url
        })
        .eq('id', appId)
        .eq('user_id', user.id);

      if (appError) throw appError;

      // Delete existing category associations
      const { error: deleteError } = await supabase
        .from('app_categories')
        .delete()
        .eq('app_id', appId);

      if (deleteError) throw deleteError;

      // Insert new category associations
      if (data.categories.length > 0) {
        const categoryInserts = data.categories.map(categoryId => ({
          app_id: appId,
          category_id: categoryId
        }));

        const { error: categoryError } = await supabase
          .from('app_categories')
          .insert(categoryInserts);

        if (categoryError) throw categoryError;
      }

      return { id: appId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['app', variables.appId] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['my-apps'] });
    }
  });
}
