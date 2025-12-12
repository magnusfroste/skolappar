import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTrackClick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appId: string) => {
      const { error } = await supabase.rpc('increment_clicks', { app_id: appId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['app'] });
      queryClient.invalidateQueries({ queryKey: ['my-apps'] });
    },
  });
}
