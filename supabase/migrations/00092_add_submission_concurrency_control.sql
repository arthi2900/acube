-- Migration: Add Concurrency Control for Exam Submissions
-- Purpose: Prevent double submission and race conditions
-- Impact: Eliminates data corruption from concurrent submissions

-- Add unique constraint to prevent multiple submitted attempts
CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_attempts_unique_submission
ON exam_attempts(exam_id, student_id)
WHERE status = 'submitted';

-- Add comment for documentation
COMMENT ON INDEX idx_exam_attempts_unique_submission IS 'Prevents duplicate exam submissions (only one submitted attempt per student per exam)';