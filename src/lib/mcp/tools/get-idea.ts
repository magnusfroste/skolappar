import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "get_idea",
  title: "Hämta app-idé",
  description: "Hämta alla detaljer om en enskild app-idé.",
  inputSchema: { id: z.string().uuid() },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    requireAuth(ctx);
    const { data, error } = await supabaseForUser(ctx)
      .from("ideas")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail("Idén hittades inte.");
    return ok(data);
  },
});
