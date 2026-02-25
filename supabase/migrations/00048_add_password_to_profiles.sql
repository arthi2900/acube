-- Add password column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- Create index for password lookups (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_password ON profiles(password);