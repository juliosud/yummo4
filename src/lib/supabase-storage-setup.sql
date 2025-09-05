-- Supabase Storage Setup for Restaurant QR Menu & Order System
-- Run these commands in your Supabase SQL editor to set up file storage

-- Create storage bucket for restaurant images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-images',
  'restaurant-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the restaurant-images bucket
-- Allow public read access to all images
CREATE POLICY "Public read access for restaurant images" ON storage.objects
FOR SELECT USING (bucket_id = 'restaurant-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload restaurant images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'restaurant-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update restaurant images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'restaurant-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete restaurant images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'restaurant-images' 
  AND auth.role() = 'authenticated'
);

-- Create a function to automatically clean up orphaned images
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS void AS $$
BEGIN
  -- Delete images that are not referenced in menu_items table
  DELETE FROM storage.objects
  WHERE bucket_id = 'restaurant-images'
    AND name NOT IN (
      SELECT DISTINCT image
      FROM menu_items
      WHERE image IS NOT NULL
        AND image LIKE '%/restaurant-images/%'
    );
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update menu_items when images are deleted
CREATE OR REPLACE FUNCTION handle_image_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Set image to NULL in menu_items when the image file is deleted
  UPDATE menu_items
  SET image = NULL
  WHERE image = OLD.name;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for image deletion
DROP TRIGGER IF EXISTS on_image_deletion ON storage.objects;
CREATE TRIGGER on_image_deletion
  AFTER DELETE ON storage.objects
  FOR EACH ROW
  WHEN (OLD.bucket_id = 'restaurant-images')
  EXECUTE FUNCTION handle_image_deletion();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
