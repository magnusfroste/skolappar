import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
  url?: string;
  categories: Category[];
}

/** Up to four public apps that share the most categories with the current one. */
export function useRelatedApps(currentAppId: string, categoryIds: string[]) {
  return useQuery({
    queryKey: ['related-apps', currentAppId, categoryIds],
    queryFn: () => api.get<RelatedApp[]>(`/api/apps/${encodeURIComponent(currentAppId)}/related`),
    enabled: categoryIds.length > 0,
  });
}
