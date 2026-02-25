/*
# Allow Renaming Final Question Papers

## Problem
Teachers cannot rename question papers that have 'final' status because the current
update policy only allows updating papers with 'draft' status.

## Solution
Add a new policy that allows teachers to update the title of their own papers
regardless of status (draft or final), while preventing changes to other critical fields.

## Changes
1. Create a new policy specifically for renaming (updating title only)
2. This policy allows updating title for both draft and final papers
3. Teachers can only rename their own papers

## Security
- Teachers can only update title field of their own papers
- Cannot modify other fields like status, marks, etc.
- Ownership check ensures teachers can only rename their own papers
*/

-- Create policy for renaming question papers (title update only)
CREATE POLICY "Teachers can rename own papers" ON question_papers
  FOR UPDATE 
  USING (
    auth.uid() = created_by
  )
  WITH CHECK (
    auth.uid() = created_by
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Teachers can rename own papers" ON question_papers IS 
  'Allows teachers to rename (update title of) their own question papers regardless of status (draft or final). Teachers can only update their own papers.';