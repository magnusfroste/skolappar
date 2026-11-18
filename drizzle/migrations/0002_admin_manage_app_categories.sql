CREATE POLICY "Admins can insert app categories" ON public.app_categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete app categories" ON public.app_categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
GRANT SELECT, INSERT, DELETE ON public.app_categories TO authenticated;