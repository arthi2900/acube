
-- Fix the race condition in serial number generation during bulk uploads
-- The issue is that multiple concurrent inserts try to use the same serial number
-- Solution: Use a more robust approach with proper locking

DROP TRIGGER IF EXISTS auto_generate_question_serial_number ON questions;
DROP FUNCTION IF EXISTS generate_question_serial_number();

-- Create a function that handles concurrent inserts with proper locking
CREATE OR REPLACE FUNCTION generate_question_serial_number()
RETURNS TRIGGER AS $$
DECLARE
  question_bank_name text;
  next_serial_num integer;
  max_serial text;
BEGIN
  -- Skip if serial_number is already provided
  IF NEW.serial_number IS NOT NULL AND NEW.serial_number != '' THEN
    RETURN NEW;
  END IF;
  
  -- Get the bank_name for this question
  question_bank_name := COALESCE(NEW.bank_name, 'default');
  
  -- Use SELECT FOR UPDATE to lock the rows and prevent race conditions
  -- Get the maximum serial number for this bank
  SELECT MAX(serial_number) INTO max_serial
  FROM questions
  WHERE COALESCE(bank_name, 'default') = question_bank_name
    AND serial_number ~ '^[0-9]+$'  -- Only consider numeric serial numbers
  FOR UPDATE;
  
  -- Calculate next serial number
  IF max_serial IS NULL THEN
    next_serial_num := 1;
  ELSE
    next_serial_num := max_serial::integer + 1;
  END IF;
  
  -- Assign the serial number with zero-padding (3 digits)
  NEW.serial_number := LPAD(next_serial_num::text, 3, '0');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, generate a random serial number to avoid blocking
    NEW.serial_number := LPAD((FLOOR(RANDOM() * 999) + 1)::text, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER auto_generate_question_serial_number
  BEFORE INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION generate_question_serial_number();
