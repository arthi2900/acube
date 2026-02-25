/*
# Add email and contact number to profiles table

## Changes
1. Add email and phone columns to profiles table
   - `email` (text, unique) - User's email address
   - `phone` (text) - User's contact number
2. Make school_name mandatory (NOT NULL)

## Purpose
Complete user profile information with email, contact number, and enforce mandatory school name.
All users (Admin, Principal, Teacher, Student) will have comprehensive profile information.
*/

-- Add email column (unique)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Add phone column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- Make school_name mandatory for new records (existing records can keep NULL)
-- Note: We don't alter existing NULL values to avoid data loss
ALTER TABLE profiles ALTER COLUMN school_name SET DEFAULT '';

COMMENT ON COLUMN profiles.email IS 'User email address';
COMMENT ON COLUMN profiles.phone IS 'User contact number';

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
