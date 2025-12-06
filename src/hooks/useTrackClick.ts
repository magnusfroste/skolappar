import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTrackClick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appId: string) => {
      // Get current count and increment
      const { data: currentApp } = await supabase
        .from('apps')
        .select('clicks_count')
        .eq('id', appId)
        .single();

      const newCount = (currentApp?.clicks_count || 0) + 1;
      
      const { error } = await supabase
        .from('apps')
        .update({ clicks_count: newCount })
        .eq('id', appId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['app'] });
      queryClient.invalidateQueries({ queryKey: ['my-apps'] });
    },
  });
}
