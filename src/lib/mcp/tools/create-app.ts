import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, ok, fail } from "../supabase";

export default defineTool({
  name: "create_app",
  title: "Skapa app",
  description: "Lägg till en ny app i galleriet, valfritt med kategorier.",
  inputSchema: {
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().min(5).max(500),
    url: z.string().url(),
    long_description: z.string().trim().max(10000).optional(),
    image_url: z.string().url().optional().describe(
      "Bild som visas på app-korten. Korten beskär bilden till liggande 4:3-format – använd en attraktiv, ljus bild på minst 800×600 px med motivet centrerat. Bilden ska ge ett tydligt visuellt intryck av vad spelet/appen handlar om – ju bättre man ser själva spelet, desto bättre effekt. Håll den enkel: inte för många detaljer, och lägg INTE in appens namn, årskurs eller kategori i bilden – det visas redan på kortet under bilden. Utelämnas bilden skapas automatiskt en skärmdump av appens url, så lämna hellre tom än en bild i fel format."
    ),
    category_ids: z.array(z.string().uuid()).max(20).optional().describe(
      "Appens kategorier. Ange exakt en av varje typ: subject (Matte, STEM, Språk, Samhälle, Kreativt), age (FS (förskola), FK–2, 3–6, 7–9) och app_type (Spel, Öva, Verktyg). Hämta id:n med list_categories. Utan rätt kategorier syns inte appen i startsidans filter."
    ),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ title, description, url, long_description, image_url, category_ids }, ctx) => {
    requireAuth(ctx);
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("apps")
      .insert({ user_id: ctx.getUserId(), title, description, url, long_description, image_url })
      .select()
      .single();
    if (error) return fail(error.message);
    if (category_ids?.length) {
      const { error: catError } = await supabase
        .from("app_categories")
        .insert(category_ids.map((category_id) => ({ app_id: data.id, category_id })));
      if (catError) return ok({ app: data, category_warning: catError.message });
    }
    return ok({ app: data });
  },
});
