import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "upsert_category",
  title: "Skapa eller uppdatera kategori",
  description: "Skapa en ny kategori, eller uppdatera en befintlig när id anges.",
  inputSchema: {
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1).max(60).optional(),
    slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(60).optional(),
    type: z.string().trim().min(1).max(40).optional(),
    description: z.string().trim().max(300).optional(),
    icon: z.string().trim().max(60).optional(),
    color: z.string().trim().max(40).optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ id, ...fields }, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    if (id) {
      if (!Object.keys(patch).length) return fail("Inget att uppdatera.");
      const { data, error } = await supabase.from("categories").update(patch).eq("id", id).select().maybeSingle();
      if (error) return fail(error.message);
      if (!data) return fail("Kategorin hittades inte eller saknar behörighet.");
      return ok(data);
    }
    if (!fields.name || !fields.slug || !fields.type) return fail("name, slug och type krävs för en ny kategori.");
    const { data, error } = await supabase
      .from("categories")
      .insert(patch as { name: string; slug: string; type: string })
      .select()
      .single();
    return error ? fail(error.message) : ok(data);
  },
});
