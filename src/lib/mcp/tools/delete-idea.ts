import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "delete_idea",
  title: "Ta bort app-idé",
  description: "Radera en app-idé permanent.",
  inputSchema: { id: z.string().uuid() },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    requireAuth(ctx);
    const { error } = await supabaseForUser(ctx).from("ideas").delete().eq("id", id);
    return error ? fail(error.message) : ok({ deleted: id });
  },
});
