import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "list_settings",
  title: "Lista inställningar",
  description: "Läs plattformens inställningar: varumärke, tema, typsnitt, SEO/AEO, analys och startsidans sektioner.",
  inputSchema: { key_prefix: z.string().trim().min(1).optional() },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ key_prefix }, ctx) => {
    requireAuth(ctx);
    let query = supabaseForUser(ctx).from("settings").select("key,value,updated_at").order("key");
    if (key_prefix) query = query.like("key", `${key_prefix}%`);
    const { data, error } = await query;
    return error ? fail(error.message) : ok(data);
  },
});
