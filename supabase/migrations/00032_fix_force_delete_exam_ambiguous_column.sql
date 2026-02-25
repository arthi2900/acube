/*
# Fix Force Delete Exam Function - Resolve Ambiguous Column Reference

## 1. Issue
The force_delete_exam function has an ambiguous column reference error.
Line: WHERE exam_id = force_delete_exam.exam_id
Problem: Both exam_attempts table and function parameter have 'exam_id'

## 2. Solution
Explicitly qualify all column references with table names to avoid ambiguity:
- exam_attempts.exam_id (table column)
- exams.id (table column)
- Use parameter name directly without qualification

## 3. Changes
- Fixed ambiguous reference in attempt count query
- Fixed ambiguous reference in delete query
- Added explicit table name qualifications
*/

-- Drop and recreate the function with fixed column references
DROP FUNCTION IF EXISTS force_delete_exam(uuid);

CREATE OR REPLACE FUNCTION force_delete_exam(p_exam_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role user_role;
  exam_exists boolean;
  attempts_count integer;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();

  -- Check if user is Principal or Admin
  IF current_user_role NOT IN ('principal'::user_role, 'admin'::user_role) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Unauthorized: Only Principals and Admins can force delete exams'
    );
  END IF;

  -- Check if exam exists (explicitly qualify column)
  SELECT EXISTS(SELECT 1 FROM exams WHERE exams.id = p_exam_id) INTO exam_exists;
  
  IF NOT exam_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Exam not found'
    );
  END IF;

  -- Get attempt count for logging (explicitly qualify column)
  SELECT COUNT(*) INTO attempts_count
  FROM exam_attempts
  WHERE exam_attempts.exam_id = p_exam_id;

  -- Delete the exam (CASCADE will handle related records)
  -- Explicitly qualify column to avoid ambiguity
  DELETE FROM exams WHERE exams.id = p_exam_id;

  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Exam and all associated data deleted successfully',
    'attempts_deleted', attempts_count
  );
END;
$$;

-- Grant execute permission to authenticated users
-- (The function itself will check for proper role)
GRANT EXECUTE ON FUNCTION force_delete_exam(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION force_delete_exam(uuid) IS 
'Force delete an exam and all related data (attempts, answers, results). Only accessible by Principal and Admin roles. Requires explicit confirmation in the UI. Fixed ambiguous column reference issue.';
