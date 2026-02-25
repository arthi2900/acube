# Data Storage Verification Guide

## Issue Investigation

You mentioned that a student attended all questions but the data might not be stored properly. Let's verify the complete data flow.

---

## Current Data Flow

### 1. Answer Selection (Frontend)
**File:** `src/pages/student/TakeExam.tsx`

**Function:** `handleAnswerChange(questionId, answer)`
```typescript
const handleAnswerChange = async (questionId: string, answer: any) => {
  // 1. Update local state immediately
  setAnswers({ ...answers, [questionId]: answer });

  // 2. Save to database
  if (attempt) {
    try {
      await examAnswerApi.saveAnswer({
        attempt_id: attempt.id,
        question_id: questionId,
        student_answer: answer,
        marks_allocated: questions.find(q => q.question_id === questionId)?.question?.marks || 0,
      });
    } catch (error: any) {
      console.error('Failed to save answer:', error);
    }
  }
};
```

**Trigger Points:**
- MCQ: When radio button is clicked
- True/False: When radio button is clicked
- Short Answer: When textarea loses focus (onBlur)
- Multiple Response: When checkbox is checked/unchecked
- Match the Following: When dropdown selection changes

### 2. API Layer
**File:** `src/db/api.ts`

**Function:** `examAnswerApi.saveAnswer()`
```typescript
async saveAnswer(answer: Omit<ExamAnswer, 'id' | 'created_at' | 'updated_at' | 'is_correct' | 'marks_obtained' | 'evaluated_by' | 'evaluated_at'>): Promise<ExamAnswer> {
  const { data, error } = await supabase
    .from('exam_answers')
    .upsert({
      attempt_id: answer.attempt_id,
      question_id: answer.question_id,
      student_answer: answer.student_answer,
      marks_allocated: answer.marks_allocated,
    }, {
      onConflict: 'attempt_id,question_id',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

**Key Points:**
- Uses `upsert` to insert or update
- Conflict resolution on `(attempt_id, question_id)` pair
- Returns the saved record

### 3. Database Schema
**Table:** `exam_answers`

```sql
CREATE TABLE exam_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES exam_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  student_answer jsonb,              -- Stores the answer
  is_correct boolean,                 -- Set during grading
  marks_obtained numeric DEFAULT 0,  -- Set during grading
  marks_allocated numeric NOT NULL,  -- Maximum marks for question
  evaluated_by uuid REFERENCES profiles(id),
  evaluated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(attempt_id, question_id)    -- Ensures one answer per question per attempt
);
```

---

## Verification Steps

### Step 1: Check Browser Console During Exam

1. **Open exam as student**
2. **Open browser console (F12)**
3. **Answer a question**
4. **Look for logs:**
   ```javascript
   // Success case:
   No error logs
   
   // Failure case:
   Failed to save answer: <error message>
   ```

### Step 2: Check Network Tab

1. **Open browser DevTools → Network tab**
2. **Filter by "exam_answers"**
3. **Answer a question**
4. **Verify request:**
   - Method: POST
   - URL: `/rest/v1/exam_answers`
   - Status: 200 or 201
   - Response: Contains saved answer data

### Step 3: Query Database Directly

**Check if answers exist for a specific attempt:**

```sql
-- Replace with actual attempt_id
SELECT 
  ea.id,
  ea.attempt_id,
  ea.question_id,
  ea.student_answer,
  ea.marks_allocated,
  ea.created_at,
  q.question_text,
  q.question_type
FROM exam_answers ea
JOIN questions q ON q.id = ea.question_id
WHERE ea.attempt_id = 'YOUR_ATTEMPT_ID_HERE'
ORDER BY ea.created_at;
```

**Expected Result:**
- Should return one row per answered question
- `student_answer` should contain the answer data
- `marks_allocated` should match question marks

### Step 4: Check Attempt Status

```sql
-- Check attempt details
SELECT 
  ea.id as attempt_id,
  ea.student_id,
  ea.exam_id,
  ea.status,
  ea.started_at,
  ea.submitted_at,
  ea.total_marks_obtained,
  ea.percentage,
  ea.result,
  p.full_name as student_name,
  e.title as exam_title,
  (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = ea.id) as answers_count
FROM exam_attempts ea
JOIN profiles p ON p.id = ea.student_id
JOIN exams e ON e.id = ea.exam_id
WHERE ea.id = 'YOUR_ATTEMPT_ID_HERE';
```

**Expected Result:**
- `answers_count` should match number of questions answered
- `status` should be 'submitted' or 'evaluated'

---

## Common Issues and Solutions

### Issue 1: Answers Not Saving (Silent Failure)

**Symptoms:**
- Student answers questions
- No error messages
- Database shows 0 answers

**Possible Causes:**
1. **RLS Policy Blocking Inserts**
   - Check if student has permission to insert into `exam_answers`
   
2. **Network Error (Silent)**
   - Check browser console for network errors
   - Check if API endpoint is accessible

3. **Invalid Data Format**
   - Check if answer format matches expected type

**Solution:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'exam_answers';

-- Verify student can insert
-- Run this as the student user
INSERT INTO exam_answers (attempt_id, question_id, student_answer, marks_allocated)
VALUES ('test-attempt-id', 'test-question-id', '"test answer"'::jsonb, 1);
```

