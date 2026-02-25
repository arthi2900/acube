/*
# Fix Auto Evaluate Answer Trigger - Ambiguous Column Reference

## Problem
The auto_evaluate_answer() trigger function has variable names that conflict
with column names, causing "column reference 'correct_answer' is ambiguous" error.

## Root Cause
Line 247: DECLARE correct_answer jsonb;
Line 251: SELECT correct_answer FROM questions...
Line 258: correct_answer := to_jsonb(question_record.correct_answer);

The variable name `correct_answer` conflicts with the column name `correct_answer`.

## Solution
Rename all variables with v_ prefix to avoid conflicts:
- correct_answer → v_correct_answer
- student_ans → v_student_ans

## Impact
This trigger runs on EVERY INSERT/UPDATE to exam_answers table,
so fixing this will resolve the student answer saving issue.
*/

-- Drop and recreate the auto_evaluate_answer function with fixed variable names
CREATE OR REPLACE FUNCTION auto_evaluate_answer()
RETURNS TRIGGER AS $$
DECLARE
  question_record RECORD;
  v_correct_answer jsonb;  -- Renamed to avoid conflict
  v_student_ans jsonb;  -- Renamed to avoid conflict
BEGIN
  -- Get question details (use explicit table qualification)
  SELECT q.question_type, q.correct_answer, q.marks 
  INTO question_record
  FROM questions q
  WHERE q.id = NEW.question_id;

  -- Only auto-evaluate MCQ and True/False
  IF question_record.question_type IN ('mcq', 'true_false') THEN
    v_correct_answer := to_jsonb(question_record.correct_answer);
    v_student_ans := NEW.student_answer;

    -- Compare answers
    IF v_correct_answer = v_student_ans THEN
      NEW.is_correct := true;
      NEW.marks_obtained := NEW.marks_allocated;
    ELSE
      NEW.is_correct := false;
      NEW.marks_obtained := 0;
    END IF;
    
    NEW.evaluated_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the trigger function was updated
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'auto_evaluate_answer'
  ) THEN
    RAISE NOTICE 'Trigger function auto_evaluate_answer updated successfully';
  ELSE
    RAISE WARNING 'Trigger function auto_evaluate_answer was not created';
  END IF;
END $$;
