-- Migration: Defer Storage Tracking for Performance
-- Purpose: Remove real-time storage tracking triggers to reduce overhead
-- Impact: Eliminates 750,000 additional trigger executions during exam submission

-- Disable real-time storage tracking for exam-related tables
DROP TRIGGER IF EXISTS trigger_auto_update_storage_exam_answers ON exam_answers;
DROP TRIGGER IF EXISTS trigger_auto_update_storage_exam_attempts ON exam_attempts;
DROP TRIGGER IF EXISTS trigger_auto_update_storage_exams ON exams;

-- Create periodic storage update function (to be run via scheduled job)
CREATE OR REPLACE FUNCTION update_storage_usage_batch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update storage usage for all users in batch
  -- This function should be called periodically (e.g., every 5 minutes) via a cron job
  
  INSERT INTO storage_usage (user_id, total_bytes, last_calculated)
  SELECT 
    user_id,
    SUM(bytes) as total_bytes,
    now() as last_calculated
  FROM (
    -- Calculate storage from questions
    SELECT created_by as user_id, pg_column_size(questions.*) as bytes 
    FROM questions
    WHERE created_by IS NOT NULL
    
    UNION ALL
    
    -- Calculate storage from question papers
    SELECT created_by as user_id, pg_column_size(question_papers.*) as bytes 
    FROM question_papers
    WHERE created_by IS NOT NULL
    
    UNION ALL
    
    -- Calculate storage from exams
    SELECT teacher_id as user_id, pg_column_size(exams.*) as bytes 
    FROM exams
    WHERE teacher_id IS NOT NULL
    
    UNION ALL
    
    -- Calculate storage from exam attempts
    SELECT student_id as user_id, pg_column_size(exam_attempts.*) as bytes 
    FROM exam_attempts
    WHERE student_id IS NOT NULL
    
    UNION ALL
    
    -- Calculate storage from exam answers
    SELECT ea.student_id as user_id, pg_column_size(exam_answers.*) as bytes 
    FROM exam_answers
    JOIN exam_attempts ea ON ea.id = exam_answers.attempt_id
  ) storage_data
  GROUP BY user_id
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_bytes = EXCLUDED.total_bytes,
    last_calculated = EXCLUDED.last_calculated;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION update_storage_usage_batch() IS 'Batch updates storage usage for all users (run periodically via cron job instead of real-time triggers)';

-- Note: Storage tracking is now deferred to periodic batch updates
-- This eliminates real-time overhead during exam operations
-- To enable periodic updates, set up a cron job to call update_storage_usage_batch() every 5 minutes