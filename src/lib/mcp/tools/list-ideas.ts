import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "list_ideas",
  title: "Lista app-idéer",
  description: "Lista community-idéer med status öppen/påbörjad/byggd.",
  inputSchema: {
    status: z.enum(["open", "claimed", "built"]).optional(),
    search: z.string().trim().min(1).optional(),
    limit: z.number().int().min(1).max(100).default(25),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ status, search, limit }, ctx) => {
    requireAuth(ctx);
    let query = supabaseForUser(ctx)
      .from("ideas")
      .select("id,title,description,status,target_age,target_subject,upvotes_count,comments_count,claimed_by,built_app_id,user_id,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status) query = query.eq("status", status);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    const { data, error } = await query;
    return error ? fail(error.message) : ok(data);
  },
});
