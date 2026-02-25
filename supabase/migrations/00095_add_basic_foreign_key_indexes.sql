-- Migration: Add Basic Foreign Key Indexes
-- Purpose: Optimize simple lookups and foreign key joins
-- Impact: Faster single-column queries and join operations

-- Exam Answers Indexes
CREATE INDEX IF NOT EXISTS idx_exam_answers_attempt ON exam_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_question ON exam_answers(question_id);

-- Exam Attempts Indexes
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON exam_attempts(student_id);

-- Questions Index
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);

-- Exams Status Index
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);

-- Add comments for documentation
COMMENT ON INDEX idx_exam_answers_attempt IS 'Optimizes lookups by attempt_id for answer retrieval';
COMMENT ON INDEX idx_exam_answers_question IS 'Optimizes lookups by question_id for answer analysis';
COMMENT ON INDEX idx_exam_attempts_exam IS 'Optimizes lookups by exam_id for attempt listing';
COMMENT ON INDEX idx_exam_attempts_student IS 'Optimizes lookups by student_id for student history';
COMMENT ON INDEX idx_questions_subject IS 'Optimizes lookups by subject_id for question filtering';
COMMENT ON INDEX idx_exams_status IS 'Optimizes filtering exams by status';

-- Note: These single-column indexes complement the composite indexes already created
-- - Composite indexes (e.g., idx_exam_attempts_student_status) are used for multi-column queries
-- - Single-column indexes are used for simple lookups and foreign key joins
-- - PostgreSQL can use either depending on the query pattern