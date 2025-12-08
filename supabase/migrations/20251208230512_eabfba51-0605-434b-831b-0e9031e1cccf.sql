-- Update the check constraint to include 'device' as a valid type
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE public.categories ADD CONSTRAINT categories_type_check 
  CHECK (type IN ('subject', 'age', 'app_type', 'device'));