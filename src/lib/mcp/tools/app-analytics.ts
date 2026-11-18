import { defineTool } from '@lovable.dev/mcp-js';
import { z } from 'zod';
import { requireAuth, supabaseForUser, ok, fail } from '../supabase';
import { readAppAnalytics, type AnalyticsPeriod } from '../../appAnalytics';

export default defineTool({
  name: 'app_analytics',
  title: 'Apparnas öppningsstatistik',
  description: 'Adminrapport: appöppningar för 7, 30 eller 90 UTC-kalenderdagar, daglig utveckling och upp till 100 appar sorterade efter öppningar. Samma rapport som Statistik i admin. Öppningar är inte unika besökare eller sidvisningar. Äldre klick ingår bara i total_opens; tidsserien börjar 18 november 2026. Lovables besöksanalys och Google Analytics ingår inte.',
  inputSchema: { days: z.union([z.literal(7), z.literal(30), z.literal(90)]).default(7).describe('Antal UTC-kalenderdagar inklusive idag.') },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days }, ctx) => {
    requireAuth(ctx);
    try {
      return ok(await readAppAnalytics(supabaseForUser(ctx), days as AnalyticsPeriod));
    } catch {
      return fail('Kunde inte läsa statistiken. Rapporten kräver en anslutning med adminbehörighet.');
    }
  },
});