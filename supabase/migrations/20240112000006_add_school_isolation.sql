/*
# Add School-Based Isolation (Multi-Tenancy)

This migration implements school-based data isolation where users can only see and interact with users from their own school.

## Changes

1. **Helper Functions**
   - `get_user_school_id()` - Returns the school_id of the current authenticated user
   - `is_same_school(uuid)` - Checks if a given user_id belongs to the same school as current user

2. **Row Level Security Policies**
   - Update profiles table policies to enforce school-based isolation
   - Admins can see all users (they manage multiple schools)
   - Principals, Teachers, Students can only see users from their own school

3. **Security Rules**
   - Admins: Full access to all schools
   - Principal: Access only to their assigned school
   - Teachers: Access only to their assigned school
   - Students: Access only to their assigned school

## Notes
- School isolation is enforced at the database level for security
- Admins bypass school isolation to manage all schools
- Users without a school_id cannot see other users (except admins can see them)
*/

-- Helper function to get current user's school_id
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid();
$$;

-- Helper function to check if a user belongs to the same school
CREATE OR REPLACE FUNCTION is_same_school(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.id = auth.uid()
    AND p2.id = user_id
    AND p1.school_id = p2.school_id
    AND p1.school_id IS NOT NULL
  );
$$;

-- Drop existing policies on profiles table
DROP POLICY IF EXISTS "Admins have full access" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile without changing role" ON profiles;

-- Recreate policies with school isolation

-- Policy 1: Admins have full access to all profiles
CREATE POLICY "Admins have full access to all profiles"
ON profiles
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- Policy 2: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 3: Users can view profiles from their own school
CREATE POLICY "Users can view same school profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  NOT is_admin(auth.uid()) 
  AND school_id IS NOT NULL 
  AND school_id = get_user_school_id()
);

-- Policy 4: Users can update their own profile (without changing role or school)
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid())
  AND school_id IS NOT DISTINCT FROM (SELECT school_id FROM profiles WHERE id = auth.uid())
);

-- Policy 5: Admins can insert new profiles
CREATE POLICY "Admins can insert profiles"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Policy 6: Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON profiles
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Policy 7: Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
ON profiles
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Add comment to document the school isolation feature
COMMENT ON FUNCTION get_user_school_id() IS 'Returns the school_id of the currently authenticated user';
COMMENT ON FUNCTION is_same_school(uuid) IS 'Checks if the given user_id belongs to the same school as the current user';
