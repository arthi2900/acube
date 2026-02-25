/*
# Add User Approval Workflow

## Purpose
Implement user approval workflow to prevent unauthorized access.
New users must be approved by admin before they can access the system.

## Changes
1. Add `approved` column to profiles table
   - Type: boolean
   - Default: false (new users need approval)
   - Not null

2. Security
   - Existing users are automatically approved (set to true)
   - New signups will have approved = false by default
   - Only admins can approve users

## Implementation Notes
- This prevents unauthorized users from accessing the system
- Admin must explicitly approve each new user
- Three user states: Pending (approved=false), Active (approved=true, suspended=false), Suspended (suspended=true)
*/

-- Add approved column to profiles table
ALTER TABLE profiles 
ADD COLUMN approved boolean DEFAULT false NOT NULL;

-- Set all existing users as approved
UPDATE profiles SET approved = true;

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION is_approved(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.approved = true
  );
$$;

-- Add comment for documentation
COMMENT ON COLUMN profiles.approved IS 'User approval status. New users must be approved by admin before accessing the system.';
