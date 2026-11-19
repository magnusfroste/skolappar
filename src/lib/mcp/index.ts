import { auth, defineMcp } from "@lovable.dev/mcp-js";

import { tools } from "./tools";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "skolappar-com",
  title: "skolappar-com",
  version: "1.0.0",
  instructions:
    "Verktyg för att sköta skolappar.com – hela administrationen. Du agerar som den inloggade användaren och får dennes behörigheter (adminverktyg kräver adminroll). Börja med platform_stats för en översikt, list_apps för moderering (status pending → approved/featured/rejected/delisted), list_ideas för community-idéer, list_resources/upsert_resource för kunskapsartiklar i Markdown, list_categories för kategori-id:n, list_settings/set_setting för varumärke, tema, typsnitt, SEO/AEO och startsidans sektioner, samt list_users/set_user_role för behörigheter. admin_users ger hela adminöversikten av konton: e-post, inloggningsmetod (google eller email), roller, idéer och personens appar med status och öppningar. Kategorisering: varje app ska ha exakt en kategori av varje typ – subject (Matte, STEM, Språk, Samhälle, Kreativt), age (F (4–6 år), FK–2, 3–6, 7–9) och app_type (Spel, Öva, Verktyg). Startsidans filter bygger på dessa, så en app utan rätt kategorier blir osynlig för sina användare. När en inlämnad app saknar eller har fel kategorier: hämta id:n med list_categories och rätta med update_app (category_ids ersätter samtliga). Appbilder: bilden ska ge ett tydligt visuellt intryck av vad spelet/appen handlar om – ju bättre man ser själva spelet, desto bättre effekt. Håll bilden enkel utan för många detaljer, och lägg aldrig in appens namn, årskurs eller kategori i bilden – det visas redan på kortet. All text på plattformen är på svenska – skriv innehåll på svenska.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools,
});
