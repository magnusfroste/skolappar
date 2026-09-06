import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "delete_resource",
  title: "Ta bort resurs",
  description: "Radera en kunskapsartikel permanent.",
  inputSchema: { id: z.string().uuid() },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    requireAuth(ctx);
    const { error } = await supabaseForUser(ctx).from("resources").delete().eq("id", id);
    return error ? fail(error.message) : ok({ deleted: id });
  },
});
