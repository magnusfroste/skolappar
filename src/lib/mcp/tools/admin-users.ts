import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireAuth, supabaseForUser, ok, fail } from "../supabase";

export default defineTool({
  name: "admin_users",
  title: "Användaröversikt",
  description:
    "Adminrapport: alla konton med e-post, inloggningsmetod (google eller email), roller, antal idéer och personens appar med status, öppningar och röster. Samma data som sidan Användare i admin. E-postadresser är privata och visas bara här.",
  inputSchema: {
    search: z.string().trim().min(1).optional().describe("Filtrerar på visningsnamn eller e-post."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search }, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("admin_user_overview" as never);
    if (error) return fail("Kunde inte läsa användaröversikten. Verktyget kräver adminbehörighet.");
    let users = (data as unknown as Array<Record<string, unknown>>) ?? [];
    if (search) {
      const q = search.toLowerCase();
      users = users.filter((u) =>
        `${u.display_name ?? ""} ${u.email ?? ""}`.toLowerCase().includes(q),
      );
    }
    return ok(users);
  },
});
