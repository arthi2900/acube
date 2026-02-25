/*
# Add New Question Types

## Plain English Explanation
This migration adds two new question types to the question bank system:
1. **match_following**: For "Match the Following" questions where students match items from two columns
2. **multiple_response**: For "Multiple Response MCQ" questions where multiple answers can be correct

## Changes Made

### 1. Enum Type Update
- Adds 'match_following' and 'multiple_response' to the question_type enum
- Uses ALTER TYPE to extend the existing enum

### 2. Table Structure
The existing questions table already supports these new types:
- `options` (jsonb): Will store match pairs for match_following, options array for multiple_response
- `correct_answer` (text): Will store correct matches for match_following, comma-separated correct options for multiple_response

### 3. Data Format

**Match the Following:**
- options: JSON array of objects with 'left' and 'right' properties
  Example: [{"left": "Item 1", "right": "Match A"}, {"left": "Item 2", "right": "Match B"}]
- correct_answer: JSON string of correct pairs
  Example: '{"Item 1": "Match A", "Item 2": "Match B"}'

**Multiple Response MCQ:**
- options: JSON array of option strings
  Example: ["Option A", "Option B", "Option C", "Option D"]
- correct_answer: Comma-separated correct options
  Example: "Option B,Option C"

## Notes
- No changes to RLS policies needed
- Existing validation logic will work with new types
- Frontend will handle the specific rendering and validation for each type
*/

-- Add new question types to the enum
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'match_following';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'multiple_response';

-- Add comment to questions table for clarity
COMMENT ON COLUMN questions.options IS 'For MCQ/True-False: array of options. For Match Following: array of {left, right} pairs. For Multiple Response: array of options.';
COMMENT ON COLUMN questions.correct_answer IS 'For MCQ/True-False/Short Answer: single answer. For Match Following: JSON of correct pairs. For Multiple Response: comma-separated correct options.';
