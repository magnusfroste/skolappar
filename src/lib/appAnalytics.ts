import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

const reportSchema = z.object({
  period_days: z.number(), period_start: z.string(), period_end: z.string(),
  timezone: z.string(), tracking_since: z.string(),
  total_opens: z.number(), period_opens: z.number(), apps_opened: z.number(),
  apps: z.array(z.object({
    id: z.string(), title: z.string(), status: z.string(),
    total_opens: z.number(), period_opens: z.number(), upvotes: z.number(), comments: z.number(),
  })),
  daily: z.array(z.object({ date: z.string(), opens: z.number() })),
});

export type AppAnalytics = z.infer<typeof reportSchema>;
export type AnalyticsPeriod = 7 | 30 | 90;

/** Shared report contract for the admin view and caller-scoped MCP tool. */
export async function readAppAnalytics(client: SupabaseClient, days: AnalyticsPeriod) {
  const { data, error } = await client.rpc('app_open_analytics', { period_days: days });
  if (error) throw error;
  return reportSchema.parse(data);
}