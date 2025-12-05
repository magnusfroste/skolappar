import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PublicApp {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  url: string;
  upvotes_count: number;
  comments_count: number;
  created_at: string;
  categories: {
    id: string;
    name: string;
    type: string;
    color: string | null;
  }[];
}

interface PublicProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export const usePublicProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, created_at")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as PublicProfile | null;
    },
    enabled: !!userId,
  });
};

export const usePublicProfileApps = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["public-profile-apps", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: apps, error } = await supabase
        .from("apps")
        .select(`
          id,
          title,
          description,
          image_url,
          url,
          upvotes_count,
          comments_count,
          created_at
        `)
        .eq("user_id", userId)
        .in("status", ["approved", "featured"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch categories for each app
      const appsWithCategories = await Promise.all(
        (apps || []).map(async (app) => {
          const { data: appCategories } = await supabase
            .from("app_categories")
            .select(`
              category:categories(id, name, type, color)
            `)
            .eq("app_id", app.id);

          return {
            ...app,
            categories: appCategories?.map((ac: any) => ac.category).filter(Boolean) || [],
          };
        })
      );

      return appsWithCategories as PublicApp[];
    },
    enabled: !!userId,
  });
};
