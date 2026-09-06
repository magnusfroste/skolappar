import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "claim_idea",
  title: "Ta an eller släpp app-idé",
  description:
    "Markera en idé som påbörjad av den inloggade användaren, eller släpp den tillbaka som öppen.",
  inputSchema: {
    id: z.string().uuid(),
    release: z.boolean().optional().describe("Sätt true för att släppa idén som öppen igen."),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ id, release }, ctx) => {
    requireAuth(ctx);
    const patch = release
      ? { claimed_by: null, claimed_at: null, status: "open" }
      : { claimed_by: ctx.getUserId() as string, claimed_at: new Date().toISOString(), status: "claimed" };
    const { data, error } = await supabaseForUser(ctx)
      .from("ideas")
      .update(patch)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail("Idén hittades inte eller saknar behörighet.");
    return ok(data);
  },
});
