# Data Storage Testing Guide

## Purpose

This guide helps you verify if student answers are being properly saved to the database during exam attempts.

---

## Quick Test (5 Minutes)

### Step 1: Take Exam as Student

1. **Login as a student**
2. **Start an exam**
3. **Open browser console (F12)**
4. **Answer the first question**

### Step 2: Check Console Logs

Look for these logs after answering:

**✅ SUCCESS - Answers are saving:**
```javascript
=== ANSWER CHANGE ===
Question ID: abc-123-def
Answer: "A"
Answer Type: string
Attempt ID: xyz-789-uvw
Saving answer data: { attempt_id: "xyz-789-uvw", question_id: "abc-123-def", ... }
✅ Answer saved successfully: { id: "...", student_answer: "A", ... }
====================
```

**❌ FAILURE - Answers are NOT saving:**
```javascript
=== ANSWER CHANGE ===
Question ID: abc-123-def
Answer: "A"
Answer Type: string
Attempt ID: xyz-789-uvw
Saving answer data: { attempt_id: "xyz-789-uvw", question_id: "abc-123-def", ... }
❌ Failed to save answer: Error: ...
Error details: { message: "...", code: "...", ... }
====================
```

### Step 3: Check Network Tab

1. **Open DevTools → Network tab**
2. **Filter by "exam_answers"**
3. **Answer a question**
4. **Look for POST request:**
   - **✅ Status 200/201** = Success
   - **❌ Status 400/403/500** = Failure

### Step 4: Submit and Verify

1. **Answer all questions**
2. **Click Submit**
3. **Check console for:**

**✅ SUCCESS:**
```javascript
=== MANUAL SUBMIT ===
Attempt ID: xyz-789-uvw
Answers in state: { "q1": "A", "q2": "B", "q3": "C", ... }
Answered questions: 8
Total questions: 8
Saved answers in database: 8
====================
```

**❌ FAILURE:**
```javascript
=== MANUAL SUBMIT ===
Attempt ID: xyz-789-uvw
Answers in state: { "q1": "A", "q2": "B", "q3": "C", ... }
Answered questions: 8
Total questions: 8
Saved answers in database: 0  ← ❌ PROBLEM!
⚠️ WARNING: No answers found in database before submission!
====================
```

---

## Database Verification (10 Minutes)

### Step 1: Find the Attempt ID

**From Browser Console:**
```javascript
// Look for this in console logs
Attempt ID: xyz-789-uvw
```

**Or from Supabase Dashboard:**
```sql
SELECT 
  ea.id as attempt_id,
  p.full_name,
  e.title as exam_title,
  ea.status,
  ea.created_at
FROM exam_attempts ea
JOIN profiles p ON p.id = ea.student_id
JOIN exams e ON e.id = ea.exam_id
ORDER BY ea.created_at DESC
LIMIT 10;
```

### Step 2: Check Saved Answers

```sql
-- Replace with your attempt_id
SELECT 
  ea.id,
  q.question_text,
  q.question_type,
  ea.student_answer,
  ea.marks_allocated,
  ea.created_at
FROM exam_answers ea
JOIN questions q ON q.id = ea.question_id
WHERE ea.attempt_id = 'YOUR_ATTEMPT_ID_HERE'
ORDER BY ea.created_at;
```

**Expected Result:**
- Should return one row per answered question
- `student_answer` should contain the answer data
- `marks_allocated` should be > 0

**If empty:**
- ❌ Answers are NOT being saved
- Proceed to troubleshooting section

### Step 3: Compare Counts

