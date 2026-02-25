-- Migration: Fix Exam Status Issues
-- Purpose: 
--   1. Update submit_exam_attempt to set status to 'evaluated' after calculation
--   2. Create function to auto-submit expired exams stuck in 'in_progress'
-- Fixes:
--   - Issue 1: Status remains 'submitted' instead of 'evaluated'
--   - Issue 2: Exams stuck in 'in_progress' after exam end time

-- ============================================================================
-- Fix 1: Update submit_exam_attempt to set status to 'evaluated'
-- ============================================================================

CREATE OR REPLACE FUNCTION submit_exam_attempt(
  p_attempt_id uuid,
  p_submission_type submission_type DEFAULT 'normal'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status attempt_status;
  v_result jsonb;
BEGIN
  -- Check current status (with row lock to prevent race conditions)
  SELECT status INTO v_current_status
  FROM exam_attempts
  WHERE id = p_attempt_id
  FOR UPDATE; -- Row-level lock prevents concurrent submissions

  -- Validate status
  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Exam attempt not found';
  END IF;

  IF v_current_status != 'in_progress' THEN
    RAISE EXCEPTION 'Exam attempt is not in progress (current status: %)', v_current_status;
  END IF;

  -- Update status to submitted (atomic transition)
  UPDATE exam_attempts
  SET 
    status = 'submitted',
    submitted_at = now(),
    submission_type = p_submission_type,
    updated_at = now()
  WHERE id = p_attempt_id;

  -- Calculate final score (single aggregation query)
  PERFORM calculate_attempt_final_score(p_attempt_id);

  -- Update status to evaluated after calculation is complete
  UPDATE exam_attempts
  SET 
    status = 'evaluated',
    updated_at = now()
  WHERE id = p_attempt_id;

  -- Return result
  SELECT jsonb_build_object(
    'success', true,
    'attempt_id', ea.id,
    'status', ea.status,
    'total_marks_obtained', ea.total_marks_obtained,
    'percentage', ea.percentage,
    'result', ea.result,
    'submitted_at', ea.submitted_at
  ) INTO v_result
  FROM exam_attempts ea
  WHERE ea.id = p_attempt_id;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION submit_exam_attempt(uuid, submission_type) IS 'Submits exam attempt with atomic status transition, evaluation, and final status update to evaluated';

-- ============================================================================
-- Fix 2: Create function to auto-submit expired exams
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_submit_expired_attempts(p_exam_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exam_end_time timestamptz;
  v_expired_attempt RECORD;
  v_submitted_count integer := 0;
  v_failed_count integer := 0;
  v_error_messages text[] := ARRAY[]::text[];
BEGIN
  -- Get exam end time
  SELECT end_time INTO v_exam_end_time
  FROM exams
  WHERE id = p_exam_id;

  IF v_exam_end_time IS NULL THEN
    RAISE EXCEPTION 'Exam not found';
  END IF;

  -- Only process if exam has ended
  IF now() <= v_exam_end_time THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Exam has not ended yet',
      'submitted_count', 0,
      'failed_count', 0
    );
  END IF;

  -- Find all attempts that are still in_progress after exam end time
  FOR v_expired_attempt IN
    SELECT id, student_id, started_at
    FROM exam_attempts
    WHERE exam_id = p_exam_id
      AND status = 'in_progress'
      AND started_at IS NOT NULL
  LOOP
    BEGIN
      -- Log the auto-submission
      RAISE NOTICE 'Auto-submitting expired attempt: % for student: %', 
        v_expired_attempt.id, v_expired_attempt.student_id;

      -- Submit the attempt using the existing function
      PERFORM submit_exam_attempt(v_expired_attempt.id, 'auto_submit');
      
      v_submitted_count := v_submitted_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other attempts
      v_failed_count := v_failed_count + 1;
      v_error_messages := array_append(v_error_messages, 
        format('Attempt %s: %s', v_expired_attempt.id, SQLERRM));
      
      RAISE WARNING 'Failed to auto-submit attempt %: %', 
        v_expired_attempt.id, SQLERRM;
    END;
  END LOOP;

  -- Return summary
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Auto-submitted %s expired attempts', v_submitted_count),
    'submitted_count', v_submitted_count,
    'failed_count', v_failed_count,
    'errors', v_error_messages
  );
END;
$$;

COMMENT ON FUNCTION auto_submit_expired_attempts(uuid) IS 'Auto-submits all exam attempts that are still in_progress after exam end time';

-- ============================================================================
-- Fix 3: Update existing 'submitted' attempts to 'evaluated'
-- ============================================================================

-- This is a one-time data fix for existing records
-- Update all attempts that have status='submitted' but have been evaluated
-- (i.e., they have total_marks_obtained, percentage, and result calculated)

UPDATE exam_attempts
SET 
  status = 'evaluated',
  updated_at = now()
WHERE status = 'submitted'
  AND total_marks_obtained IS NOT NULL
  AND percentage IS NOT NULL
  AND result IS NOT NULL
  AND submitted_at IS NOT NULL;

-- Log the number of records updated
DO $$
DECLARE
  v_updated_count integer;
BEGIN
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % existing attempts from submitted to evaluated', v_updated_count;
END $$;
