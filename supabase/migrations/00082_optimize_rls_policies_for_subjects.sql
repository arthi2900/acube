
-- Create optimized helper functions for RLS checks
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Drop existing policies on subjects
DROP POLICY IF EXISTS "Principals can manage subjects in their school" ON subjects;
DROP POLICY IF EXISTS "Teachers can view subjects in their school" ON subjects;
DROP POLICY IF EXISTS "Students can view subjects in their school" ON subjects;

-- Create optimized policies using helper functions
CREATE POLICY "Principals can manage subjects in their school"
ON subjects
FOR ALL
TO authenticated
USING (
  get_user_role() = 'principal' AND school_id = get_user_school_id()
);

CREATE POLICY "Teachers can view subjects in their school"
ON subjects
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'teacher' AND school_id = get_user_school_id()
);

CREATE POLICY "Students can view subjects in their school"
ON subjects
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'student' AND school_id = get_user_school_id()
);

-- Add comment
COMMENT ON FUNCTION get_user_school_id() IS 'Optimized function to get current user school_id for RLS policies';
COMMENT ON FUNCTION get_user_role() IS 'Optimized function to get current user role for RLS policies';
