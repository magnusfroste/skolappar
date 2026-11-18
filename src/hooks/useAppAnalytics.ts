import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { readAppAnalytics, type AnalyticsPeriod } from '@/lib/appAnalytics';
import { useAuth } from '@/hooks/useAuth';

export function useAppAnalytics(days: AnalyticsPeriod) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['admin-app-analytics', user?.id, days],
    queryFn: () => readAppAnalytics(supabase, days),
    enabled: !!user,
    refetchInterval: 60_000,
  });
}