# Statistics Cards Data Source Explanation

## Overview
This document explains where the statistics cards (Total Students, Average Score, Passed, Failed) get their data from in the Exam Results page.

## Location
**File:** `src/pages/teacher/ExamResults.tsx`

## Statistics Cards

### 1. Total Students Card (Line 290-305)
**Display:** Shows the total number of students assigned to the exam
**Data Source:** 
- Variable: `stats.totalStudents`
- Calculated from: `students.length`
- API Call: `examAttemptApi.getAllStudentsForExam(examId)` (Line 130)
- Database Table: `exam_student_allocations`
- Description: Counts all students who are allocated/assigned to this specific exam

### 2. Average Score Card (Line 307-321)
**Display:** Shows the average percentage score of evaluated students
**Data Source:**
- Variable: `stats.avgPercentage`
- Calculated from: Sum of all evaluated students' percentages divided by number of evaluated students
- Formula: `evaluated.reduce((sum, s) => sum + s.percentage, 0) / evaluated.length`
- Database Table: `exam_attempts` (percentage field)
- Description: Only includes students who have been evaluated (status = 'evaluated')

### 3. Passed Card (Line 323-337)
**Display:** Shows the number of students who passed the exam
**Data Source:**
- Variable: `stats.passed`
- Calculated from: `evaluated.filter(s => s.result === 'pass').length`
- Database Table: `exam_attempts` (result field)
- Description: Counts students with result = 'pass' among evaluated attempts

### 4. Failed Card (Line 339-351)
**Display:** Shows the number of students who failed the exam
**Data Source:**
- Variable: `stats.failed`
- Calculated from: `evaluated.length - passed.length`
- Database Table: `exam_attempts` (result field)
- Description: Counts students with result = 'fail' among evaluated attempts

## Calculation Function

### `calculateStats()` Function (Lines 155-186)

```typescript
const calculateStats = () => {
  if (!students || students.length === 0) {
    return {
      totalStudents: 0,
      submitted: 0,
      evaluated: 0,
      passed: 0,
      failed: 0,
      avgPercentage: '0.00',
      attendanceRate: '0',
    };
  }

  const submitted = students.filter(s => s.status === 'submitted' || s.status === 'evaluated');
  const evaluated = students.filter(s => s.status === 'evaluated');
  const passed = evaluated.filter(s => s.result === 'pass');
  const avgPercentage = evaluated.length > 0
    ? evaluated.reduce((sum, s) => sum + s.percentage, 0) / evaluated.length
    : 0;

  return {
    totalStudents: students.length,           // ← From exam_student_allocations table
    submitted: submitted.length,              // ← Students who submitted the exam
    evaluated: evaluated.length,              // ← Students whose exams are evaluated
    passed: passed.length,                    // ← Students who passed
    failed: evaluated.length - passed.length, // ← Students who failed
    avgPercentage: avgPercentage.toFixed(2),  // ← Average percentage score
    attendanceRate: students.length > 0 
      ? ((submitted.length / students.length) * 100).toFixed(1)
      : '0',
  };
};
```

## Data Flow

1. **Page Load** → `loadExamResults()` is called (Line 123)
2. **API Call** → `examAttemptApi.getAllStudentsForExam(examId)` fetches all allocated students (Line 130)
3. **Data Storage** → Results stored in `students` state variable (Line 131)
4. **Statistics Calculation** → `calculateStats()` processes the students data (Line 188)
5. **Display** → Statistics cards render with calculated values (Lines 290-351)

## Database Tables Involved

### Primary Tables:
1. **`exam_student_allocations`** - Stores which students are assigned to which exams
   - Used for: Total Students count
   - Fields: exam_id, student_id

2. **`exam_attempts`** - Stores student exam attempts and results
   - Used for: Average Score, Passed, Failed counts
   - Fields: exam_id, student_id, status, result, percentage, total_marks_obtained

3. **`profiles`** - Stores student information
   - Used for: Student names and details
   - Fields: id, full_name, username, role

## Recent Fix (2025-12-11)

**Issue:** The `getExamAnalysis()` function in `src/db/api.ts` was querying from a non-existent table called `exam_students`, causing Total Students to show 0.

**Fix:** Changed the table name from `exam_students` to `exam_student_allocations` (Line 2136 in api.ts)

**Before:**
```typescript
let totalStudentsQuery = supabase
  .from('exam_students')  // ❌ Table doesn't exist
  .select('*', { count: 'exact', head: true })
  .eq('exam_id', exam.id);
```

**After:**
```typescript
let totalStudentsQuery = supabase
  .from('exam_student_allocations')  // ✅ Correct table name
  .select('*', { count: 'exact', head: true })
  .eq('exam_id', exam.id);
```

## Summary

**To recall the statistics card values:**
- **Total Students** = Count from `exam_student_allocations` table (students assigned to exam)
- **Average Score** = Average of `percentage` field from `exam_attempts` table (evaluated only)
- **Passed** = Count of `result = 'pass'` from `exam_attempts` table
- **Failed** = Count of `result = 'fail'` from `exam_attempts` table

All values are calculated in the `calculateStats()` function and stored in the `stats` object, which is then used to populate the four statistics cards in the UI.
