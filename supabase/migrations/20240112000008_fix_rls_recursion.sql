/*
# Fix RLS Policy Recursion Issue

## Problem
The current RLS policies cause infinite recursion because they query the profiles
table while checking permissions on the profiles table itself.

## Solution
Use security definer functions to break the recursion chain. These functions
run with elevated privileges and don't trigger RLS checks.

## Changes
1. Create security definer functions to get user role and school
2. Update RLS policies to use these functions instead of subqueries
3. Avoid querying profiles table within profiles RLS policies

## Security Notes
- Functions use SECURITY DEFINER to bypass RLS during permission checks
- Functions are read-only and cannot modify data
- Only return minimal information needed for access control
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Principals can view teachers and students in their school" ON profiles;
DROP POLICY IF EXISTS "Teachers can view students in their school" ON profiles;

-- Create security definer function to get current user's role
-- This function bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Update get_user_school_id to use SECURITY DEFINER
DROP FUNCTION IF EXISTS get_user_school_id();
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid();
$$;

-- Create new policies using security definer functions
-- These policies don't query profiles table directly, avoiding recursion

-- Policy: Principals can view teachers and students from their school
CREATE POLICY "Principals can view teachers and students in their school"
ON profiles
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'principal'
  AND school_id IS NOT NULL
  AND school_id = get_user_school_id()
  AND role IN ('teacher', 'student')
);

-- Policy: Teachers can view students from their school
CREATE POLICY "Teachers can view students in their school"
ON profiles
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'teacher'
  AND school_id IS NOT NULL
  AND school_id = get_user_school_id()
  AND role = 'student'
);

-- Add helpful comments
COMMENT ON FUNCTION get_user_role() IS 
  'Returns the role of the currently authenticated user. Uses SECURITY DEFINER to avoid RLS recursion.';

COMMENT ON FUNCTION get_user_school_id() IS 
  'Returns the school_id of the currently authenticated user. Uses SECURITY DEFINER to avoid RLS recursion.';
