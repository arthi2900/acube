-- Add policy for principals to manage questions in their school
-- Principals should be able to create, update, and delete questions for subjects in their school

-- First, drop the existing teacher management policy and recreate it with principal support
DROP POLICY IF EXISTS "Teachers can manage their own questions" ON questions;

-- Create new policy that allows both teachers and principals to manage questions
-- Teachers can manage their own questions
-- Principals can manage all questions from subjects in their school
CREATE POLICY "Teachers and principals can manage questions" ON questions
  FOR ALL TO authenticated 
  USING (
    (is_teacher(auth.uid()) AND created_by = auth.uid())
    OR 
    (is_principal(auth.uid()) AND EXISTS (
      SELECT 1 FROM subjects s
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = questions.subject_id 
      AND s.school_id = p.school_id
    ))
  );