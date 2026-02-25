# Backfill Script for Missing Exam Answers

## Problem
Some students have incomplete exam results (e.g., 19/20 questions) because they skipped questions during the exam and those questions were never saved to the database.

## Solution
This script will backfill the missing answers with NULL values so that all students have complete answer sheets.

## SQL Script to Backfill Missing Answers

```sql
-- Backfill missing exam answers for all incomplete attempts
-- This will insert NULL answers for questions that were skipped

DO $$
DECLARE
  missing_record RECORD;
  inserted_count INTEGER := 0;
BEGIN
  -- Find all missing answers and insert them
  FOR missing_record IN
    SELECT DISTINCT
      ea.id as attempt_id,
      qpq.question_id,
      q.marks as marks_allocated,
      e.title as exam_title,
      p.full_name as student_name,
      qpq.display_order
    FROM exam_attempts ea
    JOIN exams e ON e.id = ea.exam_id
    JOIN profiles p ON p.id = ea.student_id
    JOIN question_papers qp ON qp.id = e.question_paper_id
    JOIN question_paper_questions qpq ON qpq.question_paper_id = qp.id
    JOIN questions q ON q.id = qpq.question_id
    WHERE ea.status IN ('submitted', 'evaluated')
    AND NOT EXISTS (
      SELECT 1 
      FROM exam_answers ans 
      WHERE ans.attempt_id = ea.id 
      AND ans.question_id = qpq.question_id
    )
    ORDER BY ea.submitted_at, qpq.display_order
  LOOP
    -- Insert the missing answer with NULL student_answer
    INSERT INTO exam_answers (
      attempt_id,
      question_id,
      student_answer,
      marks_allocated,
      is_correct,
      marks_obtained
    ) VALUES (
      missing_record.attempt_id,
      missing_record.question_id,
      NULL,
      missing_record.marks_allocated,
      false, -- Mark as incorrect since it wasn't answered
      0      -- 0 marks for unanswered questions
    );
    
    inserted_count := inserted_count + 1;
    
    RAISE NOTICE 'Backfilled: % - % - Question %', 
      missing_record.exam_title, 
      missing_record.student_name,
      missing_record.display_order;
  END LOOP;
  
  RAISE NOTICE 'Total missing answers backfilled: %', inserted_count;
END $$;
```

## Verification Query

After running the backfill script, verify that all attempts now have complete answer sheets:

```sql
-- Verify all attempts have complete answer sheets
SELECT 
  e.title as exam_title,
  p.full_name as student_name,
  ea.status,
  COUNT(ans.id) as answer_count,
  (
    SELECT COUNT(*) 
    FROM question_paper_questions qpq 
    WHERE qpq.question_paper_id = e.question_paper_id
  ) as expected_questions,
  CASE 
    WHEN COUNT(ans.id) = (
      SELECT COUNT(*) 
      FROM question_paper_questions qpq 
      WHERE qpq.question_paper_id = e.question_paper_id
    ) THEN '✅ COMPLETE'
    ELSE '❌ INCOMPLETE'
  END as status_check
FROM exams e
JOIN exam_attempts ea ON ea.exam_id = e.id
JOIN profiles p ON p.id = ea.student_id
LEFT JOIN exam_answers ans ON ans.attempt_id = ea.id
WHERE ea.status IN ('submitted', 'evaluated')
GROUP BY e.id, e.title, ea.id, p.full_name, e.question_paper_id, ea.status
ORDER BY status_check DESC, ea.submitted_at DESC;
```

## Specific Cases to Backfill

Based on the current database state, these attempts need backfilling:

### 1. Akshaya A - Series 1_12
- **Attempt ID**: `1da24a10-3ba9-4ab6-a2ea-843f66c7f9fd`
- **Missing**: Question 16 (display_order: 16)
- **Question ID**: `9b0e554b-d09c-4696-8a29-f666ee370441`
- **Question**: "Synonyms - gnaw"

```sql
INSERT INTO exam_answers (
  attempt_id,
  question_id,
  student_answer,
  marks_allocated,
  is_correct,
  marks_obtained
) VALUES (
  '1da24a10-3ba9-4ab6-a2ea-843f66c7f9fd',
  '9b0e554b-d09c-4696-8a29-f666ee370441',
  NULL,
  1,
  false,
  0
);
```

