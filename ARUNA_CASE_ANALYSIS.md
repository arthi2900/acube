# Database Query: Verify Student Answers

## Case: Aruna A - Science 1 Exam

### Student Information
- **Student Name**: Aruna A
- **Username**: aruna_irula
- **Student ID**: `4c55dbf3-285c-4e11-9270-67e3316e9b8a`

### Exam Information
- **Exam Title**: Science 1
- **Exam ID**: `6abb35f3-8997-446f-aa89-a213e41fe650`
- **Total Marks**: 8
- **Duration**: 60 minutes

### Attempt Information
- **Attempt ID**: `4e6752d3-500a-4171-83e4-b49f6d179c8b`
- **Status**: submitted
- **Started**: 2025-12-25 13:04:04
- **Submitted**: 2025-12-25 13:05:04
- **Time Taken**: 1 minute
- **Marks Obtained**: 0
- **Percentage**: 0%

---

## SQL Query to Check Answers

### Query 1: Count Answers for This Attempt
```sql
SELECT COUNT(*) as answer_count
FROM exam_answers
WHERE attempt_id = '4e6752d3-500a-4171-83e4-b49f6d179c8b';
```

**Expected Result:**
- If count = 0: Student didn't answer any questions
- If count > 0: Answers exist but may not be displaying

---

### Query 2: Get All Answers with Question Details
```sql
SELECT 
  ea.id,
  ea.student_answer,
  ea.is_correct,
  ea.marks_obtained,
  ea.marks_allocated,
  ea.created_at,
  q.question_text,
  q.question_type,
  q.correct_answer
FROM exam_answers ea
LEFT JOIN questions q ON q.id = ea.question_id
WHERE ea.attempt_id = '4e6752d3-500a-4171-83e4-b49f6d179c8b'
ORDER BY ea.created_at;
```

**What to look for:**
- If no rows returned: Student didn't answer
- If rows returned but `question_text` is null: Questions were deleted
- If rows returned with data: Answers exist (check why not displaying)

---

### Query 3: Get Questions from the Exam's Question Paper
```sql
SELECT 
  q.id,
  q.question_text,
  q.question_type,
  q.marks
FROM questions q
JOIN question_paper_questions qpq ON qpq.question_id = q.id
WHERE qpq.question_paper_id = '4166cec8-767d-4914-9bb7-299c7e4ce7c9'
ORDER BY qpq.question_order;
```

**Purpose:**
- Verify the exam has questions
- Check if questions still exist
- See what questions the student should have answered

---

### Query 4: Check if Student Answered Any Questions
```sql
SELECT 
  'Total Questions' as metric,
  COUNT(DISTINCT qpq.question_id) as value
FROM question_paper_questions qpq
WHERE qpq.question_paper_id = '4166cec8-767d-4914-9bb7-299c7e4ce7c9'

UNION ALL

SELECT 
  'Answered Questions' as metric,
  COUNT(*) as value
FROM exam_answers
WHERE attempt_id = '4e6752d3-500a-4171-83e4-b49f6d179c8b';
```

**Expected Output:**
```
metric                | value
---------------------|-------
Total Questions      | 8
Answered Questions   | 0
```

If "Answered Questions" is 0, the student submitted without answering.

---

## Analysis Based on Provided Data

### Indicators Suggesting No Answers:

1. **Time Taken: 1 minute**
   - Exam duration: 60 minutes
   - Student only took 1 minute
   - Not enough time to read and answer 8 questions

2. **Marks Obtained: 0**
   - Total marks: 8
   - Obtained: 0
   - Percentage: 0%

3. **Submission Time**
   - Started: 13:04:04
   - Submitted: 13:05:04
   - Exactly 1 minute later

### Most Likely Scenario:
The student opened the exam, realized something (wrong exam, not prepared, technical issue), and immediately submitted without answering.

---

## What to Do Next

### Step 1: Verify in Database
Run Query 1 to confirm answer count is 0.

### Step 2: Check Console Logs
1. Navigate to the student detail page
2. Press F12
3. Look for: `Number of answers: 0`

### Step 3: Contact Student
Ask the student:
- Did you intend to submit without answering?
- Did you face any technical issues?
- Do you need to retake the exam?

### Step 4: Decision
Based on student response:
- **Technical Issue**: Allow retake
- **Intentional**: Accept the 0 score
- **Mistake**: Allow retake

---

## Expected Console Output

When you view this student's exam detail page, you should see:

```javascript
Loading exam details for: {
  examId: "6abb35f3-8997-446f-aa89-a213e41fe650",
  studentId: "4c55dbf3-285c-4e11-9270-67e3316e9b8a"
}

Exam data loaded: {
  id: "6abb35f3-8997-446f-aa89-a213e41fe650",
  title: "Science 1",
  total_marks: 8,
  ...
}

All attempts for exam: [
  {
    id: "4e6752d3-500a-4171-83e4-b49f6d179c8b",
    student_id: "4c55dbf3-285c-4e11-9270-67e3316e9b8a",
    status: "submitted",
    total_marks_obtained: 0,
    percentage: 0
  }
]

Student attempt found: {
  id: "4e6752d3-500a-4171-83e4-b49f6d179c8b",
  exam_id: "6abb35f3-8997-446f-aa89-a213e41fe650",
  student_id: "4c55dbf3-285c-4e11-9270-67e3316e9b8a",
  status: "submitted",
  started_at: "2025-12-25T13:04:04.81+05:30",
  submitted_at: "2025-12-25T13:05:04.009+05:30",
  total_marks_obtained: 0,
  percentage: 0
}

Fetching answers for attempt ID: 4e6752d3-500a-4171-83e4-b49f6d179c8b

Answers data received: []

Number of answers: 0
```

---

## Conclusion

Based on all indicators:
- ✅ Time taken: 1 minute (too short)
- ✅ Marks obtained: 0
- ✅ Percentage: 0%
- ✅ Expected console output: "Number of answers: 0"

**Diagnosis: Student submitted without answering questions.**

**This is expected behavior, not a system bug.**

**Action Required: Contact student to verify if this was intentional or if they need to retake the exam.**

---

## Additional Verification (Optional)

### Check if Student Can Access the Exam
```sql
SELECT 
  sa.student_id,
  p.full_name,
  sa.exam_id,
  e.title,
  sa.allocated_at
FROM student_allocations sa
JOIN profiles p ON p.id = sa.student_id
JOIN exams e ON e.id = sa.exam_id
WHERE sa.student_id = '4c55dbf3-285c-4e11-9270-67e3316e9b8a'
AND sa.exam_id = '6abb35f3-8997-446f-aa89-a213e41fe650';
```

### Check Student's Other Exam Attempts
```sql
SELECT 
  ea.id,
  e.title,
  ea.status,
  ea.total_marks_obtained,
  ea.percentage,
  ea.started_at,
  ea.submitted_at,
  EXTRACT(EPOCH FROM (ea.submitted_at - ea.started_at))/60 as minutes_taken
FROM exam_attempts ea
JOIN exams e ON e.id = ea.exam_id
WHERE ea.student_id = '4c55dbf3-285c-4e11-9270-67e3316e9b8a'
ORDER BY ea.created_at DESC;
```

**Purpose:** Check if this is a pattern (student always submits quickly) or an isolated incident.

---

**Remember:** The enhanced console logging will immediately confirm whether answers exist or not. Check the browser console first before running database queries!
