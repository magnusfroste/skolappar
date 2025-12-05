-- Create settings table for app-wide settings
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Settings are publicly readable"
ON public.settings
FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can manage settings"
ON public.settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default setting
INSERT INTO public.settings (key, value) VALUES ('show_filters', 'false');