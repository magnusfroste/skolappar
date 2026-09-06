import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "list_apps",
  title: "Lista appar",
  description: "Lista appar på skolappar, med filter på status, sökord och sortering.",
  inputSchema: {
    status: z.enum(["pending", "approved", "rejected", "featured", "delisted"]).optional(),
    search: z.string().trim().min(1).optional().describe("Fritext i titel/beskrivning."),
    limit: z.number().int().min(1).max(100).default(25),
    order_by: z.enum(["created_at", "upvotes_count", "clicks_count", "comments_count"]).default("created_at"),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ status, search, limit, order_by }, ctx) => {
    requireAuth(ctx);
    let query = supabaseForUser(ctx)
      .from("apps")
      .select("id,title,description,url,image_url,status,is_featured,upvotes_count,comments_count,clicks_count,delist_reason,user_id,created_at")
      .order(order_by, { ascending: false })
      .limit(limit);
    if (status) query = query.eq("status", status);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    const { data, error } = await query;
    return error ? fail(error.message) : ok(data);
  },
});
