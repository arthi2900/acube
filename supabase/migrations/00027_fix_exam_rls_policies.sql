/*
# Fix Exam RLS Policies

## Changes
1. Update exam_answers policies to allow students to view their own answers during exam
2. Fix exams policy to check student class through student_class_sections table
3. Add policy for principals to update exam status (approve/reject)

## Security
- Students can view/edit their answers during exam (in_progress status)
- Students can view their answers after submission
- Teachers maintain full access to their exams
- Principals can approve/reject exams
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Students can view their own answers after submission" ON exam_answers;
DROP POLICY IF EXISTS "Students can view published exams for their class" ON exams;

-- Create updated policy for students to view their own answers (during and after exam)
CREATE POLICY "Students can view their own answers" ON exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_attempts 
      WHERE id = exam_answers.attempt_id 
      AND student_id = auth.uid()
    )
  );

-- Create updated policy for students to view published exams for their class
CREATE POLICY "Students can view published exams for their class" ON exams
  FOR SELECT USING (
    status = 'published'::exam_status AND
    EXISTS (
      SELECT 1 FROM student_class_sections scs
      WHERE scs.student_id = auth.uid() 
      AND scs.class_id = exams.class_id
    )
  );

-- Add policy for principals to update exams (for approval)
CREATE POLICY "Principals can update exams for approval" ON exams
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal'::user_role
    )
  );

-- Add policy for admins to manage all exams
CREATE POLICY "Admins can manage all exams" ON exams
  FOR ALL USING (is_admin(auth.uid()));