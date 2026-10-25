ALTER POLICY "Profiler är publikt synliga" ON public.profiles USING (
  id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.apps a WHERE a.user_id = profiles.id AND a.status IN ('approved', 'featured'))
  OR EXISTS (SELECT 1 FROM public.ideas i WHERE i.user_id = profiles.id OR i.claimed_by = profiles.id)
  OR EXISTS (SELECT 1 FROM public.comments c JOIN public.apps a ON a.id = c.app_id WHERE c.user_id = profiles.id AND a.status IN ('approved', 'featured'))
  OR EXISTS (SELECT 1 FROM public.idea_comments c WHERE c.user_id = profiles.id)
  OR EXISTS (SELECT 1 FROM public.notifications n WHERE n.from_user_id = profiles.id AND n.user_id = auth.uid())
);
COMMENT ON POLICY "Profiler är publikt synliga" ON public.profiles IS 'Own/admin access and public contributors only; non-contributing account profiles are not publicly enumerable.';