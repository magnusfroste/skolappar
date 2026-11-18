CREATE TABLE public.agent_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz
);
GRANT SELECT ON public.agent_api_keys TO authenticated;
GRANT ALL ON public.agent_api_keys TO service_role;
ALTER TABLE public.agent_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read agent keys" ON public.agent_api_keys FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Short-lived session cache, only reachable by the key proxy function.
CREATE TABLE public.agent_key_sessions (
  key_id uuid PRIMARY KEY REFERENCES public.agent_api_keys(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  expires_at timestamptz NOT NULL
);
GRANT ALL ON public.agent_key_sessions TO service_role;
ALTER TABLE public.agent_key_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.create_agent_api_key(key_name text, valid_days integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  raw text;
  new_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Endast admin'; END IF;
  IF key_name IS NULL OR length(trim(key_name)) = 0 OR length(key_name) > 60 THEN RAISE EXCEPTION 'Ogiltigt namn'; END IF;
  IF valid_days IS NOT NULL AND (valid_days < 1 OR valid_days > 3650) THEN RAISE EXCEPTION 'Ogiltig giltighetstid'; END IF;
  raw := 'skol_' || encode(extensions.gen_random_bytes(24), 'hex');
  INSERT INTO public.agent_api_keys(user_id, name, key_prefix, key_hash, expires_at)
  VALUES (auth.uid(), trim(key_name), left(raw, 13), encode(extensions.digest(raw, 'sha256'), 'hex'),
          CASE WHEN valid_days IS NULL THEN NULL ELSE now() + make_interval(days => valid_days) END)
  RETURNING id INTO new_id;
  RETURN jsonb_build_object('id', new_id, 'key', raw);
END $$;

CREATE OR REPLACE FUNCTION public.revoke_agent_api_key(key_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Endast admin'; END IF;
  UPDATE public.agent_api_keys SET revoked_at = now() WHERE id = key_id AND revoked_at IS NULL;
  DELETE FROM public.agent_key_sessions WHERE agent_key_sessions.key_id = revoke_agent_api_key.key_id;
END $$;

REVOKE ALL ON FUNCTION public.create_agent_api_key(text, integer) FROM public, anon;
REVOKE ALL ON FUNCTION public.revoke_agent_api_key(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_agent_api_key(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_agent_api_key(uuid) TO authenticated;