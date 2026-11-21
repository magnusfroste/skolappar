import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Count an app opening (increment_clicks): only listed apps count. */
export function useTrackClick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appId: string) => api.post(`/api/apps/${encodeURIComponent(appId)}/click`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['app'] });
    },
  });
}