### Issue 2: Answers Saving But Not Loading

**Symptoms:**
- Answers saved successfully
- When student returns to exam, answers are gone
- Database shows answers exist

**Possible Causes:**
1. **RLS Policy Blocking Reads**
   - Student can't read their own answers
   
2. **Wrong Attempt ID**
   - Loading answers for different attempt

**Solution:**
```sql
-- Check if student can read their answers
SELECT * FROM exam_answers 
WHERE attempt_id = 'YOUR_ATTEMPT_ID'
AND question_id = 'YOUR_QUESTION_ID';

-- If empty, check RLS policy
SELECT * FROM pg_policies 
WHERE tablename = 'exam_answers' 
AND cmd = 'SELECT';
```

### Issue 3: Upsert Conflict

**Symptoms:**
- First answer saves
- Subsequent changes don't update
- Database shows old answer

**Possible Causes:**
1. **Unique Constraint Mismatch**
   - `onConflict` parameter doesn't match actual constraint
   
2. **Missing Update Permission**
   - Student can insert but not update

**Solution:**
```sql
-- Check unique constraints
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'exam_answers'::regclass
AND contype = 'u';

-- Should show: UNIQUE(attempt_id, question_id)
```

### Issue 4: Answer Format Issues

**Symptoms:**
- Some answers save, others don't
- Specific question types fail

**Possible Causes:**
1. **Invalid JSON Format**
   - Answer not properly formatted as JSON
   
2. **Type Mismatch**
   - Sending string instead of array, etc.

**Solution:**
Check answer formats for each question type:

```typescript
// MCQ
student_answer: "A"  // String

// True/False
student_answer: "true"  // String

// Short Answer
student_answer: "This is my answer"  // String

// Multiple Response
student_answer: ["A", "B", "C"]  // Array

// Match the Following
student_answer: {
  "item1": "match1",
  "item2": "match2"
}  // Object
```

---

## Diagnostic Script

Create a test to verify the complete flow:

### Frontend Test (Browser Console)

```javascript
// Run this in browser console while taking exam
async function testAnswerSaving() {
  console.log('=== ANSWER SAVING TEST ===');
  
  // Get current attempt
  const attemptId = 'YOUR_ATTEMPT_ID';
  const questionId = 'YOUR_QUESTION_ID';
  const testAnswer = "Test Answer";
  
  try {
    // Test save
    console.log('1. Saving answer...');
    const result = await examAnswerApi.saveAnswer({
      attempt_id: attemptId,
      question_id: questionId,
      student_answer: testAnswer,
      marks_allocated: 1
    });
    console.log('✓ Answer saved:', result);
    
    // Test retrieve
    console.log('2. Retrieving answers...');
    const answers = await examAnswerApi.getAnswersByAttempt(attemptId);
    console.log('✓ Answers retrieved:', answers);
    
    // Verify
    const savedAnswer = answers.find(a => a.question_id === questionId);
    if (savedAnswer && savedAnswer.student_answer === testAnswer) {
      console.log('✓ TEST PASSED: Answer saved and retrieved correctly');
    } else {
      console.log('✗ TEST FAILED: Answer mismatch');
      console.log('Expected:', testAnswer);
      console.log('Got:', savedAnswer?.student_answer);
    }
  } catch (error) {
    console.error('✗ TEST FAILED:', error);
  }
}

// Run test
testAnswerSaving();
```

### Database Test (SQL)

```sql
-- Test complete flow
DO $$
DECLARE
  test_attempt_id uuid;
  test_question_id uuid;
  answer_count integer;
BEGIN
  -- Get a real attempt and question
  SELECT id INTO test_attempt_id FROM exam_attempts WHERE status = 'in_progress' LIMIT 1;
  SELECT id INTO test_question_id FROM questions LIMIT 1;
  
  -- Insert test answer
  INSERT INTO exam_answers (attempt_id, question_id, student_answer, marks_allocated)
  VALUES (test_attempt_id, test_question_id, '"Test Answer"'::jsonb, 1)
  ON CONFLICT (attempt_id, question_id) 
  DO UPDATE SET student_answer = '"Test Answer Updated"'::jsonb;
  
  -- Verify
  SELECT COUNT(*) INTO answer_count 
  FROM exam_answers 
  WHERE attempt_id = test_attempt_id 
  AND question_id = test_question_id;
  
  IF answer_count = 1 THEN
    RAISE NOTICE 'TEST PASSED: Answer saved successfully';
  ELSE
    RAISE NOTICE 'TEST FAILED: Answer count = %', answer_count;
  END IF;
END $$;
```

---

## Specific Case: Elamaran S

Based on your mention that "the student attended all questions", let's verify:

### Step 1: Find Elamaran S's Attempt

