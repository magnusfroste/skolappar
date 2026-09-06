import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "update_app",
  title: "Uppdatera app",
  description: "Uppdatera en app: innehåll, status (godkänn/avslå/utvald/avlista), utvald-flagga och kategorier.",
  inputSchema: {
    id: z.string().uuid(),
    title: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().min(5).max(500).optional(),
    long_description: z.string().trim().max(10000).optional(),
    url: z.string().url().optional(),
    image_url: z.string().url().optional(),
    status: z.enum(["pending", "approved", "rejected", "featured", "delisted"]).optional(),
    is_featured: z.boolean().optional(),
    delist_reason: z.string().trim().max(500).optional(),
    category_ids: z.array(z.string().uuid()).max(20).optional().describe("Ersätter appens kategorier."),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ id, category_ids, ...fields }, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    let app: unknown = null;
    if (Object.keys(patch).length) {
      const { data, error } = await supabase.from("apps").update(patch).eq("id", id).select().maybeSingle();
      if (error) return fail(error.message);
      if (!data) return fail("Appen hittades inte eller saknar behörighet.");
      app = data;
    }
    if (category_ids) {
      await supabase.from("app_categories").delete().eq("app_id", id);
      if (category_ids.length) {
        const { error } = await supabase
          .from("app_categories")
          .insert(category_ids.map((category_id) => ({ app_id: id, category_id })));
        if (error) return fail(error.message);
      }
    }
    return ok({ app, categories_updated: Boolean(category_ids) });
  },
});
