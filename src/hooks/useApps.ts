import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, voterHeaders } from '@/lib/api';

export interface App {
  id: string;
  title: string;
  description: string;
  long_description?: string;
  url: string;
  image_url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'featured' | 'delisted';
  is_featured: boolean;
  upvotes_count: number;
  comments_count: number;
  clicks_count: number;
  created_at: string;
  user_id: string;
  creator_name?: string | null;
  /** What the app uses the internet for, found by the automatic check: 'ai', 'read_aloud', 'listen'. */
  needs_internet?: string[];
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

/** A point of the curriculum's central content (Lgr22) that an app trains. */
export interface CurriculumPoint {
  id: string;
  subject: string;
  subject_name: string;
  stage: string;
  area_id: string;
  area: string;
  text: string;
}

/** An area of Lgr22 that at least one listed app trains. */
export interface CurriculumArea {
  id: string;
  subject_name: string;
  stage: string;
  area: string;
  apps: number;
}

export function useCurriculumUsed() {
  return useQuery({
    queryKey: ['curriculum-used'],
    queryFn: () => api.get<CurriculumArea[]>('/api/curriculum/used'),
    staleTime: 5 * 60 * 1000,
  });
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: string;
  icon: string;
  color: string;
  sort_order: number;
  description?: string | null;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/api/categories'),
  });
}

interface AppsFilters {
  search?: string;
  subjects?: string[];
  ages?: string[];
  types?: string[];
  /** An area of Lgr22, e.g. MA.1-3.1. */
  lgr?: string;
  sort?: 'recommended' | 'newest' | 'popular' | 'comments';
}

export function useApps(filters: AppsFilters = {}) {
  return useQuery({
    queryKey: ['apps', filters],
    queryFn: () => {
      const q = new URLSearchParams();
      if (filters.search) q.set('search', filters.search);
      if (filters.subjects?.length) q.set('subjects', filters.subjects.join(','));
      if (filters.ages?.length) q.set('ages', filters.ages.join(','));
      if (filters.types?.length) q.set('types', filters.types.join(','));
      if (filters.lgr) q.set('lgr', filters.lgr);
      if (filters.sort) q.set('sort', filters.sort);
      return api.get<App[]>(`/api/apps?${q}`);
    },
  });
}

export interface MyUpvotes {
  apps: string[];
  ideas: string[];
}

/** What this browser has upvoted (anonymous: a random id kept in localStorage). */
export function useMyUpvotes() {
  return useQuery({
    queryKey: ['upvotes'],
    queryFn: () => api.get<MyUpvotes>('/api/upvotes', voterHeaders()).catch((): MyUpvotes => ({ apps: [], ideas: [] })),
    staleTime: 5 * 60_000,
  });
}

export function useUserUpvotes() {
  const query = useMyUpvotes();
  return { ...query, data: query.data?.apps };
}

export function useToggleUpvote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appId }: { appId: string; hasUpvoted?: boolean }) =>
      api.post<{ upvoted: boolean; upvotes_count: number }>(`/api/apps/${appId}/upvote`, undefined, voterHeaders()),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['upvotes'] });
      queryClient.invalidateQueries({ queryKey: ['app', variables.appId] });
      queryClient.invalidateQueries({ queryKey: ['top-apps-week'] });
    },
  });
}
