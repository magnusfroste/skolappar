import { auth, defineMcp } from "@lovable.dev/mcp-js";

import listApps from "./tools/list-apps";
import getApp from "./tools/get-app";
import createApp from "./tools/create-app";
import updateApp from "./tools/update-app";
import deleteApp from "./tools/delete-app";
import listIdeas from "./tools/list-ideas";
import updateIdea from "./tools/update-idea";
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

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "skolappar",
  title: "skolappar",
  version: "1.0.0",
  instructions:
    "Verktyg för att sköta skolappar.com – hela administrationen. Du agerar som den inloggade användaren och får dennes behörigheter (adminverktyg kräver adminroll). Börja med platform_stats för en översikt, list_apps för moderering (status pending → approved/featured/rejected/delisted), list_ideas för community-idéer, list_resources/upsert_resource för kunskapsartiklar i Markdown, list_categories för kategori-id:n, list_settings/set_setting för varumärke, tema, typsnitt, SEO/AEO och startsidans sektioner, samt list_users/set_user_role för behörigheter. All text på plattformen är på svenska – skriv innehåll på svenska.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    platformStats,
    listApps,
    getApp,
    createApp,
    updateApp,
    deleteApp,
    listIdeas,
    updateIdea,
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
