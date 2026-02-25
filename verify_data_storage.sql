-- Data Storage Verification Script
-- Run this in Supabase SQL Editor to check if answers are being saved

-- ============================================
-- PART 1: Find Elamaran S's Recent Attempts
-- ============================================

SELECT 
  ea.id as attempt_id,
  ea.status,
  ea.started_at,
  ea.submitted_at,
  EXTRACT(EPOCH FROM (ea.submitted_at - ea.started_at))/60 as duration_minutes,
  p.full_name as student_name,
  p.username,
  e.title as exam_title,
  e.id as exam_id,
  (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = ea.id) as answers_saved,
  (SELECT COUNT(*) FROM question_paper_questions qpq 
   WHERE qpq.question_paper_id = e.question_paper_id) as total_questions,
  CASE 
    WHEN (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = ea.id) = 0 
    THEN '❌ NO ANSWERS SAVED'
    WHEN (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = ea.id) < 
         (SELECT COUNT(*) FROM question_paper_questions qpq WHERE qpq.question_paper_id = e.question_paper_id)
    THEN '⚠️ PARTIAL ANSWERS'
    ELSE '✅ ALL ANSWERS SAVED'
  END as storage_status
FROM exam_attempts ea
JOIN profiles p ON p.id = ea.student_id
JOIN exams e ON e.id = ea.exam_id
WHERE (p.full_name ILIKE '%elamaran%' OR p.username ILIKE '%elamaran%')
  AND ea.status IN ('submitted', 'evaluated')
ORDER BY ea.created_at DESC
LIMIT 10;

-- ============================================
-- PART 2: Detailed Answer Analysis
-- ============================================

-- Replace 'YOUR_ATTEMPT_ID' with actual attempt_id from Part 1
-- Example: WHERE ea.attempt_id = '123e4567-e89b-12d3-a456-426614174000'

SELECT 
  ea.id as answer_id,
  ea.attempt_id,
  q.question_text,
  q.question_type,
  q.correct_answer,
  ea.student_answer,
  ea.student_answer IS NOT NULL as has_answer,
  CASE 
    WHEN ea.student_answer IS NULL THEN '❌ NOT ANSWERED'
    WHEN ea.student_answer::text = '""' THEN '❌ EMPTY ANSWER'
    WHEN ea.student_answer::text = 'null' THEN '❌ NULL ANSWER'
    ELSE '✅ HAS ANSWER'
  END as answer_status,
  ea.marks_allocated,
  ea.is_correct,
  ea.marks_obtained,
  ea.created_at as answered_at,
  ea.evaluated_at
FROM exam_answers ea
JOIN questions q ON q.id = ea.question_id
WHERE ea.attempt_id = 'YOUR_ATTEMPT_ID'  -- REPLACE THIS
ORDER BY ea.created_at;

-- ============================================
-- PART 3: Question vs Answer Count Comparison
-- ============================================

WITH attempt_details AS (
  SELECT 
    ea.id as attempt_id,
    ea.exam_id,
    e.question_paper_id,
    e.title as exam_title,
    p.full_name as student_name
  FROM exam_attempts ea
  JOIN exams e ON e.id = ea.exam_id
  JOIN profiles p ON p.id = ea.student_id
  WHERE ea.id = 'YOUR_ATTEMPT_ID'  -- REPLACE THIS
),
question_list AS (
  SELECT 
    qpq.question_id,
    q.question_text,
    q.question_type,
    q.marks
  FROM question_paper_questions qpq
  JOIN questions q ON q.id = qpq.question_id
  WHERE qpq.question_paper_id = (SELECT question_paper_id FROM attempt_details)
),
answer_list AS (
  SELECT 
    ea.question_id,
    ea.student_answer,
    ea.created_at
  FROM exam_answers ea
  WHERE ea.attempt_id = (SELECT attempt_id FROM attempt_details)
)
SELECT 
  ql.question_id,
  ql.question_text,
  ql.question_type,
  ql.marks,
  al.student_answer,
  al.created_at as answered_at,
  CASE 
    WHEN al.question_id IS NULL THEN '❌ NOT SAVED'
    WHEN al.student_answer IS NULL THEN '❌ NULL ANSWER'
    WHEN al.student_answer::text = '""' THEN '❌ EMPTY'
    ELSE '✅ SAVED'
  END as save_status
