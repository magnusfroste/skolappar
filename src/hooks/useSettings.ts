import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export const useSetting = (key: string) => {
  return useQuery({
    queryKey: ["setting", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();

      if (error) throw error;
      return data?.value ?? null;
    },
  });
};

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { error } = await supabase
        .from("settings")
        .upsert({ key, value: value as Json, updated_at: new Date().toISOString() });

      if (error) throw error;
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ["setting", key] });
    },
  });
};
