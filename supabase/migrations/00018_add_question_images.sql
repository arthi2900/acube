/*
# Add Image Support to Questions

## Plain English Explanation
This migration adds image/clip art support to questions in the Question Bank.
Teachers can now add visual elements to their questions to enhance learning and engagement.

## Changes Made

### 1. Table Structure
- Adds `image_url` column to `questions` table
- Type: text (nullable) - stores URL of the image
- Allows teachers to add images from external sources or uploaded files

### 2. Use Cases
- Add diagrams for science questions
- Include charts for math problems
- Add pictures for language learning
- Insert clip art for visual engagement
- Support for educational illustrations

## Notes
- Images are optional (nullable field)
- Supports both external URLs and Supabase Storage URLs
- No changes to RLS policies needed
- Backward compatible with existing questions
*/

-- Add image_url column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url text;

-- Add comment for clarity
COMMENT ON COLUMN questions.image_url IS 'URL of the image/clip art associated with the question. Can be external URL or Supabase Storage URL.';
