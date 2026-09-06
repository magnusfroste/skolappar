import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "delete_comment",
  title: "Ta bort kommentar",
  description: "Moderera bort en kommentar på en app eller en idé.",
  inputSchema: {
    id: z.string().uuid(),
    source: z.enum(["app", "idea"]).default("app"),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ id, source }, ctx) => {
    requireAuth(ctx);
    const table = source === "idea" ? "idea_comments" : "comments";
    const { error } = await supabaseForUser(ctx).from(table).delete().eq("id", id);
    return error ? fail(error.message) : ok({ deleted: id, source });
  },
});
