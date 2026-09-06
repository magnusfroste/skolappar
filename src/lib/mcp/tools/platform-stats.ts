import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, requireAuth, ok } from "../supabase";

export default defineTool({
  name: "platform_stats",
  title: "Plattformsöversikt",
  description: "Nyckeltal: antal appar per status, idéer, resurser, användare, röster och klick.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    const count = async (table: string, filter?: { column: string; value: string }) => {
      let q = supabase.from(table).select("*", { count: "exact", head: true });
      if (filter) q = q.eq(filter.column, filter.value);
      const { count: n } = await q;
      return n ?? 0;
    };
    const [apps, pending, approved, featured, delisted, ideas, resources, users, upvotes] = await Promise.all([
      count("apps"),
      count("apps", { column: "status", value: "pending" }),
      count("apps", { column: "status", value: "approved" }),
      count("apps", { column: "status", value: "featured" }),
      count("apps", { column: "status", value: "delisted" }),
      count("ideas"),
      count("resources"),
      count("profiles"),
      count("upvotes"),
    ]);
    const { data: clickRows } = await supabase.from("apps").select("clicks_count");
    const clicks = (clickRows ?? []).reduce((sum, row) => sum + (row.clicks_count ?? 0), 0);
    return ok({
      apps: { total: apps, pending, approved, featured, delisted },
      ideas,
      resources,
      users,
      upvotes,
      clicks,
    });
  },
});
