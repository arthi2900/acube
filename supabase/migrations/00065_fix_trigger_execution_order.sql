
-- Fix the trigger execution order
-- The generate_bank_name trigger must run BEFORE the serial number trigger
-- so that the serial number can be generated based on the correct bank_name

-- Drop both triggers
DROP TRIGGER IF EXISTS auto_generate_question_serial_number ON questions;
DROP TRIGGER IF EXISTS trigger_generate_bank_name ON questions;

-- Recreate generate_bank_name trigger FIRST (it will get action_order = 1)
CREATE TRIGGER trigger_generate_bank_name
  BEFORE INSERT OR UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION generate_bank_name();

-- Recreate serial number trigger SECOND (it will get action_order = 2)
CREATE TRIGGER auto_generate_question_serial_number
  BEFORE INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION generate_question_serial_number();

-- Add comment explaining the order
COMMENT ON TRIGGER trigger_generate_bank_name ON questions IS 
  'Must run before auto_generate_question_serial_number to ensure bank_name is set first';
COMMENT ON TRIGGER auto_generate_question_serial_number ON questions IS 
  'Runs after trigger_generate_bank_name to generate serial numbers based on the correct bank_name';
