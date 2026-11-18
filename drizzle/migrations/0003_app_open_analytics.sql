CREATE TABLE public.app_open_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  opened_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_open_events TO authenticated;
GRANT ALL ON public.app_open_events TO service_role;
ALTER TABLE public.app_open_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read app opening events" ON public.app_open_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX app_open_events_time_app_idx ON public.app_open_events(opened_at, app_id);

CREATE OR REPLACE FUNCTION public.increment_clicks(app_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.apps SET clicks_count = COALESCE(clicks_count, 0) + 1
  WHERE id = app_id AND status IN ('approved', 'featured');
  IF FOUND THEN
    INSERT INTO public.app_open_events(app_id) VALUES (app_id);
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.increment_clicks(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_clicks(uuid) TO anon, authenticated;

CREATE FUNCTION public.app_open_analytics(period_days integer DEFAULT 7)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE
  period_start timestamptz;
  period_end timestamptz := now();
  report jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Endast administratörer kan läsa statistiken' USING ERRCODE = '42501';
  END IF;
  IF period_days NOT IN (7, 30, 90) OR period_days IS NULL THEN
    RAISE EXCEPTION 'Välj 7, 30 eller 90 dagar' USING ERRCODE = '22023';
  END IF;
  period_start := ((period_end AT TIME ZONE 'UTC')::date - (period_days - 1))::timestamp AT TIME ZONE 'UTC';
  WITH period_counts AS (
    SELECT e.app_id, count(*) AS opens FROM public.app_open_events e
    WHERE e.opened_at >= period_start AND e.opened_at <= period_end GROUP BY e.app_id
  ), app_rows AS (
    SELECT a.id, a.title, a.status, COALESCE(a.clicks_count, 0) AS total_opens,
      COALESCE(p.opens, 0) AS period_opens, COALESCE(a.upvotes_count, 0) AS upvotes, COALESCE(a.comments_count, 0) AS comments
    FROM public.apps a LEFT JOIN period_counts p ON a.id = p.app_id
  ), daily_counts AS (
    SELECT (e.opened_at AT TIME ZONE 'UTC')::date AS day, count(*) AS opens
    FROM public.app_open_events e WHERE e.opened_at >= period_start AND e.opened_at <= period_end GROUP BY 1
  ), days AS (
    SELECT day::date AS day FROM generate_series((period_start AT TIME ZONE 'UTC')::date::timestamp, (period_end AT TIME ZONE 'UTC')::date::timestamp, interval '1 day') day
  )
  SELECT jsonb_build_object(
    'period_days', period_days, 'period_start', period_start, 'period_end', period_end, 'timezone', 'UTC',
    'tracking_since', '2026-11-18T00:00:00Z',
    'total_opens', (SELECT COALESCE(sum(total_opens), 0) FROM app_rows),
    'period_opens', (SELECT COALESCE(sum(opens), 0) FROM period_counts),
    'apps_opened', (SELECT count(*) FROM period_counts),
    'apps', (SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.period_opens DESC, r.total_opens DESC, r.title), '[]'::jsonb) FROM (SELECT * FROM app_rows ORDER BY period_opens DESC, total_opens DESC, title LIMIT 100) r),
    'daily', (SELECT jsonb_agg(jsonb_build_object('date', d.day, 'opens', COALESCE(c.opens, 0)) ORDER BY d.day) FROM days d LEFT JOIN daily_counts c ON c.day = d.day)
  ) INTO report;
  RETURN report;
END;
$$;
REVOKE ALL ON FUNCTION public.app_open_analytics(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_open_analytics(integer) TO authenticated;
COMMENT ON FUNCTION public.app_open_analytics(integer) IS 'Admin-only opening counts, not unique visitors or page views. UTC calendar days including today; historical totals cannot be assigned to dates. At most 100 ranked apps.';