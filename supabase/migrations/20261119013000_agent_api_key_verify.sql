DROP TABLE IF EXISTS public.agent_key_sessions;

CREATE OR REPLACE FUNCTION public.revoke_agent_api_key(key_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Endast admin'; END IF;
  UPDATE public.agent_api_keys SET revoked_at = now() WHERE id = key_id AND revoked_at IS NULL;
END $$;

-- Returns the key owner only when the key is valid and the owner is still admin.
CREATE OR REPLACE FUNCTION public.verify_agent_api_key(raw_key text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions' AS $$
DECLARE k record;
BEGIN
  SELECT id, user_id INTO k FROM public.agent_api_keys
   WHERE key_hash = encode(extensions.digest(raw_key, 'sha256'), 'hex')
     AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now());
  IF k.id IS NULL OR NOT public.has_role(k.user_id, 'admin') THEN RETURN NULL; END IF;
  UPDATE public.agent_api_keys SET last_used_at = now() WHERE id = k.id;
  RETURN k.user_id;
END $$;
REVOKE ALL ON FUNCTION public.verify_agent_api_key(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_agent_api_key(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_agent_api_key(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_agent_api_key(uuid) TO authenticated;
