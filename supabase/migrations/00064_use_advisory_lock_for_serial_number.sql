
-- Use PostgreSQL advisory locks to prevent race conditions in serial number generation
-- This ensures that only one transaction can generate a serial number for a given bank at a time

DROP TRIGGER IF EXISTS auto_generate_question_serial_number ON questions;
DROP FUNCTION IF EXISTS generate_question_serial_number();

-- Create a function that uses advisory locks to prevent race conditions
CREATE OR REPLACE FUNCTION generate_question_serial_number()
RETURNS TRIGGER AS $$
DECLARE
  question_bank_name text;
  next_serial_num integer;
  max_serial text;
  lock_key bigint;
BEGIN
  -- Skip if serial_number is already provided
  IF NEW.serial_number IS NOT NULL AND NEW.serial_number != '' THEN
    RETURN NEW;
  END IF;
  
  -- Get the bank_name for this question
  question_bank_name := COALESCE(NEW.bank_name, 'default');
  
  -- Generate a lock key based on the bank name (hash it to get a consistent integer)
  lock_key := ('x' || substr(md5(question_bank_name), 1, 15))::bit(60)::bigint;
  
  -- Acquire an advisory lock for this bank (this will wait if another transaction has the lock)
  PERFORM pg_advisory_xact_lock(lock_key);
  
  -- Now safely get the maximum serial number for this bank
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
  
  -- The advisory lock will be automatically released at the end of the transaction
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER auto_generate_question_serial_number
  BEFORE INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION generate_question_serial_number();

-- Add a comment explaining the solution
COMMENT ON FUNCTION generate_question_serial_number() IS 
  'Automatically generates sequential serial numbers for questions within each bank.
   Uses PostgreSQL advisory locks to prevent race conditions during bulk uploads.
   Serial numbers are zero-padded to 3 digits (e.g., 001, 002, 003).
   Questions without a bank_name are assigned to the "default" bank.';
