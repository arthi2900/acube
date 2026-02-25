/*
# Fix Auto-Grading for All Objective Question Types

## Issue
The auto-grading system only grades MCQ and True/False questions.
It doesn't grade multiple_response and match_following questions,
causing exams with these question types to remain in 'submitted' status
instead of being automatically evaluated.

## Root Cause
In auto_grade_objective_questions function (line 47):
```sql
IF question_record.question_type IN ('mcq', 'true_false') THEN
```

This excludes multiple_response and match_following questions.

## Impact
- Students see "Evaluation in Progress" even though exam is fully graded
- Teachers see correct results, but students don't
- Affects all exams with multiple_response or match_following questions

## Solution
1. Update auto_grade_objective_questions to grade all objective question types
2. Update process_exam_submission to use corrected percentage calculation
3. Re-evaluate affected attempts

## Date
2025-01-21
*/

-- Drop and recreate auto_grade_objective_questions with support for all objective types
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
    
    -- Grade all objective question types (not short_answer)
    IF question_record.question_type IN ('mcq', 'true_false', 'multiple_response', 'match_following') THEN
      -- Check if answer is correct
      -- For all objective types, we compare the JSON values directly
      is_correct := (answer_record.student_answer::jsonb = question_record.correct_answer::jsonb);
      
      -- Assign marks
      IF is_correct THEN
        marks_to_award := question_record.marks;
      ELSE
        -- Apply negative marking if configured
        IF question_record.negative_marks > 0 THEN
          marks_to_award := -question_record.negative_marks;
        ELSE
          marks_to_award := 0;
        END IF;
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

-- Update process_exam_submission to use corrected percentage calculation
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
  
  -- Step 2: Check if there are any subjective questions (short_answer)
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
    -- No answers submitted - use exam total marks for percentage calculation
    DECLARE
      exam_total_marks integer;
      exam_passing_marks integer;
    BEGIN
      SELECT e.total_marks, e.passing_marks
      INTO exam_total_marks, exam_passing_marks
      FROM exams e
      JOIN exam_attempts ea ON ea.exam_id = e.id
      WHERE ea.id = attempt_uuid;
      
      UPDATE exam_attempts
      SET 
        status = 'evaluated'::attempt_status,
        total_marks_obtained = 0,
        percentage = 0,
        result = 'fail'::exam_result
      WHERE id = attempt_uuid;
      
      RETURN jsonb_build_object(
        'success', true,
        'status', 'evaluated',
        'message', 'No answers submitted - marked as 0'
      );
    END;
  ELSE
    -- Has subjective questions - calculate partial results using exam total marks
    DECLARE
      total_obtained numeric;
      exam_total_marks integer;
      calc_percentage numeric;
    BEGIN
      -- Get exam total marks (not from answered questions)
      SELECT e.total_marks
      INTO exam_total_marks
      FROM exams e
      JOIN exam_attempts ea ON ea.exam_id = e.id
      WHERE ea.id = attempt_uuid;
      
      -- Calculate marks obtained from graded answers
      SELECT COALESCE(SUM(marks_obtained), 0)
      INTO total_obtained
      FROM exam_answers
      WHERE attempt_id = attempt_uuid;
      
      -- Calculate percentage based on exam total marks
      IF exam_total_marks > 0 THEN
        calc_percentage := (total_obtained / exam_total_marks) * 100;
      ELSE
        calc_percentage := 0;
      END IF;
      
      -- Update with partial results (status remains 'submitted')
      UPDATE exam_attempts
      SET 
        total_marks_obtained = total_obtained,
        percentage = ROUND(calc_percentage, 2)
      WHERE id = attempt_uuid;
      
      RETURN jsonb_build_object(
        'success', true,
        'auto_graded', auto_grade_result,
        'status', 'submitted',
        'message', subjective_count || ' subjective questions require manual grading',
        'partial_marks', total_obtained,
        'total_marks', exam_total_marks
      );
    END;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION auto_grade_objective_questions(uuid) IS 
  'Auto-grades all objective question types: MCQ, True/False, Multiple Response, and Match Following. ' ||
  'Updated on 2025-01-21 to support all objective types.';

COMMENT ON FUNCTION process_exam_submission(uuid) IS 
  'Processes exam submission by auto-grading objective questions and evaluating if no subjective questions remain. ' ||
  'Updated on 2025-01-21 to use exam total marks for percentage calculation.';
