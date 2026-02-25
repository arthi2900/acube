
-- Add index on questions.subject_id to optimize joins with subjects table
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);

-- Add composite index for common query pattern (subject_id + created_at for ordering)
CREATE INDEX IF NOT EXISTS idx_questions_subject_created ON questions(subject_id, created_at DESC);
