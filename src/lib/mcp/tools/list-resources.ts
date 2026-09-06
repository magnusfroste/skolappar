import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "list_resources",
  title: "Lista resurser",
  description: "Lista kunskapsartiklar (resurser), inklusive opublicerade för admin.",
  inputSchema: {
    category: z.string().trim().min(1).optional(),
    include_unpublished: z.boolean().default(true),
    with_content: z.boolean().default(false),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ category, include_unpublished, with_content, limit }, ctx) => {
    requireAuth(ctx);
    const columns = with_content
      ? "id,title,slug,excerpt,content,category,icon,sort_order,is_published,updated_at"
      : "id,title,slug,excerpt,category,icon,sort_order,is_published,updated_at";
    let query = supabaseForUser(ctx).from("resources").select(columns).order("sort_order").limit(limit);
    if (category) query = query.eq("category", category);
    if (!include_unpublished) query = query.eq("is_published", true);
    const { data, error } = await query;
    return error ? fail(error.message) : ok(data);
  },
});
