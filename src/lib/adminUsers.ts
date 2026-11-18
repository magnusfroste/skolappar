import { supabase } from '@/integrations/supabase/client';

export type AdminUserApp = { id: string; title: string; status: string; clicks: number; upvotes: number; created_at: string };
export type AdminUser = {
  id: string; email: string | null; created_at: string; last_sign_in_at: string | null;
  display_name: string | null; avatar_url: string | null; is_admin: boolean;
  auth_method: string; providers: string[];
  ideas_count: number; apps: AdminUserApp[];
};

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_user_overview' as never);
  if (error) throw error;
  return (data as unknown as AdminUser[]) ?? [];
}

export const totalClicks = (u: AdminUser) => u.apps.reduce((s, a) => s + a.clicks, 0);
