import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "set_user_role",
  title: "Ge eller ta bort roll",
  description: "Ge en användare rollen admin/moderator/user, eller ta bort rollen. Kräver adminbehörighet.",
  inputSchema: {
    user_id: z.string().uuid(),
    role: z.enum(["admin", "moderator", "user"]),
    action: z.enum(["grant", "revoke"]).default("grant"),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ user_id, role, action }, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    if (action === "revoke") {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
      return error ? fail(error.message) : ok({ user_id, role, revoked: true });
    }
    const { data, error } = await supabase
      .from("user_roles")
      .upsert({ user_id, role }, { onConflict: "user_id,role" })
      .select()
      .maybeSingle();
    return error ? fail(error.message) : ok(data ?? { user_id, role, granted: true });
  },
});
