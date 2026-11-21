import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PlatformStats {
  apps: number;
  creators: number;
  subjects: number;
  upvotes: number;
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => api.get<PlatformStats>("/api/stats"),
    staleTime: 5 * 60 * 1000,
  });
}
