/*
# Re-evaluate Affected Exam Attempts

## Purpose
Re-evaluate all exam attempts that are stuck in 'submitted' status
even though all questions have been graded.

## Affected Attempts
All attempts where:
- Status is 'submitted'
- All answers have been evaluated (is_correct is not null)
- No subjective questions remain ungraded

## Process
1. Identify affected attempts
2. Call evaluate_exam_attempt for each
3. Update status to 'evaluated'
4. Log results

## Date
2025-01-21
*/

-- Re-evaluate all affected attempts
DO $$
DECLARE
  attempt_record RECORD;
  affected_count INTEGER := 0;
  error_count INTEGER := 0;
  eval_result jsonb;
BEGIN
  RAISE NOTICE '=== Re-evaluating Stuck Attempts ===';
  RAISE NOTICE 'Timestamp: %', NOW();
  
  FOR attempt_record IN 
    SELECT DISTINCT ea.id, e.title, p.full_name
    FROM exam_attempts ea
    JOIN exams e ON ea.exam_id = e.id
    JOIN profiles p ON ea.student_id = p.id
    WHERE ea.status = 'submitted'
      -- Check if all answers are graded (no null is_correct for objective questions)
      AND NOT EXISTS (
        SELECT 1 
        FROM exam_answers ans
        JOIN questions q ON ans.question_id = q.id
        WHERE ans.attempt_id = ea.id
          AND q.question_type IN ('mcq', 'true_false', 'multiple_response', 'match_following')
          AND ans.is_correct IS NULL
      )
      -- Check if there are no subjective questions
      AND NOT EXISTS (
        SELECT 1
        FROM exam_answers ans
        JOIN questions q ON ans.question_id = q.id
        WHERE ans.attempt_id = ea.id
          AND q.question_type = 'short_answer'
      )
    ORDER BY ea.submitted_at
  LOOP
    BEGIN
      -- Re-evaluate this attempt
      SELECT evaluate_exam_attempt(attempt_record.id) INTO eval_result;
      
      IF (eval_result->>'success')::boolean THEN
        affected_count := affected_count + 1;
        RAISE NOTICE 'Re-evaluated: % - % (Attempt ID: %)', 
          attempt_record.full_name, attempt_record.title, attempt_record.id;
      ELSE
        error_count := error_count + 1;
        RAISE WARNING 'Failed to re-evaluate attempt % (% - %): %', 
          attempt_record.id, attempt_record.full_name, attempt_record.title, 
          eval_result->>'message';
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE WARNING 'Error re-evaluating attempt % (% - %): %', 
        attempt_record.id, attempt_record.full_name, attempt_record.title, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '=== Re-evaluation Complete ===';
  RAISE NOTICE 'Successfully re-evaluated: % attempts', affected_count;
  RAISE NOTICE 'Errors encountered: % attempts', error_count;
  RAISE NOTICE 'Timestamp: %', NOW();
END $$;

-- Verify specific case (Rithisha V - Revision 1)
DO $$
DECLARE
  rithisha_record RECORD;
BEGIN
  SELECT 
    ea.id AS attempt_id,
    e.title AS exam_title,
    p.full_name AS student_name,
    ea.status,
    ea.total_marks_obtained,
    e.total_marks AS exam_total_marks,
    ea.percentage,
    ea.result,
    (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = ea.id) AS answered_questions
  INTO rithisha_record
  FROM exam_attempts ea
  JOIN exams e ON ea.exam_id = e.id
  JOIN profiles p ON ea.student_id = p.id
  WHERE p.full_name = 'Rithisha V'
    AND e.title = 'Revision 1'
  LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE '';
    RAISE NOTICE '=== RITHISHA V VERIFICATION ===';
    RAISE NOTICE 'Exam: %', rithisha_record.exam_title;
    RAISE NOTICE 'Status: %', rithisha_record.status;
    RAISE NOTICE 'Marks Obtained: %', rithisha_record.total_marks_obtained;
    RAISE NOTICE 'Exam Total Marks: %', rithisha_record.exam_total_marks;
    RAISE NOTICE 'Answered Questions: %', rithisha_record.answered_questions;
    RAISE NOTICE 'Percentage: %', rithisha_record.percentage;
    RAISE NOTICE 'Result: %', rithisha_record.result;
    
    IF rithisha_record.status = 'evaluated' THEN
      RAISE NOTICE '✅ VERIFICATION PASSED: Status is now evaluated!';
    ELSE
      RAISE WARNING '❌ VERIFICATION FAILED: Status is still %', rithisha_record.status;
    END IF;
    RAISE NOTICE '================================';
  ELSE
    RAISE NOTICE 'Rithisha V record not found';
  END IF;
END $$;
