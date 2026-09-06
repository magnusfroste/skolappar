import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "list_users",
  title: "Lista användare",
  description: "Lista profiler med deras roller (admin, moderator, user).",
  inputSchema: {
    search: z.string().trim().min(1).optional().describe("Sök i visningsnamn."),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("profiles")
      .select("id,display_name,avatar_url,bio,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (search) query = query.ilike("display_name", `%${search}%`);
    const { data: profiles, error } = await query;
    if (error) return fail(error.message);
    const { data: roles } = await supabase.from("user_roles").select("user_id,role");
    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role]);
    }
    return ok((profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] })));
  },
});
