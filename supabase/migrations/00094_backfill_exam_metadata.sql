-- Migration: Backfill Exam Metadata for Existing Records
-- Purpose: Populate question_count and cached_total_marks for existing exams
-- Impact: Ensures all exams have cached metadata for fast loading

-- Backfill metadata for all existing exams
UPDATE exams e
SET 
  question_count = (
    SELECT COUNT(*)
    FROM question_paper_questions qpq
    WHERE qpq.question_paper_id = e.question_paper_id
  ),
  cached_total_marks = (
    SELECT COALESCE(SUM(q.marks), 0)
    FROM question_paper_questions qpq
    JOIN questions q ON q.id = qpq.question_id
    WHERE qpq.question_paper_id = e.question_paper_id
  )
WHERE question_count = 0 OR cached_total_marks = 0;

-- Log the backfill operation
DO $$
DECLARE
  v_updated_count integer;
BEGIN
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled metadata for % exams', v_updated_count;
END $$;