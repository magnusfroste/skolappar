import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  type: string;
}

export interface AppDetails {
  id: string;
  title: string;
  description: string;
  long_description: string | null;
  url: string;
  image_url: string | null;
  needs_internet?: string[];
  upvotes_count: number;
  comments_count: number;
  clicks_count: number;
  status: string;
  created_at: string;
  user_id: string | null;
  creator_name: string | null;
  profile: Profile | null;
  categories: Category[];
  /** The last automatic check of the address found nothing that breaks the build guide. */
  guide_ok?: boolean;
  /** The points of Lgr22 the app trains. */
  curriculum?: import('./useApps').CurriculumPoint[];
}

export function useAppDetails(appId: string | undefined) {
  return useQuery({
    queryKey: ['app', appId],
    queryFn: async (): Promise<AppDetails | null> => {
      if (!appId) return null;
      try {
        return await api.get<AppDetails>(`/api/apps/${encodeURIComponent(appId)}`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: !!appId,
  });
}
