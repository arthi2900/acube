
-- Add index on lessons.subject_id for faster queries
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id_optimized ON lessons(subject_id);

-- Add comment
COMMENT ON INDEX idx_lessons_subject_id_optimized IS 'Optimizes queries filtering lessons by subject_id, especially for school-wide lesson lookups';