```sql
SELECT 
  ea.id as attempt_id,
  ea.status,
  ea.started_at,
  ea.submitted_at,
  p.full_name,
  p.username,
  e.title as exam_title,
  (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = ea.id) as answers_saved,
  (SELECT COUNT(*) FROM question_paper_questions qpq 
   WHERE qpq.question_paper_id = e.question_paper_id) as total_questions
FROM exam_attempts ea
JOIN profiles p ON p.id = ea.student_id
JOIN exams e ON e.id = ea.exam_id
WHERE p.full_name LIKE '%Elamaran%'
OR p.username LIKE '%elamaran%'
ORDER BY ea.created_at DESC
LIMIT 5;
```

### Step 2: Check Answers for That Attempt

```sql
-- Replace with actual attempt_id from Step 1
SELECT 
  ea.id,
  q.question_text,
  q.question_type,
  ea.student_answer,
  ea.marks_allocated,
  ea.is_correct,
  ea.marks_obtained,
  ea.created_at
FROM exam_answers ea
JOIN questions q ON q.id = ea.question_id
WHERE ea.attempt_id = 'ELAMARAN_ATTEMPT_ID'
ORDER BY ea.created_at;
```

### Step 3: Compare Counts

```sql
-- Get question count vs answer count
WITH attempt_info AS (
  SELECT 
    ea.id as attempt_id,
    ea.exam_id,
    e.question_paper_id
  FROM exam_attempts ea
  JOIN exams e ON e.id = ea.exam_id
  WHERE ea.id = 'ELAMARAN_ATTEMPT_ID'
)
SELECT 
  (SELECT COUNT(*) FROM question_paper_questions qpq 
   WHERE qpq.question_paper_id = (SELECT question_paper_id FROM attempt_info)) as total_questions,
  (SELECT COUNT(*) FROM exam_answers 
   WHERE attempt_id = (SELECT attempt_id FROM attempt_info)) as answers_saved,
  CASE 
    WHEN (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = (SELECT attempt_id FROM attempt_info)) = 
         (SELECT COUNT(*) FROM question_paper_questions qpq WHERE qpq.question_paper_id = (SELECT question_paper_id FROM attempt_info))
    THEN 'All questions answered'
    ELSE 'Missing answers'
  END as status;
```

---

## Expected Results

### If Data Storage is Working Correctly:

1. **Browser Console:**
   - No "Failed to save answer" errors
   - Network requests return 200/201 status

2. **Database Query:**
   - `answers_saved` = `total_questions`
   - Each answer has valid `student_answer` data
   - `marks_allocated` matches question marks

3. **After Auto-Grading:**
   - `is_correct` is set (true/false)
   - `marks_obtained` is calculated
   - `evaluated_at` timestamp is set

### If Data Storage is NOT Working:

1. **Browser Console:**
   - "Failed to save answer" errors
   - Network requests return 400/403/500 status

2. **Database Query:**
   - `answers_saved` = 0 or < `total_questions`
   - Missing answers for some questions
   - `student_answer` is NULL

3. **After Auto-Grading:**
   - No answers to grade
   - Shows "No answers found"

---

## Fix Recommendations

### If Answers Are Not Saving:

1. **Check RLS Policies:**
   ```sql
   -- Students should be able to insert/update their own answers
   CREATE POLICY "Students can manage their own answers" ON exam_answers
     FOR ALL USING (
       attempt_id IN (
         SELECT id FROM exam_attempts WHERE student_id = auth.uid()
       )
     );
   ```

2. **Add Error Logging:**
   ```typescript
   // In TakeExam.tsx, update handleAnswerChange
   const handleAnswerChange = async (questionId: string, answer: any) => {
     setAnswers({ ...answers, [questionId]: answer });

     if (attempt) {
       try {
         console.log('Saving answer:', { questionId, answer, attemptId: attempt.id });
         const result = await examAnswerApi.saveAnswer({
           attempt_id: attempt.id,
           question_id: questionId,
           student_answer: answer,
           marks_allocated: questions.find(q => q.question_id === questionId)?.question?.marks || 0,
         });
         console.log('Answer saved successfully:', result);
       } catch (error: any) {
         console.error('Failed to save answer:', error);
         // Show error to user
         toast({
           title: 'Error',
           description: 'Failed to save answer. Please try again.',
           variant: 'destructive',
         });
       }
     }
   };
   ```

3. **Add Retry Logic:**
   ```typescript
   const saveAnswerWithRetry = async (answerData: any, retries = 3) => {
     for (let i = 0; i < retries; i++) {
       try {
         return await examAnswerApi.saveAnswer(answerData);
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
       }
     }
   };
   ```

---

## Next Steps

1. **Run the diagnostic queries** to check Elamaran S's attempt
2. **Verify answer count** matches question count
3. **Check browser console** for any errors during exam
4. **Review RLS policies** if answers are missing
5. **Add enhanced logging** if issue persists

---

## Summary

The data storage flow is:
1. ✅ Student selects answer → `handleAnswerChange` triggered
2. ✅ Local state updated → UI shows selected answer
3. ✅ API call made → `examAnswerApi.saveAnswer()`
4. ✅ Database upsert → Insert or update answer
5. ✅ Response returned → Confirm save success

**If any step fails, answers won't be saved properly.**

Use the diagnostic queries above to identify where the failure occurs.

---

**Last Updated:** December 25, 2025  
**Version:** 1.0.0
