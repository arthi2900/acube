# Debugging Guide: 19/20 Questions Issue

## Problem
Student still seeing only 19 questions in exam result instead of 20.

## Enhanced Logging

The code now includes detailed logging to help identify the issue. When a student submits an exam, check the browser console for these logs:

### 1. Question Processing Logs

For each question, you'll see:
```javascript
Processing question 1/20: {
  display_order: 1,
  question_id: "uuid-here",
  has_answer: true,
  marks: 1,
  answer: "Paris"
}
```

**What to check:**
- Are all 20 questions being processed?
- Does each question have valid `marks` value?
- Is `question_id` present for all questions?

### 2. Save Success/Failure Logs

For each save attempt:
```javascript
✅ Saved question 1: {
  status: "answered",
  saved_id: "uuid-here"
}
```

OR

```javascript
❌ Failed to save question 1: {
  error: "error message here",
  question_id: "uuid-here",
  attempt_id: "uuid-here"
}
```

**What to check:**
- Are all 20 questions showing ✅ success?
- If any show ❌ failure, what's the error message?
- Common errors:
  - "new row violates row-level security policy" → RLS policy issue
  - "null value in column marks_allocated" → Marks not found
  - "duplicate key value" → Unique constraint issue

### 3. Verification Logs

After saving all questions:
```javascript
Verification: 20 of 20 questions saved
✅ All questions saved successfully
```

OR

```javascript
Verification: 19 of 20 questions saved
⚠️ WARNING: Only 19 of 20 questions saved!
Missing questions: [{
  display_order: 11,
  question_id: "uuid-here"
}]
```

**What to check:**
- Does verification show all 20 questions saved?
- If not, which question(s) are missing?
- Check the missing question's display_order and question_id

## Common Issues and Solutions

### Issue 1: RLS Policy Blocking Inserts

**Symptom**: Error message contains "row-level security policy"

**Cause**: The RLS policy only allows INSERT when attempt status is 'in_progress', but the status might have changed.

**Solution**: Check the exam_attempts table to verify the attempt status is still 'in_progress' when saving answers.

```sql
-- Check attempt status
SELECT id, status, student_id, exam_id
FROM exam_attempts
WHERE id = 'attempt-id-here';
```

### Issue 2: Missing Marks

**Symptom**: Error message contains "null value in column marks_allocated"

**Cause**: Some questions don't have marks defined in the questions table.

**Solution**: Check if all questions have marks:

```sql
-- Check questions without marks
SELECT q.id, q.question_text, q.marks
FROM questions q
JOIN question_paper_questions qpq ON qpq.question_id = q.id
JOIN question_papers qp ON qp.id = qpq.question_paper_id
JOIN exams e ON e.question_paper_id = qp.id
WHERE e.id = 'exam-id-here'
AND (q.marks IS NULL OR q.marks = 0);
```

**Fix**: The code now defaults to 1 mark if marks are not found.

### Issue 3: Question Not Loaded

**Symptom**: Only 19 questions in the `questions` array

**Cause**: Question paper might only have 19 questions assigned.

**Solution**: Check the question paper:

```sql
-- Check how many questions are in the paper
SELECT COUNT(*) as question_count
FROM question_paper_questions qpq
JOIN question_papers qp ON qp.id = qpq.question_paper_id
JOIN exams e ON e.question_paper_id = qp.id
WHERE e.id = 'exam-id-here';
```

### Issue 4: Duplicate Question IDs

**Symptom**: Error message contains "duplicate key value"

**Cause**: Trying to insert the same question twice.

**Solution**: Check for duplicate question_ids in the question paper:

```sql
-- Check for duplicate questions
SELECT question_id, COUNT(*) as count
FROM question_paper_questions qpq
JOIN question_papers qp ON qp.id = qpq.question_paper_id
JOIN exams e ON e.question_paper_id = qp.id
WHERE e.id = 'exam-id-here'
GROUP BY question_id
HAVING COUNT(*) > 1;
```

## Step-by-Step Debugging Process

### Step 1: Check Console Logs

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Have student submit the exam
4. Look for the logs mentioned above
5. Take screenshots of any errors

### Step 2: Verify Question Count

Check if all 20 questions are loaded:

```sql
-- Get exam details
SELECT 
  e.id as exam_id,
  e.title,
  qp.id as question_paper_id,
  COUNT(qpq.id) as question_count
FROM exams e
JOIN question_papers qp ON qp.id = e.question_paper_id
JOIN question_paper_questions qpq ON qpq.question_paper_id = qp.id
WHERE e.id = 'exam-id-here'
GROUP BY e.id, e.title, qp.id;
```

### Step 3: Check Saved Answers

After submission, check how many answers were saved:

