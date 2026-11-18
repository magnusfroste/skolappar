import { auth, defineMcp } from "@lovable.dev/mcp-js";

import listApps from "./tools/list-apps";
import getApp from "./tools/get-app";
import createApp from "./tools/create-app";
import updateApp from "./tools/update-app";
import deleteApp from "./tools/delete-app";
import listIdeas from "./tools/list-ideas";
import getIdea from "./tools/get-idea";
import createIdea from "./tools/create-idea";
import updateIdea from "./tools/update-idea";
import claimIdea from "./tools/claim-idea";
import deleteIdea from "./tools/delete-idea";
import listResources from "./tools/list-resources";
import upsertResource from "./tools/upsert-resource";
import deleteResource from "./tools/delete-resource";
import listCategories from "./tools/list-categories";
import upsertCategory from "./tools/upsert-category";
import deleteCategory from "./tools/delete-category";
import listComments from "./tools/list-comments";
import deleteComment from "./tools/delete-comment";
import listSettings from "./tools/list-settings";
import setSetting from "./tools/set-setting";
import listUsers from "./tools/list-users";
import setUserRole from "./tools/set-user-role";
import platformStats from "./tools/platform-stats";
import appAnalytics from "./tools/app-analytics";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "skolappar-com",
  title: "skolappar-com",
  version: "1.0.0",
  instructions:
    "Verktyg för att sköta skolappar.com – hela administrationen. Du agerar som den inloggade användaren och får dennes behörigheter (adminverktyg kräver adminroll). Börja med platform_stats för en översikt, list_apps för moderering (status pending → approved/featured/rejected/delisted), list_ideas för community-idéer, list_resources/upsert_resource för kunskapsartiklar i Markdown, list_categories för kategori-id:n, list_settings/set_setting för varumärke, tema, typsnitt, SEO/AEO och startsidans sektioner, samt list_users/set_user_role för behörigheter. Kategorisering: varje app ska ha exakt en kategori av varje typ – subject (Matte, STEM, Språk, Samhälle, Kreativt), age (F–3, 4–6, 7–9+) och app_type (Spel, Öva, Verktyg). Startsidans filter bygger på dessa, så en app utan rätt kategorier blir osynlig för sina användare. När en inlämnad app saknar eller har fel kategorier: hämta id:n med list_categories och rätta med update_app (category_ids ersätter samtliga). Appbilder: bilden ska ge ett tydligt visuellt intryck av vad spelet/appen handlar om – ju bättre man ser själva spelet, desto bättre effekt. Håll bilden enkel utan för många detaljer, och lägg aldrig in appens namn, ålder eller kategori i bilden – det visas redan på kortet. All text på plattformen är på svenska – skriv innehåll på svenska.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    platformStats,
    appAnalytics,
    listApps,
    getApp,
    createApp,
    updateApp,
    deleteApp,
    listIdeas,
    getIdea,
    createIdea,
    updateIdea,
    claimIdea,
    deleteIdea,
    listResources,
    upsertResource,
    deleteResource,
    listCategories,
    upsertCategory,
    deleteCategory,
    listComments,
    deleteComment,
    listSettings,
    setSetting,
    listUsers,
    setUserRole,
  ],
});
