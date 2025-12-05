import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubmitAppData {
  title: string;
  description: string;
  long_description?: string;
  url: string;
  image_url?: string;
  categories: string[];
}

export function useSubmitApp() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: SubmitAppData) => {
      if (!user) throw new Error('Du måste vara inloggad');

      // Insert the app
      const { data: app, error: appError } = await supabase
        .from('apps')
        .insert({
          title: data.title,
          description: data.description,
          long_description: data.long_description,
          url: data.url,
          image_url: data.image_url,
          user_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (appError) throw appError;

      // Insert category associations
      if (data.categories.length > 0) {
        const categoryInserts = data.categories.map(categoryId => ({
          app_id: app.id,
          category_id: categoryId
        }));

        const { error: categoryError } = await supabase
          .from('app_categories')
          .insert(categoryInserts);

        if (categoryError) throw categoryError;
      }

      return app;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['my-apps'] });
    }
  });
}

export function useUploadAppImage() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Du måste vara inloggad');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('app-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('app-images')
        .getPublicUrl(fileName);

      return publicUrl;
    }
  });
}

export function useMyApps() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
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
      return data;
    }
  });
}
