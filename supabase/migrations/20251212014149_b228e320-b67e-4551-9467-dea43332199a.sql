-- Create function to increment clicks securely
CREATE OR REPLACE FUNCTION public.increment_clicks(app_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE apps SET clicks_count = COALESCE(clicks_count, 0) + 1 WHERE id = app_id;
END;
$$;