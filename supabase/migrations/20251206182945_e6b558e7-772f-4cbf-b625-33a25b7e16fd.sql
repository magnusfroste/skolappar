-- Add clicks_count column to apps table
ALTER TABLE public.apps ADD COLUMN clicks_count integer DEFAULT 0;