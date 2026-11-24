import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, ApiError, getAdminKey } from '@/lib/api';
import type { App, Category } from './useApps';
import type { Idea } from './useIdeas';
import type { Resource } from './useResources';

export type AppStatus = 'approved' | 'rejected' | 'featured' | 'pending' | 'delisted';

export type MailKind = 'confirm' | 'published';

/** Outcome of the last confirmation / published mail to the submitter. */
export interface MailState {
  status: 'sent' | 'failed' | 'not_configured';
  reason: string | null;
  at: string;
}

export interface AdminApp extends App {
  long_description?: string | null;
  delist_reason: string | null;
  updated_at: string;
  submitter_email: string | null;
  submitter_note: string | null;
  email_confirmed: boolean;
  published_notified_at: string | null;
  mail?: { confirm: MailState | null; published: MailState | null };
}

export interface AdminIdea extends Idea {
  submitter_email: string | null;
  claimer_name: string | null;
  profile: { display_name: string | null; avatar_url: string | null } | null;
  claimer_profile: { display_name: string | null; avatar_url: string | null } | null;
}

/** Checks the admin key kept in sessionStorage. `error.status` 503 means ADMIN_KEY is not set on the server. */
export function useIsAdmin(keyVersion = 0) {
  // The key itself is part of the query key (memory only), so every page under
  // /admin shares the result and a new key is checked again.
  return useQuery({
    queryKey: ['is-admin', getAdminKey() ?? '', keyVersion],
    queryFn: async () => {
      if (!getAdminKey()) return false;
      try {
        await adminApi.get('/api/admin/check');
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return false;
        throw err;
      }
    },
    retry: false,
    staleTime: Infinity,
  });
}

const invalidateApps = (qc: ReturnType<typeof useQueryClient>) => {
  for (const key of ['pending-apps', 'all-apps-admin', 'apps', 'app', 'admin-app', 'top-apps-week', 'recent-apps']) {
    qc.invalidateQueries({ queryKey: [key] });
  }
};

export function usePendingApps(enabled = true) {
  return useQuery({
    queryKey: ['pending-apps'],
    queryFn: async () => {
      const apps = await adminApi.get<AdminApp[]>('/api/admin/apps?status=pending');
      return apps.sort((a, b) => a.created_at.localeCompare(b.created_at));
    },
    enabled,
  });
}

export function useAllApps(enabled = true) {
  return useQuery({
    queryKey: ['all-apps-admin'],
    queryFn: () => adminApi.get<AdminApp[]>('/api/admin/apps'),
    enabled,
  });
}

export function useAdminApp(appId: string | undefined) {
  return useQuery({
    queryKey: ['admin-app', appId],
    queryFn: () => adminApi.get<AdminApp>(`/api/admin/apps/${appId}`),
    enabled: !!appId,
  });
}

export interface AppPatch {
  title?: string;
  description?: string;
  long_description?: string | null;
  url?: string;
  image_url?: string | null;
  creator_name?: string | null;
  status?: AppStatus;
  is_featured?: boolean;
  delist_reason?: string | null;
  category_ids?: string[];
}

export function useUpdateAppAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appId, patch }: { appId: string; patch: AppPatch }) =>
      adminApi.patch<{ app: AdminApp }>(`/api/admin/apps/${appId}`, { ...patch }),
    onSuccess: () => invalidateApps(queryClient),
  });
}

export function useSetAppImageFromUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appId, url }: { appId: string; url: string }) =>
      adminApi.post<{ app: AdminApp }>(`/api/admin/apps/${appId}/image`, { url }),
    onSuccess: () => invalidateApps(queryClient),
  });
}

export function useResendMail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appId, kind }: { appId: string; kind: MailKind }) =>
      adminApi.post<{ result: { sent: boolean; reason?: string }; app: AdminApp }>(`/api/admin/apps/${appId}/resend-mail`, { kind }),
    onSuccess: () => invalidateApps(queryClient),
  });
}

export function useUpdateAppStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appId, status, delistReason }: { appId: string; status: AppStatus; delistReason?: string }) => {
      const patch: AppPatch = { status };
      if (status === 'delisted' && delistReason) patch.delist_reason = delistReason;
      else if (status !== 'delisted') patch.delist_reason = null;
      return adminApi.patch(`/api/admin/apps/${appId}`, { ...patch });
    },
    onSuccess: () => invalidateApps(queryClient),
  });
}

