/*
# Allow Students to View Exam Questions

## Plain English Explanation
This migration fixes the "No questions found in this exam" error that students encounter.
The issue was that Row Level Security (RLS) policies only allowed teachers to view questions
in their own question papers. Students need to be able to view questions from exams they're taking.

## Changes Made

### 1. New RLS Policy on question_paper_questions
- **Policy Name**: "Students can view questions from their exams"
- **Action**: SELECT (read-only)
- **Who**: Students (authenticated users)
- **Condition**: The question paper is used in an exam that the student has an attempt for

### 2. Security Considerations
- Students can ONLY view questions, not modify them
- Students can ONLY see questions from exams they have started (have an attempt)
- Students cannot see questions from exams they haven't started
- Read-only access ensures data integrity

## Testing
After applying this migration:
1. Student logs in
2. Navigates to "My Exams"
3. Clicks "Start Exam" on a published exam
4. Should see all questions from the question paper
5. Can answer and submit the exam

## Notes
- This is a critical fix for the exam-taking functionality
- Without this policy, students cannot take any exams
- The policy is restrictive enough to maintain security
- Only affects SELECT operations, not INSERT/UPDATE/DELETE
*/

-- Drop existing restrictive policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Students can view questions from their exams" ON question_paper_questions;

-- Create policy to allow students to view questions from exams they're taking
CREATE POLICY "Students can view questions from their exams" ON question_paper_questions
  FOR SELECT USING (
    -- Check if the student has an exam attempt for an exam using this question paper
    EXISTS (
      SELECT 1 
      FROM exam_attempts ea
      JOIN exams e ON e.id = ea.exam_id
      WHERE e.question_paper_id = question_paper_questions.question_paper_id
        AND ea.student_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Students can view questions from their exams" ON question_paper_questions IS 
  'Allows students to view questions from question papers used in exams they have started. Read-only access only.';
