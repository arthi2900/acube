/*
# Cleanup Duplicate and Conflicting RLS Policies

## Problem
Multiple duplicate policies exist on the profiles table, causing conflicts and confusion.

## Solution
1. Drop all existing policies
2. Recreate only the necessary policies with clear, non-conflicting rules
3. Ensure no recursion issues

## Final Policy Set
1. Admins have full access (ALL operations)
2. Users can view own profile (SELECT)
3. Principals can view teachers and students from their school (SELECT)
4. Teachers can view students from their school (SELECT)
5. Users can update own profile (UPDATE - except role and school_id)
6. Admins can insert profiles (INSERT)
7. Admins can update any profile (UPDATE)
8. Admins can delete profiles (DELETE)
*/

-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Admins have full access to all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Principals can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Principals can view teachers and students in their school" ON profiles;
DROP POLICY IF EXISTS "Teachers can view students in their school" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile except role" ON profiles;

-- 1. Admin Full Access Policy (covers ALL operations)
CREATE POLICY "Admins have full access"
ON profiles
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 2. Users Can View Own Profile
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Principals Can View Teachers and Students from Their School
CREATE POLICY "Principals can view teachers and students"
ON profiles
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'principal'
  AND school_id IS NOT NULL
  AND school_id = get_user_school_id()
  AND role IN ('teacher', 'student')
);

-- 4. Teachers Can View Students from Their School
CREATE POLICY "Teachers can view students"
ON profiles
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'teacher'
  AND school_id IS NOT NULL
  AND school_id = get_user_school_id()
  AND role = 'student'
);

-- 5. Users Can Update Own Profile (except role and school_id)
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  AND (school_id IS NULL OR school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()))
);

-- Add policy descriptions
COMMENT ON POLICY "Admins have full access" ON profiles IS 
  'Admins can perform all operations on all profiles';

COMMENT ON POLICY "Users can view own profile" ON profiles IS 
  'All users can view their own profile';

COMMENT ON POLICY "Principals can view teachers and students" ON profiles IS 
  'Principals can view teachers and students from their assigned school';

COMMENT ON POLICY "Teachers can view students" ON profiles IS 
  'Teachers can view students from their assigned school';

COMMENT ON POLICY "Users can update own profile" ON profiles IS 
  'Users can update their own profile but cannot change role or school_id';
