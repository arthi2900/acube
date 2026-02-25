-- Add indexes to improve Student Dashboard performance

-- Index for fetching all attempts by student (used in dashboard)
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_id 
ON exam_attempts(student_id);

-- Composite index for fetching specific exam attempt by student
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_exam 
ON exam_attempts(student_id, exam_id);

-- Index for filtering exams by status (published exams)
CREATE INDEX IF NOT EXISTS idx_exams_status 
ON exams(status);

-- Composite index for student class section lookups
CREATE INDEX IF NOT EXISTS idx_student_class_section_student_year 
ON student_class_sections(student_id, academic_year);

-- Index for exam attempts by status (for filtering completed/submitted)
CREATE INDEX IF NOT EXISTS idx_exam_attempts_status 
ON exam_attempts(status);

-- Composite index for student attempts with status
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_status 
ON exam_attempts(student_id, status);