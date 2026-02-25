-- Drop the user-specific policy
DROP POLICY IF EXISTS "Users can view their own login history" ON login_history;

-- Keep only the admin policy
-- (Admin can view all login history policy already exists, no need to recreate)