
-- Fix the serial number generation to use numeric MAX instead of text MAX
CREATE OR REPLACE FUNCTION generate_question_serial_number()
RETURNS TRIGGER AS $$
DECLARE
  question_bank_name text;
  next_serial_num integer;
  max_serial_int integer;
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
  
  -- Now safely get the maximum serial number for this bank (NUMERIC comparison, not text!)
  SELECT COALESCE(MAX(serial_number::integer), 0) INTO max_serial_int
  FROM questions
  WHERE COALESCE(bank_name, 'default') = question_bank_name
    AND serial_number ~ '^[0-9]+$';  -- Only consider numeric serial numbers
  
  -- Calculate next serial number
  next_serial_num := max_serial_int + 1;
  
  -- Assign the serial number with dynamic zero-padding (minimum 3 digits, but can grow)
  NEW.serial_number := LPAD(next_serial_num::text, GREATEST(3, LENGTH(next_serial_num::text)), '0');
  
  -- The advisory lock will be automatically released at the end of the transaction
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
