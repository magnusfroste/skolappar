import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "list_categories",
  title: "Lista kategorier",
  description: "Lista alla kategorier (ämne, ålder, typ, enhet) med id att använda vid app-uppdateringar.",
  inputSchema: { type: z.string().trim().min(1).optional() },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ type }, ctx) => {
    requireAuth(ctx);
    let query = supabaseForUser(ctx)
      .from("categories")
      .select("id,name,slug,type,description,icon,color,sort_order")
      .order("type")
      .order("sort_order");
    if (type) query = query.eq("type", type);
    const { data, error } = await query;
    return error ? fail(error.message) : ok(data);
  },
});
