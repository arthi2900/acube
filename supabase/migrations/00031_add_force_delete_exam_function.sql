/*
# Add Force Delete Exam Function

## 1. Purpose
Create a secure RPC function that allows Principals and Admins to force delete exams
even when students have attempted them. This will cascade delete all related data:
- Exam record
- All exam attempts
- All exam answers
- All result data

## 2. Security
- Only accessible by users with 'principal' or 'admin' role
- Uses SECURITY DEFINER to bypass RLS policies
- Validates user role before execution
- Returns error if user is not authorized

## 3. Function Details
- Name: force_delete_exam
- Parameters: exam_id (uuid)
- Returns: jsonb with success status and message
- Security: DEFINER (runs with function owner's privileges)

## 4. Cascade Delete Order
1. exam_answers (via exam_attempts FK cascade)
2. exam_attempts (via exams FK cascade)
3. exams (main record)

Note: The ON DELETE CASCADE constraints in the schema will automatically
handle the deletion of related records.
*/

-- Create force delete exam function for Principal/Admin only
CREATE OR REPLACE FUNCTION force_delete_exam(exam_id uuid)
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

  -- Check if exam exists
  SELECT EXISTS(SELECT 1 FROM exams WHERE id = exam_id) INTO exam_exists;
  
  IF NOT exam_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Exam not found'
    );
  END IF;

  -- Get attempt count for logging
  SELECT COUNT(*) INTO attempts_count
  FROM exam_attempts
  WHERE exam_id = force_delete_exam.exam_id;

  -- Delete the exam (CASCADE will handle related records)
  DELETE FROM exams WHERE id = exam_id;

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
'Force delete an exam and all related data (attempts, answers, results). Only accessible by Principal and Admin roles. Requires explicit confirmation in the UI.';
