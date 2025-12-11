import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Idea {
  id: string;
  user_id: string;
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
  };
  claimer?: {
    display_name: string | null;
    avatar_url: string | null;
  };
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
    queryFn: async () => {
      let query = supabase.from('ideas').select('*');

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.target_age) {
        query = query.eq('target_age', filters.target_age);
      }

      if (filters?.target_subject) {
        query = query.eq('target_subject', filters.target_subject);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.sortBy === 'popular') {
        query = query.order('upvotes_count', { ascending: false });
      } else if (filters?.sortBy === 'claimed') {
        query = query.eq('status', 'claimed').order('claimed_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(data.map(i => i.user_id).concat(data.map(i => i.claimed_by).filter(Boolean)))];
      const { data: profiles } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', userIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      return data.map(idea => ({
        ...idea,
        status: idea.status as 'open' | 'claimed' | 'built',
        profiles: profileMap[idea.user_id] || null,
        claimer: idea.claimed_by ? profileMap[idea.claimed_by] || null : null,
      })) as Idea[];
    },
  });
}

export function useIdeaDetails(id: string) {
  return useQuery({
    queryKey: ['idea', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('ideas').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const userIds = [data.user_id, data.claimed_by].filter(Boolean) as string[];
      const { data: profiles } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', userIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      return {
        ...data,
        status: data.status as 'open' | 'claimed' | 'built',
        profiles: profileMap[data.user_id] || null,
        claimer: data.claimed_by ? profileMap[data.claimed_by] || null : null,
      } as Idea;
    },
    enabled: !!id,
  });
}

export function useTopIdeas(limit = 3) {
  return useQuery({
    queryKey: ['top-ideas', limit],
    queryFn: async () => {
      const { data, error } = await supabase.from('ideas').select('*').eq('status', 'open').order('upvotes_count', { ascending: false }).limit(limit);
      if (error) throw error;

      const userIds = [...new Set(data.map(i => i.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', userIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      return data.map(idea => ({
        ...idea,
        status: idea.status as 'open' | 'claimed' | 'built',
        profiles: profileMap[idea.user_id] || null,
      })) as Idea[];
    },
  });
}

export function useUserIdeaUpvotes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-idea-upvotes', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('idea_upvotes')
        .select('idea_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map((u) => u.idea_id);
    },
    enabled: !!user,
  });
}

export function useToggleIdeaUpvote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ ideaId, hasUpvoted }: { ideaId: string; hasUpvoted: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (hasUpvoted) {
        const { error } = await supabase
          .from('idea_upvotes')
          .delete()
          .eq('idea_id', ideaId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('idea_upvotes')
          .insert({ idea_id: ideaId, user_id: user.id });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['idea'] });
      queryClient.invalidateQueries({ queryKey: ['user-idea-upvotes'] });
      queryClient.invalidateQueries({ queryKey: ['top-ideas'] });
    },
  });
}

export function useClaimIdea() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ideaId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ideas')
        .update({
          status: 'claimed',
          claimed_by: user.id,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', ideaId)
        .eq('status', 'open');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['idea'] });
      queryClient.invalidateQueries({ queryKey: ['my-claimed-ideas'] });
    },
  });
}

export function useUnclaimIdea() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ideaId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ideas')
        .update({
          status: 'open',
          claimed_by: null,
          claimed_at: null,
        })
        .eq('id', ideaId)
        .eq('claimed_by', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['idea'] });
      queryClient.invalidateQueries({ queryKey: ['my-claimed-ideas'] });
    },
  });
}

export function useMarkIdeaAsBuilt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ideaId, appId }: { ideaId: string; appId: string }) => {
      const { error } = await supabase
        .from('ideas')
        .update({
          status: 'built',
          built_app_id: appId,
        })
        .eq('id', ideaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['idea'] });
    },
  });
}
