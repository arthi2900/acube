/*
# Fix Question Paper Update Policy

## Plain English Explanation
This migration fixes the Row Level Security (RLS) policy for updating question papers.
The previous policy prevented teachers from changing a draft paper's status to 'final'
because it only checked if the current status was 'draft', not allowing the status change itself.

## Problem
The old policy:
```sql
CREATE POLICY "Teachers can update own draft papers" ON question_papers
  FOR UPDATE USING (auth.uid() = created_by AND status = 'draft');
```

This policy:
- USING clause checks the OLD row (before update)
- Requires OLD.status = 'draft'
- But doesn't allow changing status to 'final'
- WITH CHECK clause was missing, so it defaults to same as USING
- Result: Cannot update status from 'draft' to 'final'

## Solution
Drop the old policy and create a new one that:
- USING: Checks OLD row - must be owned by teacher and currently draft
- WITH CHECK: Checks NEW row - must still be owned by same teacher
- This allows changing status from 'draft' to 'final'

## Changes
1. Drop old "Teachers can update own draft papers" policy
2. Create new policy with proper USING and WITH CHECK clauses
3. Teachers can now update their draft papers and change status to final

## Security
- Teachers can only update their own papers (auth.uid() = created_by)
- Can only update papers that are currently in draft status
- Cannot update other teachers' papers
- Cannot update papers that are already final
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Teachers can update own draft papers" ON question_papers;

-- Create new policy that allows status change from draft to final
CREATE POLICY "Teachers can update own draft papers" ON question_papers
  FOR UPDATE 
  USING (
    auth.uid() = created_by AND status = 'draft'
  )
  WITH CHECK (
    auth.uid() = created_by
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Teachers can update own draft papers" ON question_papers IS 
  'Allows teachers to update their own draft papers, including changing status to final. USING checks old row (must be draft), WITH CHECK ensures ownership is maintained.';