```sql
-- Replace with your attempt_id
WITH attempt_info AS (
  SELECT 
    ea.id as attempt_id,
    e.question_paper_id
  FROM exam_attempts ea
  JOIN exams e ON e.id = ea.exam_id
  WHERE ea.id = 'YOUR_ATTEMPT_ID_HERE'
)
SELECT 
  (SELECT COUNT(*) FROM question_paper_questions 
   WHERE question_paper_id = (SELECT question_paper_id FROM attempt_info)) as total_questions,
  (SELECT COUNT(*) FROM exam_answers 
   WHERE attempt_id = (SELECT attempt_id FROM attempt_info)) as saved_answers,
  CASE 
    WHEN (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = (SELECT attempt_id FROM attempt_info)) = 
         (SELECT COUNT(*) FROM question_paper_questions WHERE question_paper_id = (SELECT question_paper_id FROM attempt_info))
    THEN '✅ All answers saved'
    WHEN (SELECT COUNT(*) FROM exam_answers WHERE attempt_id = (SELECT attempt_id FROM attempt_info)) = 0
    THEN '❌ No answers saved'
    ELSE '⚠️ Partial answers saved'
  END as status;
```

---

## Troubleshooting

### Issue 1: No Answers Saved (Console shows errors)

**Symptoms:**
- Console shows "❌ Failed to save answer"
- Network tab shows 403 Forbidden or 500 Error
- Database has 0 answers

**Possible Causes:**

#### A. RLS Policy Blocking Inserts

**Check:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'exam_answers';
```

**Fix:**
```sql
-- Ensure students can insert their own answers
CREATE POLICY "Students can manage their own answers" ON exam_answers
  FOR ALL USING (
    attempt_id IN (
      SELECT id FROM exam_attempts WHERE student_id = auth.uid()
    )
  );
```

#### B. Missing Permissions

**Check:**
```sql
-- Try to insert as student
INSERT INTO exam_answers (attempt_id, question_id, student_answer, marks_allocated)
VALUES ('test-id', 'test-id', '"test"'::jsonb, 1);
```

**If error:**
- Check RLS policies
- Verify student is authenticated
- Check if attempt belongs to student

#### C. Invalid Data Format

**Check console logs for:**
```javascript
Error details: { 
  message: "invalid input syntax for type json",
  code: "22P02"
}
```

**Fix:**
- Ensure answer is valid JSON
- Check answer format for each question type

### Issue 2: Answers Save But Don't Load

**Symptoms:**
- Console shows "✅ Answer saved successfully"
- But when returning to exam, answers are gone
- Database shows answers exist

**Possible Causes:**

#### A. RLS Policy Blocking Reads

**Check:**
```sql
-- Try to read as student
SELECT * FROM exam_answers 
WHERE attempt_id = 'YOUR_ATTEMPT_ID';
```

**If empty:**
```sql
-- Add read policy
CREATE POLICY "Students can view their own answers" ON exam_answers
  FOR SELECT USING (
    attempt_id IN (
      SELECT id FROM exam_attempts WHERE student_id = auth.uid()
    )
  );
```

#### B. Wrong Attempt ID

**Check console logs:**
```javascript
// Should be same ID throughout
Attempt ID: xyz-789-uvw  // When saving
Attempt ID: xyz-789-uvw  // When loading
```

### Issue 3: Partial Answers Saved

**Symptoms:**
- Some questions save, others don't
- Specific question types fail
- Database shows partial data

**Possible Causes:**

#### A. Question Type Issues

**Check which types are missing:**
```sql
SELECT 
  q.question_type,
  COUNT(*) as total_questions,
  COUNT(ea.id) as saved_answers
FROM question_paper_questions qpq
JOIN questions q ON q.id = qpq.question_id
LEFT JOIN exam_answers ea ON ea.question_id = q.id 
  AND ea.attempt_id = 'YOUR_ATTEMPT_ID'
WHERE qpq.question_paper_id = 'YOUR_PAPER_ID'
GROUP BY q.question_type;
```

**Common Issues:**
- **Short Answer:** Not saving on blur
- **Multiple Response:** Array format issue
- **Match Following:** Object format issue

#### B. Timing Issues

**Check:**
- Are answers saved immediately or on blur?
- Is there enough time before submission?
- Are rapid changes causing conflicts?

**Fix:**
```typescript
// Add debouncing for text inputs
const debouncedSave = useCallback(
  debounce((questionId, answer) => {
    handleAnswerChange(questionId, answer);
  }, 500),
  []
);
```

### Issue 4: Auto-Submit Before Saving

**Symptoms:**
- Timer expires
- Exam auto-submits
- Answers not saved yet

**Check console:**
```javascript
=== AUTO-SUBMIT TRIGGERED ===
Reason: Timer expired
// But no "Answer saved successfully" logs before this
```

**Fix:**
- Ensure answers save immediately on selection
- Don't rely on blur events for critical saves
- Add pre-submit verification

---

## Answer Format Reference

### MCQ (Multiple Choice)
```javascript
// Correct format
student_answer: "A"  // String

