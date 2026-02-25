-- EMERGENCY ROLLBACK SCRIPT
-- Use this script to revert all performance optimizations if issues occur
-- 
-- WARNING: This will restore the original system with performance bottlenecks
-- Only use this if critical issues are discovered after deployment
--
-- Date: 2025-12-11
-- Purpose: Rollback performance optimizations to original state

BEGIN;

-- ============================================================================
-- STEP 1: Remove New Functions
-- ============================================================================

DROP FUNCTION IF EXISTS submit_exam_attempt(uuid, submission_type);
DROP FUNCTION IF EXISTS calculate_attempt_final_score(uuid);
DROP FUNCTION IF EXISTS bulk_insert_exam_answers(uuid, jsonb);
DROP FUNCTION IF EXISTS update_exam_metadata();
DROP FUNCTION IF EXISTS is_active_student();
DROP FUNCTION IF EXISTS is_active_user();
DROP FUNCTION IF EXISTS update_storage_usage_batch();

-- ============================================================================
-- STEP 2: Remove New Indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_exam_attempts_student_status;
DROP INDEX IF EXISTS idx_exam_attempts_exam_status;
DROP INDEX IF EXISTS idx_exam_answers_attempt_correct;
DROP INDEX IF EXISTS idx_exams_class_subject_status;
DROP INDEX IF EXISTS idx_qpq_paper_order;
DROP INDEX IF EXISTS idx_profiles_suspended;
DROP INDEX IF EXISTS idx_exams_question_paper;
DROP INDEX IF EXISTS idx_exams_metadata;
DROP INDEX IF EXISTS idx_exam_attempts_unique_submission;

-- ============================================================================
-- STEP 3: Remove New Columns
-- ============================================================================

ALTER TABLE exams DROP COLUMN IF EXISTS question_count;
ALTER TABLE exams DROP COLUMN IF EXISTS cached_total_marks;

-- ============================================================================
-- STEP 4: Restore Original Trigger (Per-Answer Score Recalculation)
-- ============================================================================

CREATE TRIGGER calculate_marks_trigger
  AFTER INSERT OR UPDATE ON exam_answers
  FOR EACH ROW
  EXECUTE FUNCTION calculate_attempt_marks();

-- ============================================================================
-- STEP 5: Restore Storage Tracking Triggers
-- ============================================================================

CREATE TRIGGER trigger_auto_update_storage_exam_answers
  AFTER INSERT OR UPDATE OR DELETE ON exam_answers
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_user_storage();

CREATE TRIGGER trigger_auto_update_storage_exam_attempts
  AFTER INSERT OR UPDATE OR DELETE ON exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_user_storage();

CREATE TRIGGER trigger_auto_update_storage_exams
  AFTER INSERT OR UPDATE OR DELETE ON exams
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_user_storage();

-- ============================================================================
-- STEP 6: Restore Original RLS Policies
-- ============================================================================

-- Restore original answer insertion policy
DROP POLICY IF EXISTS "Students can insert their own answers" ON exam_answers;

CREATE POLICY "Students can insert their own answers"
ON exam_answers FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE exam_attempts.id = exam_answers.attempt_id
      AND exam_attempts.student_id = auth.uid()
  ))
  AND (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.suspended = false
  ))
);

-- Restore original answer update policy
DROP POLICY IF EXISTS "Students can update their own answers" ON exam_answers;

CREATE POLICY "Students can update their own answers"
ON exam_answers FOR UPDATE
USING (
  (EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE exam_attempts.id = exam_answers.attempt_id
      AND exam_attempts.student_id = auth.uid()
  ))
  AND (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.suspended = false
  ))
);

-- Restore original answer view policy
DROP POLICY IF EXISTS "Students can view their own answers" ON exam_answers;

CREATE POLICY "Students can view their own answers"
ON exam_answers FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE exam_attempts.id = exam_answers.attempt_id
      AND exam_attempts.student_id = auth.uid()
  ))
  AND (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.suspended = false
  ))
);

-- Restore original attempt creation policy
DROP POLICY IF EXISTS "Students can create their own attempts" ON exam_attempts;

CREATE POLICY "Students can create their own attempts"
ON exam_attempts FOR INSERT
WITH CHECK (
  student_id = auth.uid()
  AND (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.suspended = false
  ))
);

-- Restore original attempt update policy
DROP POLICY IF EXISTS "Students can update their own attempts" ON exam_attempts;

CREATE POLICY "Students can update their own attempts"
ON exam_attempts FOR UPDATE
USING (
  student_id = auth.uid()
  AND (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.suspended = false
  ))
);

-- Restore original attempt view policy
DROP POLICY IF EXISTS "Students can view their own attempts" ON exam_attempts;

CREATE POLICY "Students can view their own attempts"
ON exam_attempts FOR SELECT
USING (
  student_id = auth.uid()
  AND (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.suspended = false
  ))
);

-- ============================================================================
-- STEP 7: Log Rollback
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'ROLLBACK COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'All performance optimizations have been reverted';
  RAISE NOTICE 'System restored to original state';
  RAISE NOTICE 'Date: %', NOW();
  RAISE NOTICE '============================================';
  RAISE NOTICE 'WARNING: Original performance bottlenecks are now active';
  RAISE NOTICE 'System will not support 15,000+ concurrent users';
  RAISE NOTICE '============================================';
END $$;

COMMIT;

-- ============================================================================
-- POST-ROLLBACK VERIFICATION
-- ============================================================================

-- Verify trigger is restored
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'exam_answers'
  AND trigger_name = 'calculate_marks_trigger';

-- Verify functions are removed
SELECT proname 
FROM pg_proc 
WHERE proname IN (
  'submit_exam_attempt',
  'bulk_insert_exam_answers',
  'calculate_attempt_final_score'
);

-- Verify indexes are removed
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_exam_attempts_student_status',
    'idx_exam_attempts_exam_status',
    'idx_exam_answers_attempt_correct'
  );

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- After running this rollback:
-- 1. Update frontend code to stop using optimized functions
-- 2. Monitor database performance (will be degraded)
-- 3. Investigate root cause of issues that required rollback
-- 4. Plan re-implementation with fixes
-- 
-- ============================================================================
