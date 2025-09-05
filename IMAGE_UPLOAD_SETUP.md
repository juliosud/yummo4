# Image Upload Setup Guide

This guide will help you set up image upload functionality for menu items in your restaurant management system.

## Prerequisites

1. **Supabase Project**: You need a Supabase project with the database schema set up
2. **Environment Variables**: Make sure your `.env` file has the correct Supabase credentials

## Setup Steps

### 1. Database Setup

Run the following SQL commands in your Supabase SQL Editor:

```sql
-- First, run the main database setup
-- (Use the existing database-setup.sql file)

-- Then run the storage setup
-- (Use the supabase-storage-setup.sql file)
```

### 2. Storage Bucket Configuration

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Create a new bucket named `restaurant-images`
4. Set the bucket to **Public** (so images can be accessed via URL)
5. Set file size limit to **5MB**
6. Allow these MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`

### 3. Row Level Security (RLS) Policies

The storage setup SQL will create the necessary RLS policies, but you can also set them manually:

1. Go to **Storage** → **Policies** in your Supabase Dashboard
2. Create policies for the `restaurant-images` bucket:

**Public Read Policy:**
```sql
CREATE POLICY "Public read access for restaurant images" ON storage.objects
FOR SELECT USING (bucket_id = 'restaurant-images');
```

**Authenticated Upload Policy:**
```sql
CREATE POLICY "Authenticated users can upload restaurant images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'restaurant-images' 
  AND auth.role() = 'authenticated'
);
```

**Authenticated Update Policy:**
```sql
CREATE POLICY "Authenticated users can update restaurant images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'restaurant-images' 
  AND auth.role() = 'authenticated'
);
```

**Authenticated Delete Policy:**
```sql
CREATE POLICY "Authenticated users can delete restaurant images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'restaurant-images' 
  AND auth.role() = 'authenticated'
);
```

### 4. Environment Variables

Make sure your `.env` file contains:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to the Menu Management section
3. Click "Add New Item"
4. Try uploading an image using the new image upload component
5. Verify the image appears in the menu

## Features

### Image Upload Component
- **Drag & Drop**: Users can drag and drop images onto the upload area
- **File Selection**: Click to browse and select image files
- **Preview**: Real-time preview of selected images
- **Validation**: File type and size validation (max 5MB)
- **Fallback**: URL input as fallback option
- **Error Handling**: Clear error messages for failed uploads

### Supported File Types
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- SVG (.svg)

### File Size Limit
- Maximum file size: 5MB
- Configurable in the storage bucket settings

## Troubleshooting

### Common Issues

1. **"Supabase not configured" error**
   - Check your `.env` file has the correct Supabase credentials
   - Restart your development server after adding environment variables

2. **Upload fails with permission error**
   - Verify RLS policies are set up correctly
   - Check that the user is authenticated
   - Ensure the bucket exists and is public

3. **Images not displaying**
   - Check that the bucket is set to public
   - Verify the image URL is correct
   - Check browser console for CORS errors

4. **File size too large**
   - Reduce image size before uploading
   - Or increase the file size limit in Supabase storage settings

### Debug Steps

1. Open browser developer tools
2. Check the Console tab for error messages
3. Check the Network tab to see if upload requests are failing
4. Verify Supabase storage bucket configuration
5. Test with a small image file first

## Security Considerations

- Images are stored in a public bucket, so they're accessible via URL
- RLS policies control who can upload/delete images
- File type validation prevents malicious file uploads
- File size limits prevent abuse
- Automatic cleanup of orphaned images (when menu items are deleted)

## Customization

### Changing File Size Limit
Update the `maxSize` constant in `src/lib/image-upload.ts`:

```typescript
const maxSize = 10 * 1024 * 1024; // 10MB
```

### Adding More File Types
Update the `allowed_mime_types` in the storage bucket configuration:

```sql
-- Add more MIME types to the bucket
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff']
WHERE id = 'restaurant-images';
```

### Custom Upload Folder
Change the default folder in the upload function:

```typescript
const result = await uploadImage(file, 'custom-folder');
```
