/*
# Add Auto-Grading System

## Purpose
Automatically grade objective questions (MCQ, True/False) when exam is submitted

## New Functions
1. auto_grade_objective_questions - Grades MCQ and True/False questions
2. process_exam_submission - Complete post-submission processing

## Workflow
1. Student submits exam
2. Auto-grade objective questions (MCQ, True/False)
3. Calculate total marks and percentage
4. Determine pass/fail status
5. Update exam attempt status to 'evaluated'

## Notes
- Short answer questions remain ungraded (marks_obtained = NULL)
- Teachers can manually grade short answer questions later
- If all questions are objective, exam is immediately evaluated
- If there are subjective questions, status remains 'submitted' until manual grading
*/

-- Function to auto-grade objective questions
CREATE OR REPLACE FUNCTION auto_grade_objective_questions(attempt_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  graded_count integer := 0;
  answer_record RECORD;
  question_record RECORD;
  is_correct boolean;
  marks_to_award numeric;
BEGIN
  -- Loop through all answers for this attempt
  FOR answer_record IN 
    SELECT ea.* 
    FROM exam_answers ea
    WHERE ea.attempt_id = attempt_uuid
  LOOP
    -- Get question details
    SELECT * INTO question_record 
    FROM questions 
    WHERE id = answer_record.question_id;
    
    -- Only grade objective questions (MCQ and True/False)
    IF question_record.question_type IN ('mcq', 'true_false') THEN
      -- Check if answer is correct
      is_correct := (answer_record.student_answer::text = question_record.correct_answer::text);
      
      -- Assign marks
      IF is_correct THEN
        marks_to_award := question_record.marks;
      ELSE
        marks_to_award := 0;
      END IF;
      
      -- Update the answer with grading results
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

-- Function to process exam submission (complete workflow)
CREATE OR REPLACE FUNCTION process_exam_submission(attempt_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  auto_grade_result jsonb;
  evaluation_result jsonb;
  subjective_count integer;
  total_questions integer;
BEGIN
  -- Step 1: Auto-grade objective questions
  auto_grade_result := auto_grade_objective_questions(attempt_uuid);
  
  -- Step 2: Check if there are any subjective questions
  SELECT COUNT(*) INTO subjective_count
  FROM exam_answers ea
  JOIN questions q ON q.id = ea.question_id
  WHERE ea.attempt_id = attempt_uuid
  AND q.question_type = 'short_answer';
  
  SELECT COUNT(*) INTO total_questions
  FROM exam_answers
  WHERE attempt_id = attempt_uuid;
  
  -- Step 3: If no subjective questions, evaluate immediately
  IF subjective_count = 0 AND total_questions > 0 THEN
    evaluation_result := evaluate_exam_attempt(attempt_uuid);
    
    RETURN jsonb_build_object(
      'success', true,
      'auto_graded', auto_grade_result,
      'evaluation', evaluation_result,
      'status', 'evaluated',
      'message', 'Exam auto-graded and evaluated successfully'
    );
  ELSIF total_questions = 0 THEN
    -- No answers submitted
    UPDATE exam_attempts
    SET 
      status = 'evaluated'::attempt_status,
      total_marks_obtained = 0,
      percentage = 0,
      result = 'fail'
    WHERE id = attempt_uuid;
    
    RETURN jsonb_build_object(
      'success', true,
      'status', 'evaluated',
      'message', 'No answers submitted - marked as 0'
    );
  ELSE
    -- Has subjective questions - calculate partial results
    DECLARE
      total_obtained numeric;
      total_possible numeric;
      calc_percentage numeric;
    BEGIN
      SELECT 
        COALESCE(SUM(marks_obtained), 0),
        COALESCE(SUM(marks_allocated), 0)
      INTO total_obtained, total_possible
      FROM exam_answers
      WHERE attempt_id = attempt_uuid;
      
      IF total_possible > 0 THEN
        calc_percentage := (total_obtained / total_possible) * 100;
      ELSE
        calc_percentage := 0;
      END IF;
      
      -- Update with partial results (status remains 'submitted')
      UPDATE exam_attempts
      SET 
        total_marks_obtained = total_obtained,
        percentage = calc_percentage
      WHERE id = attempt_uuid;
      
      RETURN jsonb_build_object(
        'success', true,
        'auto_graded', auto_grade_result,
        'status', 'submitted',
        'message', subjective_count || ' subjective questions require manual grading',
        'partial_marks', total_obtained,
        'total_marks', total_possible
      );
    END;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auto_grade_objective_questions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION process_exam_submission(uuid) TO authenticated;
