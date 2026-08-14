GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON public.apps, public.app_categories, public.categories, public.comments,
  public.idea_comments, public.idea_upvotes, public.ideas, public.profiles,
  public.resources, public.settings, public.upvotes TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.apps, public.app_categories, public.categories,
  public.comments, public.idea_comments, public.idea_upvotes, public.ideas, public.notifications,
  public.profiles, public.resources, public.settings, public.upvotes TO authenticated;

GRANT SELECT ON public.user_roles TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;