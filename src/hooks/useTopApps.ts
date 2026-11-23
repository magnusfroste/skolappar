import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface TopApp {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  url: string;
  clicks_count: number;
  upvotes_count: number;
  user_id: string | null;
  score: number;
  categories?: { type: string; slug: string }[];
}

/** Top five by a simple score: clicks + upvotes × 2. */
export const useTopAppsThisWeek = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["top-apps-week"],
    queryFn: () => api.get<TopApp[]>("/api/apps/top"),
    enabled,
  });
};
