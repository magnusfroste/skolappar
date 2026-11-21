import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
    queryFn: () => api.get<Resource[]>(`/api/resources${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  });
}

export function useResource(slug: string) {
  return useQuery({
    queryKey: ['resource', slug],
    queryFn: () => api.get<Resource>(`/api/resources/${encodeURIComponent(slug)}`),
    enabled: !!slug,
  });
}
