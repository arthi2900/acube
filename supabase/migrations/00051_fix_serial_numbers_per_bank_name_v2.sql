/*
# Fix Serial Numbers to be Unique Per Question Bank (v2)

## Plain English Explanation
This migration updates the serial number system to be unique per question bank (bank_name)
instead of per school. Each question bank will have its own serial number sequence starting from 001.

For example:
- "Class 10 - English" bank: questions numbered 001, 002, 003, etc.
- "Class 10 - Science" bank: questions numbered 001, 002, 003, etc. (independent sequence)

## Changes
1. Regenerate serial numbers for all existing questions grouped by bank_name
2. Update the trigger function to generate serial numbers based on bank_name
3. Add index on (bank_name, serial_number) for better performance
*/

-- Step 1: Drop the old unique index if it exists
DROP INDEX IF EXISTS idx_questions_school_serial;

-- Step 2: Drop the old function if it exists
DROP FUNCTION IF EXISTS get_question_school_id(uuid);

-- Step 3: Temporarily make serial_number nullable for regeneration
ALTER TABLE questions ALTER COLUMN serial_number DROP NOT NULL;

-- Step 4: Regenerate serial numbers for existing questions grouped by bank_name
DO $$
DECLARE
  question_record RECORD;
  bank_counters JSONB := '{}'::JSONB;
  current_bank_name text;
  current_counter integer;
BEGIN
  -- First, reset all serial numbers to NULL
  UPDATE questions SET serial_number = NULL;
  
  -- Then regenerate them grouped by bank_name
  FOR question_record IN 
    SELECT 
      id,
      COALESCE(bank_name, 'default') as bank_name
    FROM questions
    ORDER BY 
      COALESCE(bank_name, 'default'),
      created_at, 
      id
  LOOP
    current_bank_name := question_record.bank_name;
    
    -- Get current counter for this bank
    IF bank_counters ? current_bank_name THEN
      current_counter := (bank_counters->current_bank_name)::integer + 1;
    ELSE
      current_counter := 1;
    END IF;
    
    -- Update the question with serial number
    UPDATE questions
    SET serial_number = LPAD(current_counter::text, 3, '0')
    WHERE id = question_record.id;
    
    -- Update counter
    bank_counters := jsonb_set(bank_counters, ARRAY[current_bank_name], to_jsonb(current_counter));
  END LOOP;
END $$;

-- Step 5: Make serial_number NOT NULL again
ALTER TABLE questions ALTER COLUMN serial_number SET NOT NULL;

-- Step 6: Update the trigger function to generate serial numbers based on bank_name
CREATE OR REPLACE FUNCTION generate_question_serial_number()
RETURNS TRIGGER AS $$
DECLARE
  question_bank_name text;
  next_serial_num integer;
BEGIN
  -- Get the bank_name for this question
  question_bank_name := COALESCE(NEW.bank_name, 'default');
  
  -- Get the next serial number for this bank
  SELECT COALESCE(MAX(serial_number::integer), 0) + 1 INTO next_serial_num
  FROM questions
  WHERE COALESCE(bank_name, 'default') = question_bank_name;
  
  -- Assign the serial number
  NEW.serial_number := LPAD(next_serial_num::text, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create unique index on (bank_name, serial_number)
-- This ensures serial numbers are unique within each bank
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_bank_serial 
ON questions (COALESCE(bank_name, 'default'), serial_number);

-- Step 8: Update original_serial_number in question_paper_questions to match new serial numbers
UPDATE question_paper_questions qpq
SET original_serial_number = q.serial_number
FROM questions q
WHERE qpq.question_id = q.id;

-- Step 9: Update comments for documentation
COMMENT ON COLUMN questions.serial_number IS 'Persistent serial number unique within each question bank (e.g., 001, 002, 003)';
COMMENT ON INDEX idx_questions_bank_serial IS 'Ensures serial numbers are unique within each question bank';
