/*
# Add school_name to profiles table

## Changes
1. Add school_name column to profiles table
   - `school_name` (text, nullable) - Name of the school/institution the user belongs to

## Purpose
Allow users to specify their school/institution affiliation for better organization and filtering.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school_name text;

COMMENT ON COLUMN profiles.school_name IS 'Name of the school or institution the user belongs to';
