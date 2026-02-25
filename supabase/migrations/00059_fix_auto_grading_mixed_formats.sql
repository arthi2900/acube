-- Fix Auto-Grading for Mixed Answer Formats
-- Date: 2025-01-21
-- Issue: Some correct_answers are plain text, some are JSON

CREATE OR REPLACE FUNCTION auto_grade_objective_questions(attempt_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  graded_count integer := 0;
  answer_record RECORD;
  question_record RECORD;
  is_correct boolean;
  marks_to_award numeric;
  correct_answer_text text;
  student_answer_text text;
BEGIN
  FOR answer_record IN 
    SELECT ea.* 
    FROM exam_answers ea
    WHERE ea.attempt_id = attempt_uuid
  LOOP
    SELECT * INTO question_record 
    FROM questions 
    WHERE id = answer_record.question_id;
    
    -- Grade all objective question types
    IF question_record.question_type IN ('mcq', 'true_false', 'multiple_response', 'match_following') THEN
      -- Get student answer as text
      student_answer_text := answer_record.student_answer::text;
      
      -- Try to parse correct_answer as JSON, if it fails, use as plain text
      BEGIN
        correct_answer_text := question_record.correct_answer::jsonb::text;
      EXCEPTION WHEN OTHERS THEN
        -- If JSON parsing fails, use as plain text
        correct_answer_text := question_record.correct_answer;
      END;
      
      -- Compare as text (handles both JSON and plain text)
      is_correct := (student_answer_text = correct_answer_text);
      
      IF is_correct THEN
        marks_to_award := question_record.marks;
      ELSE
        IF question_record.negative_marks > 0 THEN
          marks_to_award := -question_record.negative_marks;
        ELSE
          marks_to_award := 0;
        END IF;
      END IF;
      
      UPDATE exam_answers
      SET 
        is_correct = is_correct,
        marks_obtained = marks_to_award,
        evaluated_at = now()
      WHERE id = answer_record.id;
      
      graded_count := graded_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'graded_count', graded_count,
    'message', graded_count || ' objective questions auto-graded'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;