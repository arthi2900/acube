-- Migration: Remove Per-Answer Score Recalculation Trigger
-- Purpose: Eliminate performance bottleneck (750,000 trigger executions → 15,000)
-- Impact: 98% reduction in database operations during exam submission

-- CRITICAL: Remove the trigger that recalculates score after every answer
-- This trigger was causing severe performance degradation at scale
DROP TRIGGER IF EXISTS calculate_marks_trigger ON exam_answers;

-- Note: Score calculation is now done once at submission time via submit_exam_attempt()
-- This change reduces database load by 98% for 15,000 concurrent users

-- Add comment for documentation
COMMENT ON TABLE exam_answers IS 'Stores student answers. Score calculation deferred to submission time for performance.';