/*
# Add Principal and Admin Access to Question Paper Questions

## Plain English Explanation
This migration extends the access control for question_paper_questions table to allow
principals and admins to view questions within question papers. This complements the
previous migration that gave them access to question_papers.

## Changes
1. Add policy for principals to view questions in papers from their school
2. Add policy for admins to view all question paper questions
3. Add policy for admins to manage all question paper questions

## Security Notes
- Principals can only view questions in papers from their school
- Teachers maintain full control over questions in their own papers
- Admins have full access for system management

## Access Matrix After This Migration
- **Teachers**: Can view/edit/delete questions in their own papers
- **Principals**: Can view questions in all papers from their school
- **Admins**: Full access to all question paper questions
*/

-- Policy: Principals can view questions in papers from their school
CREATE POLICY "Principals can view school paper questions" ON question_paper_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN question_papers qp ON qp.school_id = p.school_id
      WHERE p.id = auth.uid()
      AND p.role = 'principal'
      AND p.school_id IS NOT NULL
      AND question_paper_questions.question_paper_id = qp.id
    )
  );

-- Policy: Admins can view all question paper questions
CREATE POLICY "Admins can view all paper questions" ON question_paper_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Policy: Admins can manage all question paper questions
CREATE POLICY "Admins can manage all paper questions" ON question_paper_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "Principals can view school paper questions" ON question_paper_questions IS 
  'Principals can view questions in all papers from their school';

COMMENT ON POLICY "Admins can view all paper questions" ON question_paper_questions IS 
  'Admins have read access to all question paper questions';

COMMENT ON POLICY "Admins can manage all paper questions" ON question_paper_questions IS 
  'Admins have full CRUD access to all question paper questions';
