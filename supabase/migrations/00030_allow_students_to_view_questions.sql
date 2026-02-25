/*
# Allow Students to View Questions from Their Exams

## Plain English Explanation
This migration adds an additional RLS policy to the `questions` table to allow students
to view questions that are part of exams they're taking. The previous migration allowed
students to see the `question_paper_questions` rows, but the nested `question` object
was still blocked by RLS on the `questions` table.

## Problem
When Supabase performs a nested join like:
```sql
SELECT *, question:questions(*) FROM question_paper_questions
```

It needs RLS permissions on BOTH tables:
1. question_paper_questions (✅ fixed in migration 00029)
2. questions (❌ still blocked for students)

## Solution
Add a new RLS policy on the `questions` table that allows students to view questions
that are linked to question papers used in exams they have started.

## Security Considerations
- Students can ONLY view questions, not modify them
- Students can ONLY see questions from exams they've started (have an attempt)
- Read-only access ensures data integrity
- Questions from other exams remain hidden

## Testing
After applying this migration:
1. Student logs in
2. Starts an exam
3. Should see complete question details including:
   - Question text
   - Question type
   - Options (for MCQ)
   - Marks
   - Images (if any)
*/

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Students can view questions from their exams" ON questions;

-- Create policy to allow students to view questions from exams they're taking
CREATE POLICY "Students can view questions from their exams" ON questions
  FOR SELECT USING (
    -- Check if this question is part of a question paper used in an exam the student has started
    EXISTS (
      SELECT 1 
      FROM question_paper_questions qpq
      JOIN exams e ON e.question_paper_id = qpq.question_paper_id
      JOIN exam_attempts ea ON ea.exam_id = e.id
      WHERE qpq.question_id = questions.id
        AND ea.student_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Students can view questions from their exams" ON questions IS 
  'Allows students to view questions from exams they have started. Read-only access only.';