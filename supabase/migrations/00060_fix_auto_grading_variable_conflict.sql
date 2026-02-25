-- Fix Auto-Grading Variable Name Conflict
-- Date: 2025-01-21

CREATE OR REPLACE FUNCTION auto_grade_objective_questions(attempt_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  graded_count integer := 0;
  answer_record RECORD;
  question_record RECORD;
  v_is_correct boolean;
  v_marks_to_award numeric;
  v_correct_answer_text text;
  v_student_answer_text text;
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
      v_student_answer_text := answer_record.student_answer::text;
      
      -- Try to parse correct_answer as JSON, if it fails, use as plain text
      BEGIN
        v_correct_answer_text := question_record.correct_answer::jsonb::text;
      EXCEPTION WHEN OTHERS THEN
        v_correct_answer_text := question_record.correct_answer;
      END;
      
      -- Compare as text
      v_is_correct := (v_student_answer_text = v_correct_answer_text);
      
      IF v_is_correct THEN
        v_marks_to_award := question_record.marks;
      ELSE
        IF question_record.negative_marks > 0 THEN
          v_marks_to_award := -question_record.negative_marks;
        ELSE
          v_marks_to_award := 0;
        END IF;
      END IF;
      
      UPDATE exam_answers
      SET 
        is_correct = v_is_correct,
        marks_obtained = v_marks_to_award,
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