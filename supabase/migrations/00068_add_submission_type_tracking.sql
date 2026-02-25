-- Add submission type enum to track how exams were submitted
CREATE TYPE submission_type AS ENUM (
  'normal',              -- Regular manual submission by student
  'auto_submit',         -- Automatic submission when timer expires
  'manually_corrected'   -- Manually fixed by admin due to browser closure/network error
);

-- Add submission_type column to exam_attempts table
ALTER TABLE exam_attempts 
ADD COLUMN submission_type submission_type DEFAULT 'normal';

-- Add comment to explain the field
COMMENT ON COLUMN exam_attempts.submission_type IS 'Tracks how the exam was submitted: normal (manual), auto_submit (timer expired), or manually_corrected (fixed by admin)';

-- Update the 3 manually fixed attempts to mark them as manually_corrected
UPDATE exam_attempts
SET submission_type = 'manually_corrected'
WHERE id IN (
  '4fd143a2-1ab1-43c5-a2e6-9fdf297407f6',  -- AJIS C - TEST SCIECE
  '72de7a8c-bf7e-4b1d-898d-13380d93b49f',  -- Sakthipriya V - Series 1_9
  '13d2b9dc-5a49-4810-aa0b-ac09c6c96508'   -- Kishore P - Series 1_7
);

-- Create index for performance
CREATE INDEX idx_exam_attempts_submission_type ON exam_attempts(submission_type);