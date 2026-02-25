/*
# Data Correction: Re-evaluate Affected Exam Attempts

## Purpose
Re-evaluate all exam attempts where students did not answer all questions.
This corrects the percentage calculation after fixing the evaluate_exam_attempt function.

## Affected Attempts
All exam attempts where:
- Status is 'submitted' or 'evaluated'
- Number of answered questions < exam total marks

## Process
1. Identify affected attempts
2. Re-evaluate each attempt using corrected function
3. Log results

## Safety
- Only updates exam_attempts table
- Does not modify exam_answers (student answers preserved)
- Can be run multiple times safely (idempotent)

## Date
2025-01-20
*/

-- Step 1: Create temporary table to track affected attempts
CREATE TEMP TABLE IF NOT EXISTS affected_attempts_log (
  attempt_id uuid,
  exam_id uuid,
  exam_title text,
  student_name text,
  old_percentage numeric,
  new_percentage numeric,
  old_result text,
  new_result text,
  answered_questions bigint,
  total_questions integer,
  corrected_at timestamptz DEFAULT NOW()
);

-- Step 2: Log affected attempts BEFORE correction
INSERT INTO affected_attempts_log (
  attempt_id,
  exam_id,
  exam_title,
  student_name,
  old_percentage,
  old_result,
  answered_questions,
  total_questions
)
SELECT 
  ea.id AS attempt_id,
  ea.exam_id,
  e.title AS exam_title,
  p.full_name AS student_name,
  ea.percentage AS old_percentage,
  ea.result::text AS old_result,
  (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = ea.id) AS answered_questions,
  e.total_marks AS total_questions
FROM exam_attempts ea
JOIN exams e ON ea.exam_id = e.id
JOIN profiles p ON ea.student_id = p.id
WHERE ea.status IN ('submitted', 'evaluated')
  AND (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = ea.id) < e.total_marks;

-- Step 3: Re-evaluate all affected attempts
DO $$
DECLARE
  attempt_record RECORD;
  affected_count INTEGER := 0;
  error_count INTEGER := 0;
  eval_result jsonb;
BEGIN
  RAISE NOTICE '=== Starting Re-evaluation Process ===';
  RAISE NOTICE 'Timestamp: %', NOW();
  
  FOR attempt_record IN 
    SELECT ea.id, e.title, p.full_name
    FROM exam_attempts ea
    JOIN exams e ON ea.exam_id = e.id
    JOIN profiles p ON ea.student_id = p.id
    WHERE ea.status IN ('submitted', 'evaluated')
      AND (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = ea.id) < e.total_marks
    ORDER BY ea.submitted_at
  LOOP
    BEGIN
      -- Re-evaluate this attempt
      SELECT evaluate_exam_attempt(attempt_record.id) INTO eval_result;
      
      IF (eval_result->>'success')::boolean THEN
        affected_count := affected_count + 1;
        
        -- Log progress every 10 attempts
        IF affected_count % 10 = 0 THEN
          RAISE NOTICE 'Progress: % attempts re-evaluated', affected_count;
        END IF;
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

-- Step 4: Update log with new values
UPDATE affected_attempts_log aal
SET 
  new_percentage = ea.percentage,
  new_result = ea.result::text
FROM exam_attempts ea
WHERE aal.attempt_id = ea.id;

-- Step 5: Display summary report
DO $$
DECLARE
  total_affected INTEGER;
  significant_changes INTEGER;
  result_changes INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_affected FROM affected_attempts_log;
  
  SELECT COUNT(*) INTO significant_changes 
  FROM affected_attempts_log 
  WHERE ABS(old_percentage - new_percentage) > 10;
  
  SELECT COUNT(*) INTO result_changes 
  FROM affected_attempts_log 
  WHERE old_result != new_result;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== CORRECTION SUMMARY ===';
  RAISE NOTICE 'Total attempts corrected: %', total_affected;
  RAISE NOTICE 'Significant changes (>10%%): %', significant_changes;
  RAISE NOTICE 'Result status changes (pass/fail): %', result_changes;
  RAISE NOTICE '';
  
  IF total_affected > 0 THEN
    RAISE NOTICE 'Sample corrections (first 5):';
    FOR i IN 1..LEAST(5, total_affected) LOOP
      RAISE NOTICE '  - %: % → % (% → %)',
        (SELECT student_name FROM affected_attempts_log LIMIT 1 OFFSET i-1),
        (SELECT old_percentage FROM affected_attempts_log LIMIT 1 OFFSET i-1),
        (SELECT new_percentage FROM affected_attempts_log LIMIT 1 OFFSET i-1),
        (SELECT old_result FROM affected_attempts_log LIMIT 1 OFFSET i-1),
        (SELECT new_result FROM affected_attempts_log LIMIT 1 OFFSET i-1);
    END LOOP;
  END IF;
  
  RAISE NOTICE '=========================';
END $$;

-- Step 6: Export correction log for review
-- (Uncomment to export to CSV)
-- COPY affected_attempts_log TO '/tmp/exam_correction_log.csv' WITH CSV HEADER;

-- Step 7: Verify specific case (Janani D)
DO $$
DECLARE
  janani_record RECORD;
BEGIN
  SELECT 
    ea.id AS attempt_id,
    e.title AS exam_title,
    p.full_name AS student_name,
    ea.total_marks_obtained,
    e.total_marks AS exam_total_marks,
    ea.percentage,
    ea.result,
    (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = ea.id) AS answered_questions
  INTO janani_record
  FROM exam_attempts ea
  JOIN exams e ON ea.exam_id = e.id
  JOIN profiles p ON ea.student_id = p.id
  WHERE p.full_name = 'Janani D'
    AND e.title = 'Series 1_1'
  LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE '';
    RAISE NOTICE '=== JANANI D VERIFICATION ===';
    RAISE NOTICE 'Exam: %', janani_record.exam_title;
    RAISE NOTICE 'Marks Obtained: %', janani_record.total_marks_obtained;
    RAISE NOTICE 'Exam Total Marks: %', janani_record.exam_total_marks;
    RAISE NOTICE 'Answered Questions: %', janani_record.answered_questions;
    RAISE NOTICE 'Percentage: %', janani_record.percentage;
    RAISE NOTICE 'Result: %', janani_record.result;
    RAISE NOTICE 'Expected Percentage: 80.00';
    
    IF janani_record.percentage = 80.00 THEN
      RAISE NOTICE '✅ VERIFICATION PASSED: Percentage is correct!';
    ELSE
      RAISE WARNING '❌ VERIFICATION FAILED: Expected 80.00, got %', janani_record.percentage;
    END IF;
    RAISE NOTICE '============================';
  ELSE
    RAISE NOTICE 'Janani D record not found';
  END IF;
END $$;

-- Cleanup: Drop temporary table
-- (Keep it for review, uncomment to drop)
-- DROP TABLE IF EXISTS affected_attempts_log;
