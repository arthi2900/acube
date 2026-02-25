/*
# Add Serial Numbers to Questions and Question Paper Questions (v2)

## Plain English Explanation
This migration adds serial number tracking to questions and question paper questions.
- Questions get a persistent serial_number that is auto-generated
- Question paper questions store both the original serial number and the re-sequenced paper number

## Changes

### 1. Add serial_number to questions table
- Column: serial_number (text)
- Format: Zero-padded 3-digit number (e.g., '001', '002', '003')
- Auto-generated for existing questions based on creation order

### 2. Add original_serial_number to question_paper_questions table
- Column: original_serial_number (text)
- Stores the serial number from the questions table at the time of selection
- Allows tracking which question from the bank was used

## Benefits
- Persistent serial numbers for questions that don't change
- Ability to track original question numbers during paper preparation
- Clear separation between original serial number and paper question number
- Better traceability and question reuse tracking
*/

-- Step 1: Add serial_number column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS serial_number text;

-- Step 2: Generate serial numbers for existing questions
-- Use a simple sequential numbering based on created_at within each school
DO $$
DECLARE
  question_record RECORD;
  school_counters JSONB := '{}'::JSONB;
  current_school_id text;
  current_counter integer;
BEGIN
  FOR question_record IN 
    SELECT 
      q.id,
      COALESCE(p.school_id::text, '00000000-0000-0000-0000-000000000000') as school_id
    FROM questions q
    LEFT JOIN profiles p ON p.id = q.created_by
    WHERE q.serial_number IS NULL
    ORDER BY 
      COALESCE(p.school_id::text, '00000000-0000-0000-0000-000000000000'),
      q.created_at, 
      q.id
  LOOP
    current_school_id := question_record.school_id;
    
    -- Get current counter for this school
    IF school_counters ? current_school_id THEN
      current_counter := (school_counters->current_school_id)::integer + 1;
    ELSE
      current_counter := 1;
    END IF;
    
    -- Update the question with serial number
    UPDATE questions
    SET serial_number = LPAD(current_counter::text, 3, '0')
    WHERE id = question_record.id;
    
    -- Update counter
    school_counters := jsonb_set(school_counters, ARRAY[current_school_id], to_jsonb(current_counter));
  END LOOP;
END $$;

-- Step 3: Make serial_number NOT NULL after populating
ALTER TABLE questions ALTER COLUMN serial_number SET NOT NULL;

-- Step 4: Add original_serial_number to question_paper_questions table
ALTER TABLE question_paper_questions ADD COLUMN IF NOT EXISTS original_serial_number text;

-- Step 5: Populate original_serial_number for existing question paper questions
UPDATE question_paper_questions qpq
SET original_serial_number = q.serial_number
FROM questions q
WHERE qpq.question_id = q.id
AND qpq.original_serial_number IS NULL;

-- Step 6: Create function to auto-generate serial number for new questions
CREATE OR REPLACE FUNCTION generate_question_serial_number()
RETURNS TRIGGER AS $$
DECLARE
  user_school_id uuid;
  next_serial_num integer;
BEGIN
  -- Get school_id from the user's profile
  SELECT school_id INTO user_school_id
  FROM profiles
  WHERE id = NEW.created_by;
  
  -- If no school_id found, use a default
  IF user_school_id IS NULL THEN
    user_school_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;
  
  -- Get the next serial number for this school
  -- Count existing questions from the same school
  SELECT COALESCE(MAX(q.serial_number::integer), 0) + 1 INTO next_serial_num
  FROM questions q
  LEFT JOIN profiles p ON p.id = q.created_by
  WHERE COALESCE(p.school_id, '00000000-0000-0000-0000-000000000000'::uuid) = user_school_id;
  
  -- Assign the serial number
  NEW.serial_number := LPAD(next_serial_num::text, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to auto-generate serial number for new questions
DROP TRIGGER IF EXISTS auto_generate_question_serial_number ON questions;
CREATE TRIGGER auto_generate_question_serial_number
  BEFORE INSERT ON questions
  FOR EACH ROW
  WHEN (NEW.serial_number IS NULL)
  EXECUTE FUNCTION generate_question_serial_number();

-- Step 8: Create function to auto-populate original_serial_number when adding questions to paper
CREATE OR REPLACE FUNCTION populate_original_serial_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the serial number from the questions table
  IF NEW.original_serial_number IS NULL THEN
    SELECT serial_number INTO NEW.original_serial_number
    FROM questions
    WHERE id = NEW.question_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to auto-populate original_serial_number
DROP TRIGGER IF EXISTS auto_populate_original_serial_number ON question_paper_questions;
CREATE TRIGGER auto_populate_original_serial_number
  BEFORE INSERT ON question_paper_questions
  FOR EACH ROW
  EXECUTE FUNCTION populate_original_serial_number();

-- Step 10: Add index on serial_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_questions_serial_number ON questions(serial_number);

-- Step 11: Add comments for documentation
COMMENT ON COLUMN questions.serial_number IS 'Persistent serial number unique within school (e.g., 001, 002, 003)';
COMMENT ON COLUMN question_paper_questions.original_serial_number IS 'Original serial number from questions table at time of selection';
COMMENT ON COLUMN question_paper_questions.display_order IS 'Re-sequenced question number in the final paper (1, 2, 3, etc.)';
