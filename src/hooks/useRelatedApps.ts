import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface RelatedApp {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  categories: Category[];
}

export function useRelatedApps(currentAppId: string, categoryIds: string[]) {
  return useQuery({
    queryKey: ['related-apps', currentAppId, categoryIds],
    queryFn: async (): Promise<RelatedApp[]> => {
      if (!categoryIds.length) return [];

      // Find apps that share categories (excluding device categories)
      const { data: appCategories } = await supabase
        .from('app_categories')
        .select('app_id')
        .in('category_id', categoryIds)
        .neq('app_id', currentAppId);

      if (!appCategories || appCategories.length === 0) return [];

      // Get unique app IDs and count category matches
      const appCounts = appCategories.reduce((acc, { app_id }) => {
        acc[app_id] = (acc[app_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Sort by most matching categories and take top 4
      const sortedAppIds = Object.entries(appCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([id]) => id);

      if (sortedAppIds.length === 0) return [];

      // Fetch app details
      const { data: apps } = await supabase
        .from('apps')
        .select('id, title, description, image_url')
        .in('id', sortedAppIds)
        .eq('status', 'approved');

      if (!apps) return [];

      // Fetch categories for these apps
      const { data: allAppCategories } = await supabase
        .from('app_categories')
        .select('app_id, category_id')
        .in('app_id', sortedAppIds);

      const categoryIdsToFetch = [...new Set(allAppCategories?.map(ac => ac.category_id) || [])];
      
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, icon')
        .in('id', categoryIdsToFetch)
        .neq('type', 'device');

      const categoryMap = new Map(categories?.map(c => [c.id, c]) || []);
      const appCategoriesMap = new Map<string, Category[]>();
      
      allAppCategories?.forEach(({ app_id, category_id }) => {
        const cat = categoryMap.get(category_id);
        if (cat) {
          if (!appCategoriesMap.has(app_id)) {
            appCategoriesMap.set(app_id, []);
          }
          appCategoriesMap.get(app_id)!.push(cat);
        }
      });

      return apps.map(app => ({
        ...app,
        categories: appCategoriesMap.get(app.id) || [],
      }));
    },
    enabled: categoryIds.length > 0,
  });
}
