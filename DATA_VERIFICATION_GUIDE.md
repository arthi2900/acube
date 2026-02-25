# Quick Data Verification Guide

## How to Check if Student Actually Has Answers

### Step 1: Open Browser Console
1. Navigate to the Student Exam Detail page
2. Press **F12** (or right-click → Inspect)
3. Click on the **Console** tab
4. Look for these log messages:

```
Loading exam details for: { examId: "...", studentId: "..." }
Exam data loaded: { ... }
All attempts for exam: [ ... ]
Student attempt found: { id: "...", status: "submitted", ... }
Fetching answers for attempt ID: "..."
Answers data received: [ ... ]
Number of answers: X
```

### Step 2: Interpret the Console Output

#### ✅ **Good Case** (Answers Exist):
```javascript
Number of answers: 8
First answer sample: {
  id: "...",
  attempt_id: "...",
  question_id: "...",
  student_answer: "A",
  is_correct: true,
  marks_obtained: 5,
  question: {
    id: "...",
    question_text: "What is 2+2?",
    question_type: "mcq",
    ...
  }
}
```
**Action:** Answers should display. If not, there's a rendering issue.

---

#### ❌ **Problem Case 1** (No Answers):
```javascript
Number of answers: 0
```
**Meaning:** Student submitted without answering questions.

**Verify in Database:**
```sql
SELECT COUNT(*) FROM exam_answers 
WHERE attempt_id = 'ATTEMPT_ID_FROM_CONSOLE';
```

If count is 0, the student truly didn't answer.

---

#### ❌ **Problem Case 2** (No Attempt Found):
```javascript
No attempt found for student: "student-id-123"
Available student IDs in attempts: ["other-id-1", "other-id-2"]
```
**Meaning:** Student ID mismatch or student not allocated to exam.

**Verify:**
1. Check if the student ID in the URL is correct
2. Check if student was allocated to this exam

---

#### ❌ **Problem Case 3** (Questions Missing):
```javascript
Number of answers: 8
First answer sample: {
  ...
  question: null  // ← Problem!
}
```
**Meaning:** Questions were deleted or join failed.

**Verify in Database:**
```sql
SELECT ea.*, q.id as question_exists
FROM exam_answers ea
LEFT JOIN questions q ON q.id = ea.question_id
WHERE ea.attempt_id = 'ATTEMPT_ID';
```

---

#### ❌ **Problem Case 4** (Permission Error):
```javascript
Error details: {
  code: "PGRST116",
  message: "permission denied for table exam_answers"
}
```
**Meaning:** RLS policy blocking access.

**Verify:**
Check if you're the teacher who created the exam, or if you're a principal/admin.

---

### Step 3: Database Queries (For Admins)

#### Check Exam Attempt:
```sql
SELECT 
  ea.id,
  ea.exam_id,
  ea.student_id,
  ea.status,
  ea.started_at,
  ea.submitted_at,
  ea.total_marks_obtained,
  p.username as student_name
FROM exam_attempts ea
JOIN profiles p ON p.id = ea.student_id
WHERE ea.exam_id = 'YOUR_EXAM_ID'
AND ea.student_id = 'YOUR_STUDENT_ID';
```

#### Check Answers Count:
```sql
SELECT 
  COUNT(*) as total_answers,
  COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_answers,
  COUNT(CASE WHEN is_correct = false THEN 1 END) as incorrect_answers,
  SUM(marks_obtained) as total_marks
FROM exam_answers
WHERE attempt_id = 'YOUR_ATTEMPT_ID';
```

#### Check Answers with Questions:
```sql
SELECT 
  ea.id,
  ea.student_answer,
  ea.is_correct,
  ea.marks_obtained,
  ea.marks_allocated,
  q.question_text,
  q.question_type,
  q.correct_answer
FROM exam_answers ea
LEFT JOIN questions q ON q.id = ea.question_id
WHERE ea.attempt_id = 'YOUR_ATTEMPT_ID'
ORDER BY ea.created_at;
```

#### Check if Questions Exist:
```sql
SELECT 
  ea.question_id,
  CASE 
    WHEN q.id IS NOT NULL THEN 'EXISTS'
    ELSE 'DELETED'
  END as question_status
FROM exam_answers ea
LEFT JOIN questions q ON q.id = ea.question_id
WHERE ea.attempt_id = 'YOUR_ATTEMPT_ID';
```

---

### Step 4: Common Fixes

#### Fix 1: Student Didn't Answer
**No fix needed** - This is expected behavior.

