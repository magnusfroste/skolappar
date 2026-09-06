import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "create_idea",
  title: "Skapa app-idé",
  description: "Lägg till en ny app-idé i community-listan.",
  inputSchema: {
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().min(5).max(5000),
    target_age: z.string().trim().max(60).optional(),
    target_subject: z.string().trim().max(60).optional(),
    status: z.enum(["open", "claimed", "built"]).optional(),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ title, description, target_age, target_subject, status }, ctx) => {
    requireAuth(ctx);
    const { data, error } = await supabaseForUser(ctx)
      .from("ideas")
      .insert({
        title,
        description,
        target_age: target_age ?? null,
        target_subject: target_subject ?? null,
        status: status ?? "open",
        user_id: ctx.getUserId() as string,
      })
      .select()
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail("Idén kunde inte skapas.");
    return ok(data);
  },
});
