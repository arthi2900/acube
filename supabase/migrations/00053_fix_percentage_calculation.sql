/*
# Fix Percentage Calculation in evaluate_exam_attempt Function

## Issue
The evaluate_exam_attempt function calculates percentage based on answered questions only,
not the total marks of the exam. This causes inflated percentages when students skip questions.

## Example
- Student answers 16 out of 20 questions correctly
- Current calculation: (16/16) × 100 = 100% ❌
- Correct calculation: (16/20) × 100 = 80% ✓

## Root Cause
Lines 120-125 in the original function:
```sql
SELECT 
  COALESCE(SUM(marks_obtained), 0),
  COALESCE(SUM(marks_allocated), 0)  -- ❌ Only sums answered questions
INTO total_obtained, total_possible
FROM exam_answers
WHERE attempt_id = attempt_uuid;
```

The `exam_answers` table only contains rows for answered questions.
Should use `exams.total_marks` instead.

## Fix
Get total_possible from exams table, not from exam_answers table.

## Impact
- Fixes percentage calculation for all future exam evaluations
- Requires re-evaluation of existing attempts (see data correction script)
- Affects all students who skipped questions

## Date
2025-01-20
*/

-- Drop existing function
DROP FUNCTION IF EXISTS evaluate_exam_attempt(uuid);

-- Create corrected function
CREATE OR REPLACE FUNCTION evaluate_exam_attempt(attempt_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  total_obtained numeric;
  total_possible numeric;
  calc_percentage numeric;
  exam_passing_marks integer;
  pass_status text;
  unevaluated_count integer;
BEGIN
  -- Check for unevaluated subjective questions
  SELECT COUNT(*) INTO unevaluated_count
  FROM exam_answers ea
  JOIN questions q ON q.id = ea.question_id
  WHERE ea.attempt_id = attempt_uuid
  AND q.question_type = 'short_answer'
  AND ea.marks_obtained IS NULL;
  
  IF unevaluated_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Cannot evaluate: ' || unevaluated_count || ' subjective questions not graded'
    );
  END IF;
  
  -- ✅ FIX: Get total marks and passing marks from exams table
  SELECT e.total_marks, e.passing_marks 
  INTO total_possible, exam_passing_marks
  FROM exams e
  JOIN exam_attempts ea ON ea.exam_id = e.id
  WHERE ea.id = attempt_uuid;
  
  -- Validate exam was found
  IF total_possible IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Exam not found for attempt ' || attempt_uuid
    );
  END IF;
  
  -- ✅ Calculate total marks obtained from exam_answers (only answered questions)
  SELECT COALESCE(SUM(marks_obtained), 0)
  INTO total_obtained
  FROM exam_answers
  WHERE attempt_id = attempt_uuid;
  
  -- ✅ Calculate percentage based on exam total marks (not answered questions)
  IF total_possible > 0 THEN
    calc_percentage := (total_obtained / total_possible) * 100;
  ELSE
    calc_percentage := 0;
  END IF;
  
  -- Determine pass/fail
  IF total_obtained >= exam_passing_marks THEN
    pass_status := 'pass';
  ELSE
    pass_status := 'fail';
  END IF;
  
  -- Update attempt
  UPDATE exam_attempts
  SET 
    status = 'evaluated'::attempt_status,
    total_marks_obtained = total_obtained,
    percentage = ROUND(calc_percentage, 2),  -- Round to 2 decimal places
    result = pass_status::exam_result
  WHERE id = attempt_uuid;
  
  -- Log evaluation for debugging
  RAISE NOTICE 'Evaluated attempt %: obtained=%, total=%, percentage=%%, result=%',
    attempt_uuid, total_obtained, total_possible, ROUND(calc_percentage, 2), pass_status;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_marks_obtained', total_obtained,
    'total_marks', total_possible,
    'percentage', ROUND(calc_percentage, 2),
    'result', pass_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION evaluate_exam_attempt(uuid) IS 
  'Evaluates an exam attempt by calculating total marks obtained, percentage, and pass/fail result. ' ||
  'Percentage is calculated as (marks_obtained / exam_total_marks) × 100. ' ||
  'Fixed on 2025-01-20 to use exam total marks instead of answered questions only.';
