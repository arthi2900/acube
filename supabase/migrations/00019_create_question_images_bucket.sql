/*
# Create Storage Bucket for Question Images

## Plain English Explanation
This migration creates a Supabase Storage bucket for storing question images uploaded by teachers.
Teachers can upload images directly from their local drive instead of using external URLs.

## Changes Made

### 1. Storage Bucket
- Creates bucket: `app-85wc5xzx8yyp_question_images`
- Public access: true (images can be viewed without authentication)
- File size limit: 1MB (1048576 bytes)
- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

### 2. Storage Policies
- INSERT policy: Authenticated users can upload images
- SELECT policy: Anyone can view images (public access)
- UPDATE policy: Authenticated users can update their own images
- DELETE policy: Authenticated users can delete their own images

## Notes
- Bucket name follows convention: {APP_ID}_{BUSINESS_NAME}
- 1MB file size limit enforced at bucket level
- Frontend must also validate file size before upload
- Images are publicly accessible for display in questions
*/

-- Create storage bucket for question images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-85wc5xzx8yyp_question_images',
  'app-85wc5xzx8yyp_question_images',
  true,
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload question images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-85wc5xzx8yyp_question_images');

-- Policy: Allow public access to view images
CREATE POLICY "Public access to view question images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-85wc5xzx8yyp_question_images');

-- Policy: Allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'app-85wc5xzx8yyp_question_images' AND owner::text = auth.uid()::text);

-- Policy: Allow authenticated users to delete their own images
CREATE POLICY "Authenticated users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'app-85wc5xzx8yyp_question_images' AND owner::text = auth.uid()::text);
