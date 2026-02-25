# Auto-Grading System Documentation

## Overview

The Online Exam Management System now includes a complete auto-grading system that automatically evaluates objective questions (MCQ and True/False) when students submit their exams.

---

## Features Implemented

### 1. **Automatic Grading**
- ✅ Auto-grades MCQ (Multiple Choice Questions)
- ✅ Auto-grades True/False questions
- ✅ Calculates total marks obtained
- ✅ Calculates percentage
- ✅ Determines Pass/Fail status
- ✅ Updates exam attempt status to "evaluated"

### 2. **Manual Grading Support**
- ✅ Short answer questions remain ungraded (for teacher evaluation)
- ✅ Teachers can manually grade subjective questions
- ✅ System recalculates totals after manual grading

### 3. **Bulk Evaluation**
- ✅ Teachers can evaluate all submitted exams at once
- ✅ Individual exam evaluation button
- ✅ Progress tracking during bulk operations

---

## How It Works

### Student Submission Flow

```
1. Student completes exam
   ↓
2. Student clicks "Submit"
   ↓
3. System updates status to "submitted"
   ↓
4. System calls process_exam_submission()
   ↓
5. Auto-grades objective questions (MCQ, True/False)
   ↓
6. Calculates total marks and percentage
   ↓
7. Determines Pass/Fail based on passing marks
   ↓
8. Updates status to "evaluated" (if no subjective questions)
   OR keeps status as "submitted" (if has subjective questions)
```

### Database Functions

#### 1. `auto_grade_objective_questions(attempt_uuid)`
**Purpose:** Automatically grade MCQ and True/False questions

**Process:**
- Loops through all answers for the attempt
- Compares student answer with correct answer
- Assigns marks based on correctness
- Updates `is_correct` and `marks_obtained` fields
- Sets `evaluated_at` timestamp

**Returns:**
```json
{
  "success": true,
  "graded_count": 8,
  "message": "8 objective questions auto-graded"
}
```

#### 2. `process_exam_submission(attempt_uuid)`
**Purpose:** Complete post-submission processing

**Process:**
1. Calls `auto_grade_objective_questions()`
2. Checks if there are subjective questions
3. If no subjective questions:
   - Calls `evaluate_exam_attempt()`
   - Updates status to "evaluated"
   - Determines Pass/Fail
4. If has subjective questions:
   - Calculates partial results
   - Keeps status as "submitted"
   - Waits for teacher to grade subjective questions

**Returns (No Subjective Questions):**
```json
{
  "success": true,
  "auto_graded": {...},
  "evaluation": {
    "total_marks_obtained": 6,
    "total_marks": 8,
    "percentage": 75,
    "result": "pass"
  },
  "status": "evaluated",
  "message": "Exam auto-graded and evaluated successfully"
}
```

**Returns (Has Subjective Questions):**
```json
{
  "success": true,
  "auto_graded": {...},
  "status": "submitted",
  "message": "2 subjective questions require manual grading",
  "partial_marks": 4,
  "total_marks": 8
}
```

**Returns (No Answers Submitted):**
```json
{
  "success": true,
  "status": "evaluated",
  "message": "No answers submitted - marked as 0"
}
```

---

## User Interface

### For Teachers

#### 1. **Exam Results Page**
- **Location:** `/teacher/exams/:examId/results`
- **New Feature:** "அனைத்தையும் மதிப்பீடு செய்" (Evaluate All) button
- **Functionality:**
  - Appears when there are submitted but not evaluated exams
  - Evaluates all submitted exams in bulk
  - Shows progress and success/failure count
  - Automatically refreshes results after completion

#### 2. **Student Exam Detail Page**
- **Location:** `/teacher/exams/:examId/students/:studentId`
- **New Feature:** "மதிப்பீடு செய்" (Evaluate) button
- **Functionality:**
  - Appears when exam status is "submitted" and has answers
  - Evaluates individual student's exam
  - Shows processing status
  - Refreshes data after completion

### For Students

#### Student Result Page
- **Location:** `/student/exams/:examId/result`
- **Automatic Updates:**
  - Score and percentage display immediately after submission
  - Result (Pass/Fail) shows after evaluation
  - Question-wise analysis available after evaluation

---

## API Methods

### Frontend API (`src/db/api.ts`)

#### `examAttemptApi.submitAttempt(attemptId)`
**Purpose:** Submit exam and trigger auto-grading

**Process:**
1. Updates status to "submitted"
2. Sets submitted_at timestamp
3. Calls `process_exam_submission` RPC
4. Returns updated attempt data