### 2. Sakthipriya V - Series 1_10
- **Attempt ID**: `7b91259c-62df-4da3-bc41-855b494f4e5b`
- **Missing**: 1 question (need to identify)

### 3. Hasini K - Series 1_3
- **Attempt ID**: `b9cd588c-75a5-4a7d-902b-ce9d86488969`
- **Missing**: 2 questions (need to identify)

### 4. Sakthipriya V - Series 1_3
- **Attempt ID**: `a2c32124-41fe-4ad0-98d5-2ac218859a55`
- **Missing**: 2 questions (need to identify)

### 5. Elamaran S - Series 1_3
- **Attempt ID**: `4ec36ccb-15f8-4dcf-88df-2041644b6a0f`
- **Missing**: 2 questions (need to identify)

### 6. Janani D - Series 1_1
- **Attempt ID**: `cd14a123-26b0-4cd5-9e1e-71c0e8ad474a`
- **Missing**: 4 questions (need to identify)

## How to Run

### Option 1: Run the Complete Backfill Script (Recommended)

This will automatically find and backfill ALL missing answers:

```sql
-- Run the DO block above
```

### Option 2: Manual Backfill for Specific Cases

If you prefer to backfill specific cases manually:

1. Find missing questions for each attempt:
```sql
SELECT 
  qpq.display_order,
  qpq.question_id,
  q.question_text,
  q.marks
FROM question_paper_questions qpq
JOIN questions q ON q.id = qpq.question_id
JOIN question_papers qp ON qp.id = qpq.question_paper_id
JOIN exams e ON e.question_paper_id = qp.id
LEFT JOIN exam_answers ea ON ea.question_id = qpq.question_id AND ea.attempt_id = 'ATTEMPT_ID_HERE'
WHERE e.id = 'EXAM_ID_HERE'
AND ea.id IS NULL
ORDER BY qpq.display_order;
```

2. Insert missing answers:
```sql
INSERT INTO exam_answers (
  attempt_id,
  question_id,
  student_answer,
  marks_allocated,
  is_correct,
  marks_obtained
) VALUES (
  'ATTEMPT_ID_HERE',
  'QUESTION_ID_HERE',
  NULL,
  MARKS_HERE,
  false,
  0
);
```

## After Backfilling

### 1. Recalculate Exam Results

After backfilling, you may need to recalculate the exam results to ensure the total marks and percentages are correct:

```sql
-- Recalculate total marks for affected attempts
UPDATE exam_attempts ea
SET 
  total_marks_obtained = (
    SELECT COALESCE(SUM(marks_obtained), 0)
    FROM exam_answers
    WHERE attempt_id = ea.id
  ),
  percentage = (
    SELECT COALESCE(SUM(marks_obtained), 0) * 100.0 / e.total_marks
    FROM exam_answers ans
    JOIN exams e ON e.id = ea.exam_id
    WHERE ans.attempt_id = ea.id
  )
WHERE ea.id IN (
  SELECT DISTINCT ea2.id
  FROM exam_attempts ea2
  JOIN exam_answers ans ON ans.attempt_id = ea2.id
  WHERE ans.created_at > NOW() - INTERVAL '1 hour' -- Recently backfilled
);
```

### 2. Notify Students

If the backfill changes any results (e.g., from pass to fail), you should notify the affected students.

## Prevention

The enhanced code now ensures that:
1. All questions are saved during submission (including skipped ones)
2. Detailed logging helps identify issues immediately
3. Verification step confirms all questions are saved

This issue should not occur for new exam submissions.

## Notes

- Backfilled answers will have `student_answer = NULL`
- Backfilled answers will have `is_correct = false` and `marks_obtained = 0`
- Backfilled answers will have `created_at` timestamp of when the backfill was run
- Original answers (if any) will not be affected

## Safety

The backfill script:
- Only affects attempts with status 'submitted' or 'evaluated'
- Only inserts answers that don't already exist (uses NOT EXISTS check)
- Does not modify existing answers
- Can be run multiple times safely (idempotent)

---

**Last Updated**: 2025-12-11
**Status**: Ready to execute
