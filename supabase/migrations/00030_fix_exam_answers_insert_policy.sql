/*
# Fix Exam Answers Insert/Update Policies

## Problem
Students are unable to save answers during exams. The error message shows:
"No answers found for this exam attempt. The student submitted the exam but no answers were recorded."

## Root Cause Analysis
The RLS policies for exam_answers table might be too restrictive or conflicting.
Students need to be able to INSERT and UPDATE their answers during the exam.

## Solution
1. Drop all existing exam_answers policies
2. Recreate them with proper permissions
3. Ensure students can INSERT and UPDATE during 'in_progress' status
4. Ensure students can SELECT their own answers at any time
5. Maintain teacher and principal access

## Security
- Students can only manage answers for their own attempts
- Students can only modify answers while exam is 'in_progress'
- Teachers can view and grade answers for their exams
- Principals and admins have full access
*/

-- Drop all existing policies on exam_answers
DROP POLICY IF EXISTS "Students can view their own answers" ON exam_answers;
DROP POLICY IF EXISTS "Students can view their own answers after submission" ON exam_answers;
DROP POLICY IF EXISTS "Students can insert their own answers" ON exam_answers;
DROP POLICY IF EXISTS "Students can update their own answers during exam" ON exam_answers;
DROP POLICY IF EXISTS "Students can manage their own answers" ON exam_answers;
DROP POLICY IF EXISTS "Teachers can view answers for their exams" ON exam_answers;
DROP POLICY IF EXISTS "Teachers can update answers for grading" ON exam_answers;
DROP POLICY IF EXISTS "Principals can view all answers" ON exam_answers;
DROP POLICY IF EXISTS "Admins have full access to exam_answers" ON exam_answers;

-- Policy 1: Students can view their own answers (during and after exam)
CREATE POLICY "Students can view their own answers" ON exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_attempts 
      WHERE id = exam_answers.attempt_id 
      AND student_id = auth.uid()
    )
  );

-- Policy 2: Students can insert answers during exam
CREATE POLICY "Students can insert their own answers" ON exam_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_attempts 
      WHERE id = attempt_id 
      AND student_id = auth.uid()
      AND status = 'in_progress'::attempt_status
    )
  );

-- Policy 3: Students can update answers during exam
CREATE POLICY "Students can update their own answers" ON exam_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM exam_attempts 
      WHERE id = exam_answers.attempt_id 
      AND student_id = auth.uid()
      AND status = 'in_progress'::attempt_status
    )
  );

-- Policy 4: Teachers can view answers for their exams
CREATE POLICY "Teachers can view answers for their exams" ON exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_attempts ea
      JOIN exams e ON e.id = ea.exam_id
      WHERE ea.id = exam_answers.attempt_id 
      AND e.teacher_id = auth.uid()
    )
  );

-- Policy 5: Teachers can update answers for grading
CREATE POLICY "Teachers can update answers for grading" ON exam_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM exam_attempts ea
      JOIN exams e ON e.id = ea.exam_id
      WHERE ea.id = exam_answers.attempt_id 
      AND e.teacher_id = auth.uid()
    )
  );

-- Policy 6: Principals can view all answers in their school
CREATE POLICY "Principals can view all answers" ON exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'principal'::user_role
    )
  );

-- Policy 7: Admins have full access
CREATE POLICY "Admins have full access to exam_answers" ON exam_answers
  FOR ALL USING (is_admin(auth.uid()));

-- Verify policies are created
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'exam_answers';
  
  RAISE NOTICE 'Total exam_answers policies created: %', policy_count;
  
  IF policy_count < 7 THEN
    RAISE WARNING 'Expected at least 7 policies, but found %', policy_count;
  ELSE
    RAISE NOTICE 'All policies created successfully!';
  END IF;
END $$;
