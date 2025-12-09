import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTopAppsThisWeek = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["top-apps-week"],
    queryFn: async () => {
      // Get apps
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
          user_id
        `)
        .in("status", ["approved", "featured"])
        .order("clicks_count", { ascending: false })
        .limit(6);

      if (error) throw error;

      // Calculate a simple score: clicks + upvotes*2
      const scored = apps?.map(app => ({
        ...app,
        score: (app.clicks_count || 0) + (app.upvotes_count || 0) * 2
      })).sort((a, b) => b.score - a.score).slice(0, 5);

      return scored || [];
    },
    enabled,
  });
};
