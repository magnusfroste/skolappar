import platformStats from "./tools/platform-stats";
import appAnalytics from "./tools/app-analytics";
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
import adminUsers from "./tools/admin-users";
import setUserRole from "./tools/set-user-role";

/** Every MCP tool – shared by the OAuth server and the API-key endpoint. */
export const tools = [
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
  adminUsers,
  setUserRole,
];
