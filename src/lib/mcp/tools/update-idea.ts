import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "update_idea",
  title: "Uppdatera app-idé",
  description: "Redigera en idé eller ändra dess status (öppen, påbörjad, byggd).",
  inputSchema: {
    id: z.string().uuid(),
    title: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().min(5).max(5000).optional(),
    target_age: z.string().trim().max(60).optional(),
    target_subject: z.string().trim().max(60).optional(),
    status: z.enum(["open", "claimed", "built"]).optional(),
    built_app_id: z.string().uuid().optional(),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ id, ...fields }, ctx) => {
    requireAuth(ctx);
    const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    if (!Object.keys(patch).length) return fail("Inget att uppdatera.");
    const { data, error } = await supabaseForUser(ctx).from("ideas").update(patch).eq("id", id).select().maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail("Idén hittades inte eller saknar behörighet.");
    return ok(data);
  },
});
