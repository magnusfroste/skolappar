import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ResourceCategory = 'tips' | 'learn' | 'inspiration' | 'platforms';

export interface Resource {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: ResourceCategory;
  icon: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function useResources(category?: ResourceCategory) {
  return useQuery({
    queryKey: ['resources', category],
    queryFn: async () => {
      let query = supabase
        .from('resources')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Resource[];
    },
  });
}

export function useResource(slug: string) {
  return useQuery({
    queryKey: ['resource', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data as Resource;
    },
    enabled: !!slug,
  });
}