// In database
student_answer: "A"  // jsonb
```

### True/False
```javascript
// Correct format
student_answer: "true"  // String

// In database
student_answer: "true"  // jsonb
```

### Short Answer
```javascript
// Correct format
student_answer: "This is my answer"  // String

// In database
student_answer: "This is my answer"  // jsonb
```

### Multiple Response
```javascript
// Correct format
student_answer: ["A", "B", "C"]  // Array

// In database
student_answer: ["A", "B", "C"]  // jsonb array
```

### Match the Following
```javascript
// Correct format
student_answer: {
  "item1": "match1",
  "item2": "match2"
}  // Object

// In database
student_answer: {"item1": "match1", "item2": "match2"}  // jsonb object
```

---

## Prevention Checklist

### Before Exam:
- [ ] Test answer saving with sample exam
- [ ] Verify RLS policies allow student access
- [ ] Check browser console for errors
- [ ] Test all question types

### During Exam:
- [ ] Monitor browser console
- [ ] Check network tab for failed requests
- [ ] Verify answers save immediately
- [ ] Test answer persistence (refresh page)

### After Submission:
- [ ] Verify answer count matches question count
- [ ] Check database for saved answers
- [ ] Confirm auto-grading runs successfully
- [ ] Review results for accuracy

---

## Automated Test Script

### Run in Browser Console

```javascript
async function testDataStorage() {
  console.log('=== DATA STORAGE TEST ===');
  
  // Get current state
  const attemptId = 'YOUR_ATTEMPT_ID';  // Replace
  const questionId = 'YOUR_QUESTION_ID';  // Replace
  
  try {
    // Test 1: Save answer
    console.log('Test 1: Saving answer...');
    const saveResult = await examAnswerApi.saveAnswer({
      attempt_id: attemptId,
      question_id: questionId,
      student_answer: "Test Answer",
      marks_allocated: 1
    });
    console.log('✅ Save successful:', saveResult);
    
    // Test 2: Retrieve answer
    console.log('Test 2: Retrieving answers...');
    const answers = await examAnswerApi.getAnswersByAttempt(attemptId);
    console.log('✅ Retrieved', answers.length, 'answers');
    
    // Test 3: Verify answer
    const savedAnswer = answers.find(a => a.question_id === questionId);
    if (savedAnswer && savedAnswer.student_answer === "Test Answer") {
      console.log('✅ TEST PASSED: Answer saved and retrieved correctly');
      return true;
    } else {
      console.log('❌ TEST FAILED: Answer mismatch');
      console.log('Expected: "Test Answer"');
      console.log('Got:', savedAnswer?.student_answer);
      return false;
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    return false;
  }
}

// Run test
testDataStorage().then(passed => {
  console.log('=== TEST RESULT:', passed ? 'PASSED ✅' : 'FAILED ❌', '===');
});
```

---

## Summary

**Data Storage Flow:**
1. Student selects answer → `handleAnswerChange` triggered
2. Local state updated → UI shows selection
3. API call made → `examAnswerApi.saveAnswer()`
4. Database upsert → Insert or update answer
5. Response returned → Confirm success

**Verification Points:**
- ✅ Console logs show "Answer saved successfully"
- ✅ Network tab shows 200/201 status
- ✅ Database query returns saved answers
- ✅ Answer count matches question count

**If any step fails:**
- Check console for error messages
- Verify RLS policies
- Test manual insert
- Review answer format

---

**Last Updated:** December 25, 2025  
**Version:** 1.0.0
