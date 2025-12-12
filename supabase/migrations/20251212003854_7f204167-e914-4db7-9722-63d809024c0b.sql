-- Drop the existing check constraint
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_category_check;

-- Add new check constraint with 'platforms' category
ALTER TABLE public.resources ADD CONSTRAINT resources_category_check 
CHECK (category IN ('tips', 'learn', 'inspiration', 'platforms'));