/*
# Refine School Isolation with Role-Based Access Control

This migration refines the school isolation to implement granular role-based access:

## Access Control Matrix

### Principal
- ✅ Can view: Teachers and Students from their school
- ❌ Cannot view: Users from other schools

### Teacher
- ✅ Can view: Students from their school
- ❌ Cannot view: Principal, Other teachers, Users from other schools

### Student
- ✅ Can view: Only their own profile
- ❌ Cannot view: Other students, Teachers, Principal

### Admin
- ✅ Can view: All users from all schools
- ✅ Full management rights

## Changes
1. Drop existing "Users can view same school profiles" policy
2. Create separate policies for each role combination
3. Maintain admin full access
4. Enforce role-based visibility within schools

## Security Notes
- Students have maximum privacy (can only see themselves)
- Teachers can only see their students
- Principals have full visibility within their school
- Admins maintain system-wide access
*/

-- Drop the existing broad school isolation policy
DROP POLICY IF EXISTS "Users can view same school profiles" ON profiles;

-- Policy: Principals can view teachers and students from their school
CREATE POLICY "Principals can view teachers and students in their school"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'principal'
    AND p.school_id IS NOT NULL
    AND profiles.school_id = p.school_id
    AND profiles.role IN ('teacher', 'student')
  )
);

-- Policy: Teachers can view students from their school
CREATE POLICY "Teachers can view students in their school"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'teacher'
    AND p.school_id IS NOT NULL
    AND profiles.school_id = p.school_id
    AND profiles.role = 'student'
  )
);

-- Policy: Students can only view their own profile (already exists as "Users can view own profile")
-- No additional policy needed - the existing "Users can view own profile" policy handles this

-- Add comments to document the refined access control
COMMENT ON POLICY "Principals can view teachers and students in their school" ON profiles IS 
  'Principals have full visibility of teachers and students within their assigned school';

COMMENT ON POLICY "Teachers can view students in their school" ON profiles IS 
  'Teachers can only view students from their school, not other teachers or principals';
