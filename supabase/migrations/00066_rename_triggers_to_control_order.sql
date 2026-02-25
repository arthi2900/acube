
-- Rename triggers to control execution order (PostgreSQL executes triggers alphabetically)
-- Prefix with numbers to ensure correct order:
-- 1. First generate bank_name
-- 2. Then generate serial_number

-- Drop both triggers
DROP TRIGGER IF EXISTS auto_generate_question_serial_number ON questions;
DROP TRIGGER IF EXISTS trigger_generate_bank_name ON questions;

-- Create trigger 1: Generate bank_name (runs first alphabetically)
CREATE TRIGGER a_generate_bank_name
  BEFORE INSERT OR UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION generate_bank_name();

-- Create trigger 2: Generate serial_number (runs second alphabetically)
CREATE TRIGGER b_generate_serial_number
  BEFORE INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION generate_question_serial_number();

-- Add comments explaining the order
COMMENT ON TRIGGER a_generate_bank_name ON questions IS 
  'Step 1: Generate bank_name from class and subject. Must run before b_generate_serial_number.';
COMMENT ON TRIGGER b_generate_serial_number ON questions IS 
  'Step 2: Generate serial_number based on bank_name. Runs after a_generate_bank_name.';
