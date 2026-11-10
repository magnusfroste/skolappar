DROP POLICY IF EXISTS "Upvotes är publikt synliga" ON public.upvotes;
CREATE POLICY "Användare ser sina egna röster" ON public.upvotes FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Idea upvotes är publikt synliga" ON public.idea_upvotes;
CREATE POLICY "Användare ser sina egna idéröster" ON public.idea_upvotes FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Kommentarer är publikt synliga" ON public.comments;
CREATE POLICY "Kommentarer på synliga appar är publika" ON public.comments FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.apps a WHERE a.id = comments.app_id
      AND (a.status IN ('approved'::app_status,'featured'::app_status) OR a.user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "App-kategorier är publikt synliga" ON public.app_categories;
CREATE POLICY "Kategorier för synliga appar är publika" ON public.app_categories FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.apps a WHERE a.id = app_categories.app_id
      AND (a.status IN ('approved'::app_status,'featured'::app_status) OR a.user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Idékommentarer är publikt synliga" ON public.idea_comments;
CREATE POLICY "Idékommentarer på befintliga idéer är publika" ON public.idea_comments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.ideas i WHERE i.id = idea_comments.idea_id));