**Usage:**
```typescript
await examAttemptApi.submitAttempt(attemptId);
```

#### `examAttemptApi.processSubmission(attemptId)`
**Purpose:** Manually trigger evaluation for already-submitted exam

**Usage:**
```typescript
const result = await examAttemptApi.processSubmission(attemptId);
console.log(result.message); // "Exam auto-graded and evaluated successfully"
```

#### `examAttemptApi.autoGradeObjectiveQuestions(attemptId)`
**Purpose:** Only auto-grade objective questions without full evaluation

**Usage:**
```typescript
const result = await examAttemptApi.autoGradeObjectiveQuestions(attemptId);
console.log(result.graded_count); // 8
```

---

## Question Types

### Supported for Auto-Grading
1. **MCQ (Multiple Choice Questions)**
   - Question type: `'mcq'`
   - Student answer: Single option (e.g., "A", "B", "C", "D")
   - Correct answer: Single option
   - Grading: Exact match

2. **True/False**
   - Question type: `'true_false'`
   - Student answer: "true" or "false"
   - Correct answer: "true" or "false"
   - Grading: Exact match

### Requires Manual Grading
1. **Short Answer**
   - Question type: `'short_answer'`
   - Student answer: Text
   - Correct answer: Expected text
   - Grading: Teacher evaluation required

---

## Database Schema

### exam_answers Table
```sql
CREATE TABLE exam_answers (
  id uuid PRIMARY KEY,
  attempt_id uuid REFERENCES exam_attempts(id),
  question_id uuid REFERENCES questions(id),
  student_answer jsonb,           -- Student's answer
  is_correct boolean,              -- Auto-graded result
  marks_obtained numeric,          -- Marks awarded
  marks_allocated numeric,         -- Maximum marks for question
  evaluated_by uuid,               -- Teacher who graded (for manual)
  evaluated_at timestamptz,        -- When graded
  created_at timestamptz,
  updated_at timestamptz
);
```

### exam_attempts Table
```sql
CREATE TABLE exam_attempts (
  id uuid PRIMARY KEY,
  exam_id uuid REFERENCES exams(id),
  student_id uuid REFERENCES profiles(id),
  status attempt_status,           -- 'in_progress', 'submitted', 'evaluated'
  started_at timestamptz,
  submitted_at timestamptz,
  total_marks_obtained numeric,    -- Auto-calculated
  percentage numeric,               -- Auto-calculated
  result text,                      -- 'pass' or 'fail'
  created_at timestamptz,
  updated_at timestamptz
);
```

---

## Testing the System

### Test Case 1: All Objective Questions

**Setup:**
- Create exam with 8 MCQ questions
- Each question worth 1 mark
- Passing marks: 40% (3.2 marks)

**Student Actions:**
1. Take exam
2. Answer 6 questions correctly, 2 incorrectly
3. Submit exam

**Expected Results:**
- Status: "evaluated"
- Total marks obtained: 6
- Percentage: 75%
- Result: "pass"
- All answers show correct/incorrect badges

---

### Test Case 2: Mixed Question Types

**Setup:**
- Create exam with:
  - 6 MCQ questions (1 mark each)
  - 2 Short answer questions (1 mark each)
- Total: 8 marks
- Passing marks: 40% (3.2 marks)

**Student Actions:**
1. Take exam
2. Answer 4 MCQ correctly, 2 incorrectly
3. Answer 2 short answer questions
4. Submit exam

**Expected Results:**
- Status: "submitted" (not "evaluated")
- Total marks obtained: 4 (only MCQ graded)
- Percentage: 50% (partial)
- Result: null (waiting for manual grading)
- MCQ answers show correct/incorrect badges
- Short answer questions show "Pending Evaluation"

**Teacher Actions:**
1. Navigate to student detail page
2. Click "மதிப்பீடு செய்" (Evaluate) button
3. System grades short answers (if possible) or waits for manual grading

---

### Test Case 3: No Answers Submitted

**Setup:**
- Create exam with 8 questions
- Student opens exam but doesn't answer

**Student Actions:**
1. Take exam
2. Don't answer any questions
3. Submit exam (or time expires)

**Expected Results:**
- Status: "evaluated"
- Total marks obtained: 0
- Percentage: 0%
- Result: "fail"
- Message: "No answers submitted - marked as 0"

---

### Test Case 4: Bulk Evaluation

**Setup:**
- Create exam with 8 MCQ questions
- 10 students take the exam
- All students submit

**Teacher Actions:**
1. Navigate to Exam Results page
2. Click "அனைத்தையும் மதிப்பீடு செய்" (Evaluate All)
3. Wait for processing

