import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface RecentApp {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  url: string;
  clicks_count: number;
  upvotes_count: number;
  user_id: string | null;
  created_at: string;
  categories?: { type: string; slug: string }[];
}

export const useRecentApps = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["recent-apps"],
    queryFn: () => api.get<RecentApp[]>("/api/apps/recent"),
    enabled,
  });
};
