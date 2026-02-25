/*
# Fix Ambiguous Column Reference Error

## Problem
Error: column reference "correct_answer" is ambiguous
Code: 42702

## Root Cause
The auto_grade_objective_questions function uses variable names that conflict
with column names, causing ambiguity during INSERT/UPDATE operations.

## Solution
1. Rename variables to avoid conflicts with column names
2. Use explicit table qualifications
3. Use different variable naming convention (prefix with v_)

## Changes
- Rename `is_correct` variable to `v_is_correct`
- Rename `marks_to_award` to `v_marks_to_award`
- Add explicit table qualifications where needed
*/

-- Drop and recreate the auto_grade_objective_questions function with fixed variable names
CREATE OR REPLACE FUNCTION auto_grade_objective_questions(attempt_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  graded_count integer := 0;
  answer_record RECORD;
  question_record RECORD;
  v_is_correct boolean;  -- Renamed to avoid conflict
  v_marks_to_award numeric;  -- Renamed to avoid conflict
BEGIN
  -- Loop through all answers for this attempt
  FOR answer_record IN 
    SELECT ea.* 
    FROM exam_answers ea
    WHERE ea.attempt_id = attempt_uuid
  LOOP
    -- Get question details
    SELECT q.* INTO question_record 
    FROM questions q
    WHERE q.id = answer_record.question_id;
    
    -- Only grade objective questions (MCQ and True/False)
    IF question_record.question_type IN ('mcq', 'true_false') THEN
      -- Check if answer is correct (explicit comparison)
      v_is_correct := (answer_record.student_answer::text = question_record.correct_answer::text);
      
      -- Assign marks
      IF v_is_correct THEN
        v_marks_to_award := question_record.marks;
      ELSE
        v_marks_to_award := 0;
      END IF;
      
      -- Update the answer with grading results (use explicit column names)
      UPDATE exam_answers ea
      SET 
        is_correct = v_is_correct,
        marks_obtained = v_marks_to_award,
        evaluated_at = now()
      WHERE ea.id = answer_record.id;
      
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

-- Verify the function was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'auto_grade_objective_questions'
  ) THEN
    RAISE NOTICE 'Function auto_grade_objective_questions updated successfully';
  ELSE
    RAISE WARNING 'Function auto_grade_objective_questions was not created';
  END IF;
END $$;
