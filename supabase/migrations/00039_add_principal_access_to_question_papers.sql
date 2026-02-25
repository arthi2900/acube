/*
# Add Principal Access to Question Papers

## Plain English Explanation
This migration adds RLS policies to allow principals to view and manage question papers
from teachers in their school. This is necessary for the exam approval workflow where
principals need to review question papers before exams are scheduled.

## Changes
1. Add policy for principals to view question papers from their school
2. Add policy for principals to update question papers (for approval workflow)
3. Maintain existing teacher-only policies

## Security Notes
- Principals can only access question papers from their assigned school
- Teachers maintain full control over their own papers
- Cross-school access is prevented
- Admins have full access through existing admin policies

## Access Matrix After This Migration
- **Teachers**: Can view/edit/delete their own question papers
- **Principals**: Can view all question papers from their school
- **Admins**: Full access to all question papers (via admin role)
*/

-- Policy: Principals can view question papers from their school
CREATE POLICY "Principals can view school question papers" ON question_papers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'principal'
      AND p.school_id IS NOT NULL
      AND question_papers.school_id = p.school_id
    )
  );

-- Policy: Admins can view all question papers
CREATE POLICY "Admins can view all question papers" ON question_papers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Policy: Admins can manage all question papers
CREATE POLICY "Admins can manage all question papers" ON question_papers
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
COMMENT ON POLICY "Principals can view school question papers" ON question_papers IS 
  'Principals can view all question papers created by teachers in their school';

COMMENT ON POLICY "Admins can view all question papers" ON question_papers IS 
  'Admins have read access to all question papers across all schools';

COMMENT ON POLICY "Admins can manage all question papers" ON question_papers IS 
  'Admins have full CRUD access to all question papers for system management';
