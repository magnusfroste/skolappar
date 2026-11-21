import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, voterHeaders } from '@/lib/api';
import { useMyUpvotes } from './useApps';

export interface Idea {
  id: string;
  user_id: string | null;
  title: string;
  description: string;
  target_age: string | null;
  target_subject: string | null;
  status: 'open' | 'claimed' | 'built';
  claimed_by: string | null;
  claimed_at: string | null;
  built_app_id: string | null;
  upvotes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  claimer?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface IdeasFilters {
  status?: string;
  target_age?: string;
  target_subject?: string;
  search?: string;
  sortBy?: 'popular' | 'newest' | 'claimed';
}

export function useIdeas(filters?: IdeasFilters) {
  return useQuery({
    queryKey: ['ideas', filters],
    queryFn: () => {
      const q = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') q.set('status', filters.status);
      if (filters?.target_age) q.set('target_age', filters.target_age);
      if (filters?.target_subject) q.set('target_subject', filters.target_subject);
      if (filters?.search) q.set('search', filters.search);
      if (filters?.sortBy) q.set('sort', filters.sortBy);
      return api.get<Idea[]>(`/api/ideas?${q}`);
    },
  });
}

export function useIdeaDetails(id: string) {
  return useQuery({
    queryKey: ['idea', id],
    queryFn: async () => {
      try {
        return await api.get<Idea>(`/api/ideas/${encodeURIComponent(id)}`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: !!id,
  });
}

export function useTopIdeas(limit = 3) {
  return useQuery({
    queryKey: ['top-ideas', limit],
    queryFn: () => api.get<Idea[]>(`/api/ideas/top?limit=${limit}`),
  });
}

export function useUserIdeaUpvotes() {
  const query = useMyUpvotes();
  return { ...query, data: query.data?.ideas };
}

export function useToggleIdeaUpvote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ideaId }: { ideaId: string; hasUpvoted?: boolean }) =>
      api.post<{ upvoted: boolean; upvotes_count: number }>(`/api/ideas/${ideaId}/upvote`, undefined, voterHeaders()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['idea'] });
      queryClient.invalidateQueries({ queryKey: ['upvotes'] });
      queryClient.invalidateQueries({ queryKey: ['top-ideas'] });
    },
  });
}

export interface NewIdea {
  title: string;
  description: string;
  target_age?: string;
  target_subject?: string;
  email?: string;
  website?: string;
}

/** Anyone may post an idea (rate-limited on the server). */
export function useCreateIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idea: NewIdea) => api.post<{ ok: boolean; id?: string }>('/api/ideas', { ...idea }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['top-ideas'] });
    },
  });
}