export function useDeleteAppAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appId: string) => adminApi.delete(`/api/admin/apps/${appId}`),
    onSuccess: () => invalidateApps(queryClient),
  });
}

// Category management
export function useAdminCategories(enabled = true) {
  return useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.get<Category[]>('/api/admin/categories'),
    enabled,
  });
}

type CategoryInput = {
  name?: string;
  slug?: string;
  type?: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  sort_order?: number;
};

const pickCategory = (c: CategoryInput) => ({
  name: c.name, slug: c.slug, type: c.type, icon: c.icon, color: c.color, description: c.description, sort_order: c.sort_order,
});

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: CategoryInput & { name: string; slug: string; type: string }) =>
      adminApi.post<Category>('/api/admin/categories', pickCategory(category)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: CategoryInput & { id: string }) =>
      adminApi.patch(`/api/admin/categories/${id}`, pickCategory(updates)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}

// Resource management
type ResourceInput = {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: string;
  category?: string;
  icon?: string | null;
  sort_order?: number;
  is_published?: boolean;
};

const pickResource = (r: ResourceInput) => ({
  title: r.title, slug: r.slug, excerpt: r.excerpt, content: r.content, category: r.category,
  icon: r.icon, sort_order: r.sort_order, is_published: r.is_published,
});

export function useAdminResources(enabled = true) {
  return useQuery({
    queryKey: ['admin-resources'],
    queryFn: () => adminApi.get<Resource[]>('/api/admin/resources'),
    enabled,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resource: ResourceInput & { title: string; slug: string; content: string; category: string }) =>
      adminApi.post<Resource>('/api/admin/resources', pickResource(resource)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: ResourceInput & { id: string }) =>
      adminApi.patch(`/api/admin/resources/${id}`, pickResource(updates)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resource'] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/resources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

// Idea management for admin
export function useAdminIdeas(enabled = true) {
  return useQuery({
    queryKey: ['admin-ideas'],
    queryFn: () => adminApi.get<AdminIdea[]>('/api/admin/ideas'),
    enabled,
  });
}

export function useAdminIdeasStats(enabled = true) {
  return useQuery({
    queryKey: ['admin-ideas-stats'],
    queryFn: () => adminApi.get<{
      total: number; open: number; claimed: number; built: number;
      totalUpvotes: number; totalComments: number; conversionRate: number;
    }>('/api/admin/ideas/stats'),
    enabled,
  });
}

export function useUpdateIdeaStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ideaId, status }: { ideaId: string; status: 'open' | 'claimed' | 'built' }) =>
      adminApi.patch(`/api/admin/ideas/${ideaId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ideas'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ideas-stats'] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['idea'] });
    },
  });
}

export function useDeleteIdeaAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ideaId: string) => adminApi.delete(`/api/admin/ideas/${ideaId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ideas'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ideas-stats'] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
    },
  });
}

// Opening statistics
export type AnalyticsPeriod = 7 | 30 | 90;

export interface AppAnalytics {
  period_days: number;
  period_start: string;
  period_end: string;
  timezone: string;
  tracking_since: string;
  total_opens: number;
  period_opens: number;
  apps_opened: number;
  apps: { id: string; title: string; status: string; total_opens: number; period_opens: number; upvotes: number; comments: number }[];
  daily: { date: string; opens: number }[];
}

export function useAppAnalytics(days: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['admin-app-analytics', days],
    queryFn: () => adminApi.get<AppAnalytics>(`/api/admin/analytics?days=${days}`),
    refetchInterval: 60_000,
  });
}

/** A change a maker proposed to a listed app, next to what is listed now (list_changes over MCP). */
export interface AppChange {
  id: string;
  title: string;
  url: string;
  status: string;
  page: string;
  listed: Record<string, string | null>;
  proposed: {
    at?: string;
    fields: Record<string, string | null>;
    category_ids?: string[];
    curriculum_ids?: string[];
    note?: string;
  };
}

export function useAdminChanges(enabled = true) {
  return useQuery({ queryKey: ['admin-changes'], queryFn: () => adminApi.get<AppChange[]>('/api/admin/changes'), enabled });
}

export function useReviewChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appId, approve, reason }: { appId: string; approve: boolean; reason?: string }) =>
      adminApi.post(`/api/admin/apps/${appId}/change`, { approve, ...(reason ? { reason } : {}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-changes'] });
      invalidateApps(queryClient);
    },
  });
}
