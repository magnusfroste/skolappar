import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "list_comments",
  title: "Lista kommentarer",
  description: "Lista de senaste kommentarerna på appar och idéer för moderering.",
  inputSchema: {
    source: z.enum(["apps", "ideas", "both"]).default("both"),
    limit: z.number().int().min(1).max(100).default(25),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ source, limit }, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    const result: Record<string, unknown> = {};
    if (source !== "ideas") {
      const { data, error } = await supabase
        .from("comments")
        .select("id,app_id,user_id,content,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return fail(error.message);
      result.app_comments = data;
    }
    if (source !== "apps") {
      const { data, error } = await supabase
        .from("idea_comments")
        .select("id,idea_id,user_id,content,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return fail(error.message);
      result.idea_comments = data;
    }
    return ok(result);
  },
});
