-- Migration: Add Exam Metadata Auto-Update Trigger
-- Purpose: Automatically populate question_count and cached_total_marks when exam is published
-- Impact: Eliminates 30,000 subqueries for 15,000 concurrent users

-- Function: Update exam metadata from question paper
CREATE OR REPLACE FUNCTION update_exam_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update exam metadata from question paper
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
    ),
    updated_at = now()
  WHERE e.id = NEW.id;

  RETURN NEW;
END;
$$;

-- Trigger: Update metadata when exam is published
CREATE TRIGGER update_exam_metadata_on_publish
  AFTER UPDATE OF status ON exams
  FOR EACH ROW
  WHEN (NEW.status = 'published' AND OLD.status != 'published')
  EXECUTE FUNCTION update_exam_metadata();

-- Add comments for documentation
COMMENT ON FUNCTION update_exam_metadata() IS 'Auto-updates exam metadata (question count, total marks) when exam is published';
COMMENT ON TRIGGER update_exam_metadata_on_publish ON exams IS 'Triggers metadata update when exam status changes to published';