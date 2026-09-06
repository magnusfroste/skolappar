import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "get_app",
  title: "Hämta app",
  description: "Hämta en app med kategorier och kommentarer.",
  inputSchema: { id: z.string().uuid() },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    const [app, cats, comments] = await Promise.all([
      supabase.from("apps").select("*").eq("id", id).maybeSingle(),
      supabase.from("app_categories").select("category_id,categories(name,slug,type)").eq("app_id", id),
      supabase.from("comments").select("id,user_id,content,created_at").eq("app_id", id).order("created_at", { ascending: false }),
    ]);
    if (app.error) return fail(app.error.message);
    if (!app.data) return fail("Appen hittades inte.");
    return ok({ app: app.data, categories: cats.data ?? [], comments: comments.data ?? [] });
  },
});
