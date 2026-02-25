
-- Add dedicated index on subjects.school_id for faster queries
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);

-- Add comment
COMMENT ON INDEX idx_subjects_school_id IS 'Optimizes queries filtering subjects by school_id';
