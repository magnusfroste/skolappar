import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformStats {
  apps: number;
  creators: number;
  subjects: number;
  upvotes: number;
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async (): Promise<PlatformStats> => {
      const [apps, subjects, upvotes] = await Promise.all([
        supabase
          .from("apps")
          .select("user_id", { count: "exact" })
          .in("status", ["approved", "featured"]),
        supabase
          .from("categories")
          .select("id", { count: "exact", head: true })
          .eq("type", "subject"),
        supabase.from("upvotes").select("id", { count: "exact", head: true }),
      ]);

      const creators = new Set((apps.data ?? []).map((a: { user_id: string }) => a.user_id)).size;

      return {
        apps: apps.count ?? 0,
        creators,
        subjects: subjects.count ?? 0,
        upvotes: upvotes.count ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
