-- Add is_global field to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT FALSE;

-- Add source_question_id to track copied questions
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS source_question_id UUID REFERENCES questions(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_is_global ON questions(is_global);
CREATE INDEX IF NOT EXISTS idx_questions_source_question_id ON questions(source_question_id);

-- Add comment for documentation
COMMENT ON COLUMN questions.is_global IS 'Indicates if the question is part of the global question bank accessible to all teachers';
COMMENT ON COLUMN questions.source_question_id IS 'References the original question if this is a copy from user bank to global bank';