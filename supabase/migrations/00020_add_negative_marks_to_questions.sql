/*
# Add Negative Marks Field to Questions Table

## Plain English Explanation
This migration adds a negative marking field to the questions table. Teachers can now specify
marks to be deducted for incorrect answers. This is commonly used in competitive exams.

## Changes Made

### 1. New Column
- Table: questions
- Column: negative_marks
- Type: DECIMAL(5,2) - allows values like 0.25, 0.5, 1.0, etc.
- Default: 0 (no negative marking by default)
- Constraint: NOT NULL, CHECK (negative_marks >= 0)

### 2. Column Description
- Stores the marks to be deducted for incorrect answers
- Value of 0 means no negative marking
- Can be fractional (e.g., 0.25 for 1/4 mark deduction)
- Must be non-negative (>= 0)

## Examples
- negative_marks = 0 → No deduction for wrong answer
- negative_marks = 0.25 → Deduct 0.25 marks for wrong answer
- negative_marks = 0.5 → Deduct 0.5 marks for wrong answer
- negative_marks = 1 → Deduct 1 mark for wrong answer

## Notes
- Default value is 0 (backward compatible with existing questions)
- Teachers can optionally set negative marking per question
- Useful for competitive exams and assessments
- Validation ensures non-negative values only
*/

-- Add negative_marks column to questions table
ALTER TABLE questions
ADD COLUMN negative_marks DECIMAL(5,2) NOT NULL DEFAULT 0
CHECK (negative_marks >= 0);

-- Add column comment for documentation
COMMENT ON COLUMN questions.negative_marks IS 'Marks to be deducted for incorrect answers. Default 0 means no negative marking.';
