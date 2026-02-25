-- Fix Auto-Grading JSON Comparison
-- Date: 2025-01-21
-- Issue: Tamil text in answers causes JSON parsing errors

CREATE OR REPLACE FUNCTION auto_grade_objective_questions(attempt_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  graded_count integer := 0;
  answer_record RECORD;
  question_record RECORD;
  is_correct boolean;
  marks_to_award numeric;
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
      -- Compare answers as text (handles Tamil and other Unicode characters)
      -- Both correct_answer and student_answer are stored as jsonb in the database
      is_correct := (answer_record.student_answer = question_record.correct_answer);
      
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