```sql
-- Get saved answers count
SELECT 
  ea.attempt_id,
  COUNT(ea.id) as saved_answers,
  ea2.exam_id
FROM exam_answers ea
JOIN exam_attempts ea2 ON ea2.id = ea.attempt_id
WHERE ea.attempt_id = 'attempt-id-here'
GROUP BY ea.attempt_id, ea2.exam_id;
```

### Step 4: Find Missing Question

If only 19 answers saved, find which question is missing:

```sql
-- Find missing question
SELECT 
  qpq.display_order,
  qpq.question_id,
  q.question_text,
  q.marks
FROM question_paper_questions qpq
JOIN questions q ON q.id = qpq.question_id
JOIN question_papers qp ON qp.id = qpq.question_paper_id
JOIN exams e ON e.question_paper_id = qp.id
JOIN exam_attempts ea ON ea.exam_id = e.id
WHERE ea.id = 'attempt-id-here'
AND qpq.question_id NOT IN (
  SELECT question_id 
  FROM exam_answers 
  WHERE attempt_id = 'attempt-id-here'
)
ORDER BY qpq.display_order;
```

### Step 5: Check Question Details

For the missing question, check its details:

```sql
-- Get question details
SELECT 
  q.id,
  q.question_text,
  q.question_type,
  q.marks,
  q.correct_answer,
  q.options,
  qpq.display_order
FROM questions q
JOIN question_paper_questions qpq ON qpq.question_id = q.id
WHERE q.id = 'missing-question-id-here';
```

## Testing Checklist

To reproduce and fix the issue:

1. [ ] Create a test exam with exactly 20 questions
2. [ ] Have a student start the exam
3. [ ] Answer 19 questions
4. [ ] Skip 1 question (visit but don't answer)
5. [ ] Open browser console before submitting
6. [ ] Submit the exam
7. [ ] Check console logs for errors
8. [ ] Check database for saved answers count
9. [ ] If count is 19, follow debugging steps above
10. [ ] Share console logs and SQL query results

## Quick SQL Diagnostic Script

Run this script to get a complete diagnostic:

```sql
-- Replace these values
\set exam_id 'your-exam-id-here'
\set attempt_id 'your-attempt-id-here'

-- 1. Check exam and question paper
SELECT 
  e.id as exam_id,
  e.title,
  qp.id as question_paper_id,
  COUNT(DISTINCT qpq.id) as questions_in_paper
FROM exams e
JOIN question_papers qp ON qp.id = e.question_paper_id
LEFT JOIN question_paper_questions qpq ON qpq.question_paper_id = qp.id
WHERE e.id = :'exam_id'
GROUP BY e.id, e.title, qp.id;

-- 2. Check attempt status
SELECT 
  id,
  exam_id,
  student_id,
  status,
  started_at,
  submitted_at
FROM exam_attempts
WHERE id = :'attempt_id';

-- 3. Check saved answers count
SELECT 
  COUNT(*) as saved_answers_count
FROM exam_answers
WHERE attempt_id = :'attempt_id';

-- 4. Find missing questions (if any)
SELECT 
  qpq.display_order,
  qpq.question_id,
  q.question_text,
  q.marks,
  CASE 
    WHEN ea.id IS NULL THEN 'MISSING'
    ELSE 'SAVED'
  END as status
FROM question_paper_questions qpq
JOIN questions q ON q.id = qpq.question_id
JOIN question_papers qp ON qp.id = qpq.question_paper_id
JOIN exams e ON e.question_paper_id = qp.id
JOIN exam_attempts ea2 ON ea2.exam_id = e.id
LEFT JOIN exam_answers ea ON ea.question_id = qpq.question_id AND ea.attempt_id = :'attempt_id'
WHERE ea2.id = :'attempt_id'
ORDER BY qpq.display_order;
```

## Enhanced Code Changes

The code has been updated with:

1. **Better Error Handling**: Each question save is wrapped in try-catch
2. **Detailed Logging**: Logs show question details, save status, and errors
3. **Default Marks**: If marks not found, defaults to 1 instead of 0
4. **Verification**: After saving, verifies all questions are in database
5. **Missing Question Report**: If verification fails, logs which questions are missing

## Next Steps

1. **Test with the enhanced logging**
2. **Share console logs** if issue persists
3. **Run SQL diagnostic script** to check database state
4. **Check for RLS policy issues** if errors mention security
5. **Verify question paper** has all 20 questions

## Contact Information

If issue persists after following this guide:
1. Share browser console logs (screenshots or text)
2. Share SQL diagnostic script results
3. Share exam ID and attempt ID
4. Describe exact steps to reproduce

---

**Last Updated**: 2025-12-11
**Status**: Enhanced logging and error handling implemented