**Options:**
- Allow student to retake exam
- Mark as incomplete
- Contact student to verify

---

#### Fix 2: RLS Permission Issue
**For Admins:**
```sql
-- Verify teacher policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'exam_answers' 
AND policyname LIKE '%teacher%';

-- If missing, add policy:
CREATE POLICY "Teachers can view answers for their exams" ON exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_attempts ea
      JOIN exams e ON e.id = ea.exam_id
      WHERE ea.id = exam_answers.attempt_id 
      AND e.teacher_id = auth.uid()
    )
  );
```

---

#### Fix 3: Questions Deleted
**Prevention:**
Never delete questions that are used in exams.

**Recovery:**
If questions are deleted, you'll need to restore from backup or recreate them.

---

### Step 5: Test Scenarios

#### Test 1: Verify Your Access
```javascript
// In browser console on the student detail page
// Check if you can see the data
console.log('Current user:', await supabase.auth.getUser());
console.log('Exam ID:', window.location.pathname.split('/')[3]);
console.log('Student ID:', window.location.pathname.split('/')[5]);
```

#### Test 2: Check API Response
1. Open Network tab in Developer Tools
2. Reload the page
3. Find the request to `/rest/v1/exam_answers`
4. Check:
   - Status code (should be 200)
   - Response body (should have data array)
   - Request headers (should have auth token)

---

## Quick Decision Tree

```
Is status "Submitted" or "Evaluated"?
├─ NO → Student hasn't finished yet
│       └─ Wait for submission
│
└─ YES → Check console logs
         │
         ├─ "Number of answers: 0"
         │  └─ Student didn't answer questions
         │     └─ Verify in database
         │        ├─ Count = 0 → Expected behavior
         │        └─ Count > 0 → RLS or join issue
         │
         ├─ "No attempt found"
         │  └─ Student ID mismatch
         │     └─ Check URL and allocation
         │
         ├─ "question: null"
         │  └─ Questions deleted
         │     └─ Check questions table
         │
         └─ "permission denied"
            └─ RLS blocking access
               └─ Verify user role and policies
```

---

## Expected Console Output (Normal Case)

```javascript
// When everything works correctly:
Loading exam details for: {examId: "abc-123", studentId: "def-456"}

Exam data loaded: {
  id: "abc-123",
  title: "Science 1",
  total_marks: 8,
  ...
}

All attempts for exam: [
  {id: "attempt-1", student_id: "def-456", status: "submitted"},
  {id: "attempt-2", student_id: "ghi-789", status: "submitted"}
]

Student attempt found: {
  id: "attempt-1",
  exam_id: "abc-123",
  student_id: "def-456",
  status: "submitted",
  total_marks_obtained: 0,
  percentage: 0
}

Fetching answers for attempt ID: attempt-1

Answers data received: [
  {
    id: "ans-1",
    attempt_id: "attempt-1",
    question_id: "q-1",
    student_answer: "A",
    is_correct: true,
    marks_obtained: 1,
    marks_allocated: 1,
    question: {
      id: "q-1",
      question_text: "Question 1?",
      question_type: "mcq",
      options: ["A", "B", "C", "D"],
      correct_answer: "A"
    }
  },
  // ... more answers
]

Number of answers: 8

First answer sample: {
  id: "ans-1",
  student_answer: "A",
  is_correct: true,
  question: { question_text: "Question 1?", ... }
}
```

---

## What to Report to Support

If you need to report an issue, provide:

1. **Screenshot of console logs** (all of them)
2. **Screenshot of the page** showing the issue
3. **Exam ID** (from URL or console)
4. **Student ID** (from URL or console)
5. **Attempt ID** (from console logs)
6. **Your role** (Teacher/Principal/Admin)
7. **Database query results** (if you have access):
   ```sql
   SELECT COUNT(*) FROM exam_answers 
   WHERE attempt_id = 'ATTEMPT_ID';
   ```

---

## Summary

**Most Common Cause:** Student submitted without answering (0 answers in database)

**How to Verify:** Check console logs for "Number of answers: 0"

**What to Do:** 
- If count is 0 in database → Expected behavior, student didn't answer
- If count > 0 in database → Technical issue, check RLS and joins
- If no attempt found → Student ID mismatch or allocation issue

**Key Console Log to Watch:**
```
Number of answers: X
```
- If X = 0 → Student didn't answer
- If X > 0 → Answers should display (if not, rendering issue)

---

**Remember:** The enhanced error messages on the page will guide you to the likely cause!
