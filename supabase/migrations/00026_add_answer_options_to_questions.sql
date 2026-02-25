/*
# Add Answer Options for Multiple Response Questions

## Plain English Explanation
This migration adds support for Multiple Response questions with three distinct segments:
1. Question Text - The actual question
2. Options (A, B, C, D) - The answer choices
3. Answer Options (i, ii, iii, iv) - Student's selection options (combinations of A, B, C, D)

This format is common in competitive exams where students don't directly mark A, B, C, D,
but instead choose from predefined combinations like:
- (i) A and C only
- (ii) A, B and C only
- (iii) B and D only
- (iv) All of the above

## Changes Made

### 1. Add answer_options Column to questions Table
- `answer_options` (jsonb, nullable) - Array of answer option strings for multiple_response questions
- Only used for question_type = 'multiple_response'
- Each answer option represents a combination of the main options (A, B, C, D)

### 2. Update question_paper_questions Table
- Add `shuffled_answer_options` (jsonb, nullable) - Shuffled version of answer options
- Allows independent shuffling of both options and answer options

## Example Data Structure

For a multiple response question:
```json
{
  "question_text": "Which of the following are prime numbers?",
  "options": ["2", "4", "7", "9"],
  "answer_options": [
    "A and C only",
    "A, B and C only", 
    "B and D only",
    "A, C and D only"
  ],
  "correct_answer": "A and C only"
}
```

After shuffling, both segments can be independently randomized.

## Security
- No RLS changes needed (inherits from existing questions table policies)
- No new permissions required
*/

-- Add answer_options column to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS answer_options jsonb DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN questions.answer_options IS 
'For multiple_response questions: Array of answer option strings (e.g., ["A and C only", "A, B and C only"]). Students select from these options (i, ii, iii, iv) instead of directly marking A, B, C, D.';

-- Add shuffled_answer_options column to question_paper_questions table
ALTER TABLE question_paper_questions
ADD COLUMN IF NOT EXISTS shuffled_answer_options jsonb DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN question_paper_questions.shuffled_answer_options IS
'Shuffled version of answer_options for this specific question paper. Allows independent shuffling of answer options separate from main options.';
