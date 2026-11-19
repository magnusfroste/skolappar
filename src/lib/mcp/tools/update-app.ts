import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "update_app",
  title: "Uppdatera app",
  description: "Uppdatera en app: innehåll, status (godkänn/avslå/utvald/avlista), utvald-flagga och kategorier.",
  inputSchema: {
    id: z.string().uuid(),
    title: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().min(5).max(500).optional(),
    long_description: z.string().trim().max(10000).optional(),
    url: z.string().url().optional(),
    image_url: z.string().url().optional().describe(
      "Bild som visas på app-korten. Korten beskär bilden till liggande 4:3-format – använd en attraktiv, ljus bild på minst 800×600 px med motivet centrerat. Bilden ska ge ett tydligt visuellt intryck av vad spelet/appen handlar om – ju bättre man ser själva spelet, desto bättre effekt. Håll den enkel: inte för många detaljer, och lägg INTE in appens namn, årskurs eller kategori i bilden – det visas redan på kortet under bilden. Utelämnas bilden skapas automatiskt en skärmdump av appens url, så lämna hellre tom än en bild i fel format."
    ),
    status: z.enum(["pending", "approved", "rejected", "featured", "delisted"]).optional(),
    is_featured: z.boolean().optional(),
    delist_reason: z.string().trim().max(500).optional(),
    category_ids: z.array(z.string().uuid()).max(20).optional().describe(
      "Ersätter appens samtliga kategorier. Appen ska ha exakt en av varje typ: subject (Matte, STEM, Språk, Samhälle, Kreativt), age (F (4–6 år), FK–2, 3–6, 7–9) och app_type (Spel, Öva, Verktyg). Hämta id:n med list_categories. Använd för att rätta appar där inlämnaren missat kategorier – utan dem syns inte appen i startsidans filter."
    ),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ id, category_ids, ...fields }, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    let app: unknown = null;
    if (Object.keys(patch).length) {
      const { data, error } = await supabase.from("apps").update(patch).eq("id", id).select().maybeSingle();
      if (error) return fail(error.message);
      if (!data) return fail("Appen hittades inte eller saknar behörighet.");
      app = data;
    }
    if (category_ids) {
      await supabase.from("app_categories").delete().eq("app_id", id);
      if (category_ids.length) {
        const { error } = await supabase
          .from("app_categories")
          .insert(category_ids.map((category_id) => ({ app_id: id, category_id })));
        if (error) return fail(error.message);
      }
    }
    return ok({ app, categories_updated: Boolean(category_ids) });
  },
});