FROM question_list ql
LEFT JOIN answer_list al ON al.question_id = ql.question_id
ORDER BY ql.question_id;

-- ============================================
-- PART 4: Summary Statistics
-- ============================================

SELECT 
  'Total Attempts' as metric,
  COUNT(*) as count
FROM exam_attempts
WHERE status IN ('submitted', 'evaluated')

UNION ALL

SELECT 
  'Attempts with 0 Answers' as metric,
  COUNT(*) as count
FROM exam_attempts ea
WHERE ea.status IN ('submitted', 'evaluated')
  AND (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = ea.id) = 0

UNION ALL

SELECT 
  'Attempts with Partial Answers' as metric,
  COUNT(*) as count
FROM exam_attempts ea
JOIN exams e ON e.id = ea.exam_id
WHERE ea.status IN ('submitted', 'evaluated')
  AND (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = ea.id) > 0
  AND (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = ea.id) < 
      (SELECT COUNT(*) FROM question_paper_questions WHERE question_paper_id = e.question_paper_id)

UNION ALL

SELECT 
  'Attempts with All Answers' as metric,
  COUNT(*) as count
FROM exam_attempts ea
JOIN exams e ON e.id = ea.exam_id
WHERE ea.status IN ('submitted', 'evaluated')
  AND (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = ea.id) = 
      (SELECT COUNT(*) FROM question_paper_questions WHERE question_paper_id = e.question_paper_id);

-- ============================================
-- PART 5: Check RLS Policies
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'exam_answers'
ORDER BY policyname;

-- ============================================
-- PART 6: Recent Answer Activity
-- ============================================

SELECT 
  ea.id as answer_id,
  ea.created_at,
  ea.updated_at,
  p.full_name as student_name,
  e.title as exam_title,
  q.question_type,
  ea.student_answer IS NOT NULL as has_answer,
  LENGTH(ea.student_answer::text) as answer_length
FROM exam_answers ea
JOIN exam_attempts eat ON eat.id = ea.attempt_id
JOIN profiles p ON p.id = eat.student_id
JOIN exams e ON e.id = eat.exam_id
JOIN questions q ON q.id = ea.question_id
ORDER BY ea.created_at DESC
LIMIT 20;

-- ============================================
-- INSTRUCTIONS
-- ============================================

/*
HOW TO USE THIS SCRIPT:

1. Run PART 1 first to find Elamaran S's attempt_id
   - Look for the row with "science 2" exam
   - Note the attempt_id value
   - Check the storage_status column

2. Copy the attempt_id from Part 1

3. Replace 'YOUR_ATTEMPT_ID' in PART 2 and PART 3 with the actual ID

4. Run PART 2 to see detailed answer data
   - Check if student_answer column has data
   - Look for answer_status column

5. Run PART 3 to see which questions are missing answers
   - Shows all questions vs saved answers
   - Identifies gaps

6. Run PART 4 to see overall statistics
   - How many attempts have no answers
   - How many have partial answers

7. Run PART 5 to check RLS policies
   - Verify students can insert/update answers

8. Run PART 6 to see recent answer activity
   - Check if answers are being saved at all

EXPECTED RESULTS:

If data storage is working:
- PART 1: storage_status = '✅ ALL ANSWERS SAVED'
- PART 2: All rows show answer_status = '✅ HAS ANSWER'
- PART 3: All rows show save_status = '✅ SAVED'
- PART 4: Most attempts in 'All Answers' category

If data storage is broken:
- PART 1: storage_status = '❌ NO ANSWERS SAVED'
- PART 2: No rows returned (no answers)
- PART 3: All rows show save_status = '❌ NOT SAVED'
- PART 4: Many attempts in '0 Answers' category

TROUBLESHOOTING:

If no answers are saved:
1. Check RLS policies (PART 5)
2. Check browser console for errors
3. Verify network requests are successful
4. Test manual insert:
   INSERT INTO exam_answers (attempt_id, question_id, student_answer, marks_allocated)
   VALUES ('test-id', 'test-id', '"test"'::jsonb, 1);

If partial answers are saved:
1. Check which question types are missing
2. Verify answer format for those types
3. Check if specific questions have issues
4. Look for patterns (e.g., all short answer missing)
*/
