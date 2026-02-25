
-- Fix the serial number generation trigger to handle bulk uploads properly
-- The issue is that the trigger tries to cast serial_number to integer,
-- but it should handle the case where serial_number might be empty or have issues

DROP TRIGGER IF EXISTS auto_generate_question_serial_number ON questions;
DROP FUNCTION IF EXISTS generate_question_serial_number();

-- Create improved function that handles concurrent inserts better
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
  
  -- Get the maximum serial number for this bank (safely handle non-numeric values)
  SELECT MAX(serial_number) INTO max_serial
  FROM questions
  WHERE COALESCE(bank_name, 'default') = question_bank_name
    AND serial_number ~ '^[0-9]+$';  -- Only consider numeric serial numbers
  
  -- Calculate next serial number
  IF max_serial IS NULL THEN
    next_serial_num := 1;
  ELSE
    next_serial_num := max_serial::integer + 1;
  END IF;
  
  -- Assign the serial number with zero-padding (3 digits)
  NEW.serial_number := LPAD(next_serial_num::text, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER auto_generate_question_serial_number
  BEFORE INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION generate_question_serial_number();

-- Add a comment explaining the trigger
COMMENT ON FUNCTION generate_question_serial_number() IS 
  'Automatically generates sequential serial numbers for questions within each bank. 
   Serial numbers are zero-padded to 3 digits (e.g., 001, 002, 003).
   Questions without a bank_name are assigned to the "default" bank.';
