/*
# Fix Total Marks Calculation Trigger

## Plain English Explanation
This migration fixes the trigger function that calculates total marks for question papers.
The original function was running with the privileges of the user who triggered it,
which meant it was subject to RLS policies. This caused the trigger to fail when
updating FINAL papers because the RLS policy only allows updates to DRAFT papers.

## Changes Made
1. **Modified calculate_question_paper_total_marks() function**
   - Added `SECURITY DEFINER` to run with elevated privileges
   - This allows the trigger to update total_marks even for FINAL papers
   - The function now bypasses RLS policies when updating total_marks

## Security Considerations
- The function only updates the total_marks field, which is a calculated value
- It doesn't expose any sensitive data or allow unauthorized access
- The function is only triggered by INSERT/DELETE on question_paper_questions
- Users can only trigger this for their own papers due to RLS on question_paper_questions

## Notes
- This fix ensures total_marks is correctly calculated for both DRAFT and FINAL papers
- The trigger will now work correctly when teachers directly generate FINAL papers
*/

-- Drop and recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION calculate_question_paper_total_marks()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE question_papers
  SET total_marks = (
    SELECT COALESCE(SUM(q.marks), 0)
    FROM question_paper_questions qpq
    JOIN questions q ON q.id = qpq.question_id
    WHERE qpq.question_paper_id = COALESCE(NEW.question_paper_id, OLD.question_paper_id)
  )
  WHERE id = COALESCE(NEW.question_paper_id, OLD.question_paper_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;