**Expected Results:**
- All 10 exams evaluated
- Success message: "10 தேர்வுகள் மதிப்பீடு செய்யப்பட்டன"
- Results page refreshes automatically
- All students show "evaluated" status

---

## Troubleshooting

### Issue: Exam Not Auto-Grading

**Symptoms:**
- Status remains "submitted"
- Marks obtained is 0
- Result is empty

**Possible Causes:**
1. **Has subjective questions** - Expected behavior, waiting for manual grading
2. **RPC function not called** - Check console logs for errors
3. **Database permissions** - Verify RPC function has SECURITY DEFINER

**Solution:**
1. Check console logs for errors
2. Manually trigger evaluation:
   ```typescript
   await examAttemptApi.processSubmission(attemptId);
   ```
3. Verify database migration was applied:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'process_exam_submission';
   ```

---

### Issue: Incorrect Marks Calculation

**Symptoms:**
- Marks don't match expected values
- Percentage is wrong

**Possible Causes:**
1. **Answer format mismatch** - Student answer format doesn't match correct answer format
2. **Question marks not set** - Questions don't have marks assigned
3. **Calculation error** - Bug in evaluation function

**Solution:**
1. Check answer formats in database:
   ```sql
   SELECT student_answer, correct_answer 
   FROM exam_answers ea
   JOIN questions q ON q.id = ea.question_id
   WHERE ea.attempt_id = 'attempt-id';
   ```
2. Verify question marks:
   ```sql
   SELECT id, question_text, marks 
   FROM questions 
   WHERE id IN (SELECT question_id FROM exam_answers WHERE attempt_id = 'attempt-id');
   ```
3. Manually recalculate:
   ```sql
   SELECT evaluate_exam_attempt('attempt-id');
   ```

---

### Issue: Bulk Evaluation Fails

**Symptoms:**
- Some exams evaluated, some failed
- Error message shows failure count

**Possible Causes:**
1. **Permission issues** - Some attempts not accessible
2. **Data integrity issues** - Missing questions or answers
3. **Timeout** - Too many exams to process

**Solution:**
1. Check console logs for specific errors
2. Evaluate failed exams individually
3. Verify data integrity:
   ```sql
   SELECT ea.id, ea.attempt_id, q.id as question_id
   FROM exam_answers ea
   LEFT JOIN questions q ON q.id = ea.question_id
   WHERE q.id IS NULL;
   ```

---

## Migration Information

### Migration File
- **File:** `supabase/migrations/00029_add_auto_grading_system.sql`
- **Applied:** Automatically when system starts
- **Functions Created:**
  - `auto_grade_objective_questions(uuid)`
  - `process_exam_submission(uuid)`

### Rollback (if needed)
```sql
DROP FUNCTION IF EXISTS process_exam_submission(uuid);
DROP FUNCTION IF EXISTS auto_grade_objective_questions(uuid);
```

---

## Performance Considerations

### Single Exam Evaluation
- **Time:** < 1 second for 50 questions
- **Database Queries:** ~3-5 queries
- **Network Requests:** 2 (submit + process)

### Bulk Evaluation
- **Time:** ~1 second per exam
- **Recommended:** Batch size of 50 exams
- **Progress:** Shows real-time count

### Optimization Tips
1. Use bulk evaluation for multiple exams
2. Evaluate immediately after submission (automatic)
3. Index on `attempt_id` and `question_id` (already exists)

---

## Future Enhancements

### Planned Features
1. **Partial Marking for MCQ**
   - Award partial marks for partially correct answers
   - Configurable per question

2. **Negative Marking**
   - Deduct marks for incorrect answers
   - Configurable per exam

3. **Multiple Response MCQ**
   - Support for questions with multiple correct answers
   - Partial marking based on correct selections

4. **Match the Following**
   - Auto-grade matching questions
   - Partial marks for partial matches

5. **AI-Assisted Short Answer Grading**
   - Use AI to suggest marks for short answers
   - Teacher can accept/reject suggestions

---

## Summary

The auto-grading system is now fully functional and provides:
- ✅ Automatic evaluation of objective questions
- ✅ Immediate feedback to students
- ✅ Reduced teacher workload
- ✅ Consistent and fair grading
- ✅ Bulk evaluation capabilities
- ✅ Support for mixed question types

**Key Benefits:**
- Students get instant results for objective questions
- Teachers save time on grading
- System ensures consistent evaluation
- Easy to use with clear UI buttons
- Comprehensive error handling and logging

---

**Last Updated:** December 25, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
