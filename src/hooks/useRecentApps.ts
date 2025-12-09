import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRecentApps = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["recent-apps"],
    queryFn: async () => {
      const { data: apps, error } = await supabase
        .from("apps")
        .select(`
          id,
          title,
          description,
          image_url,
          url,
          clicks_count,
          upvotes_count,
          user_id,
          created_at
        `)
        .in("status", ["approved", "featured"])
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      return apps || [];
    },
    enabled,
  });
};
