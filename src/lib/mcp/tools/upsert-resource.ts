import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "upsert_resource",
  title: "Skapa eller uppdatera resurs",
  description: "Skapa en ny kunskapsartikel, eller uppdatera en befintlig när id anges. Innehållet är Markdown.",
  inputSchema: {
    id: z.string().uuid().optional().describe("Utelämna för att skapa en ny resurs."),
    title: z.string().trim().min(2).max(160).optional(),
    slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(160).optional(),
    excerpt: z.string().trim().max(400).optional(),
    content: z.string().trim().max(100000).optional(),
    category: z.string().trim().min(1).max(60).optional(),
    icon: z.string().trim().max(60).optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
    is_published: z.boolean().optional(),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ id, ...fields }, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    if (id) {
      if (!Object.keys(patch).length) return fail("Inget att uppdatera.");
      const { data, error } = await supabase.from("resources").update(patch).eq("id", id).select().maybeSingle();
      if (error) return fail(error.message);
      if (!data) return fail("Resursen hittades inte eller saknar behörighet.");
      return ok(data);
    }
    if (!fields.title || !fields.slug || !fields.content || !fields.category) {
      return fail("title, slug, content och category krävs för en ny resurs.");
    }
    const { data, error } = await supabase
      .from("resources")
      .insert(patch as { title: string; slug: string; content: string; category: string })
      .select()
      .single();
    return error ? fail(error.message) : ok(data);
  },
});
