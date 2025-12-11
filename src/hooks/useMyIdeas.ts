import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Idea } from './useIdeas';

export function useMyCreatedIdeas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-created-ideas', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Idea[];
    },
    enabled: !!user,
  });
}

export function useMyClaimedIdeas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-claimed-ideas', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase.from('ideas').select('*').eq('claimed_by', user.id).in('status', ['claimed', 'built']).order('claimed_at', { ascending: false });
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
    enabled: !!user,
  });
}

export function useCreateIdea() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (idea: {
      title: string;
      description: string;
      target_age?: string;
      target_subject?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ideas')
        .insert({
          ...idea,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['my-created-ideas'] });
    },
  });
}

export function useUpdateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      description?: string;
      target_age?: string;
      target_subject?: string;
    }) => {
      const { error } = await supabase
        .from('ideas')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['idea'] });
      queryClient.invalidateQueries({ queryKey: ['my-created-ideas'] });
    },
  });
}

export function useDeleteIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ideas').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['my-created-ideas'] });
    },
  });
}
