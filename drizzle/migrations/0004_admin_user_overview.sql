CREATE OR REPLACE FUNCTION public.admin_user_overview()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', u.id, 'email', u.email, 'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at,
      'display_name', p.display_name, 'avatar_url', p.avatar_url,
      'is_admin', public.has_role(u.id, 'admin'),
      'ideas_count', (SELECT count(*) FROM ideas i WHERE i.user_id = u.id),
      'apps', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', a.id, 'title', a.title, 'status', a.status,
          'clicks', COALESCE(a.clicks_count,0), 'upvotes', COALESCE(a.upvotes_count,0), 'created_at', a.created_at)
          ORDER BY a.created_at DESC) FROM apps a WHERE a.user_id = u.id), '[]'::jsonb)
    ) ORDER BY u.created_at DESC)
    FROM auth.users u LEFT JOIN profiles p ON p.id = u.id
  ), '[]'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.admin_user_overview() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_user_overview() TO authenticated;