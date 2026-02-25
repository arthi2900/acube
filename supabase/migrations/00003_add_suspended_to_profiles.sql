/*
# Add suspended status to profiles table

## Changes
1. Add suspended column to profiles table
   - `suspended` (boolean, default: false) - Indicates if the user account is suspended

## Purpose
Allow administrators to suspend user accounts, preventing them from accessing the system.
Suspended users will be shown in a separate view for easy management.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN profiles.suspended IS 'Indicates if the user account is suspended';

-- Create index for faster filtering of suspended users
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(suspended);
