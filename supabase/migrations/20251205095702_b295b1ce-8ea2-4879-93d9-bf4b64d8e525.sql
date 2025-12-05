-- Create storage bucket for app images
INSERT INTO storage.buckets (id, name, public) VALUES ('app-images', 'app-images', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload app images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'app-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'app-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to app images
CREATE POLICY "Public can view app images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'app-images');