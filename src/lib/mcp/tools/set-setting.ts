import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "set_setting",
  title: "Ändra inställning",
  description: "Skriv en plattformsinställning (varumärke, tema, typsnitt, SEO/AEO, analys, startsidans sektioner). Värdet är JSON.",
  inputSchema: {
    key: z.string().trim().min(1).max(120),
    value: z.union([z.string(), z.number(), z.boolean(), z.record(z.unknown()), z.array(z.unknown()), z.null()]),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ key, value }, ctx) => {
    requireAuth(ctx);
    const { data, error } = await supabaseForUser(ctx)
      .from("settings")
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select()
      .maybeSingle();
    if (error) return fail(error.message);
    return ok(data ?? { key, value });
  },
});
