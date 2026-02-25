
-- Create a function to re-serialize questions in a bank
-- This removes gaps in serial numbers and makes them sequential again

CREATE OR REPLACE FUNCTION reserialize_questions_in_bank(target_bank_name text)
RETURNS TABLE (
  questions_updated integer,
  old_max_serial integer,
  new_max_serial integer
) AS $$
DECLARE
  v_questions_updated integer := 0;
  v_old_max_serial integer;
  v_new_max_serial integer;
  v_question_record RECORD;
  v_new_serial integer := 1;
BEGIN
  -- Get the old max serial number
  SELECT MAX(serial_number::integer) INTO v_old_max_serial
  FROM questions
  WHERE bank_name = target_bank_name
    AND serial_number ~ '^[0-9]+$';
  
  -- Temporarily disable the unique constraint by updating to temporary values
  -- First, update all serial numbers to negative values to avoid conflicts
  UPDATE questions
  SET serial_number = '-' || serial_number
  WHERE bank_name = target_bank_name;
  
  -- Now re-assign sequential serial numbers based on the original order
  FOR v_question_record IN
    SELECT id
    FROM questions
    WHERE bank_name = target_bank_name
    ORDER BY 
      -- Try to parse the serial number (removing the '-' prefix we added)
      CASE 
        WHEN SUBSTRING(serial_number FROM 2) ~ '^[0-9]+$' 
        THEN SUBSTRING(serial_number FROM 2)::integer
        ELSE 999999
      END,
      created_at
  LOOP
    -- Update with new sequential serial number
    UPDATE questions
    SET serial_number = LPAD(v_new_serial::text, 3, '0')
    WHERE id = v_question_record.id;
    
    v_new_serial := v_new_serial + 1;
    v_questions_updated := v_questions_updated + 1;
  END LOOP;
  
  -- Get the new max serial number
  v_new_max_serial := v_questions_updated;
  
  -- Return the results
  RETURN QUERY SELECT v_questions_updated, v_old_max_serial, v_new_max_serial;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the function
COMMENT ON FUNCTION reserialize_questions_in_bank(text) IS 
  'Re-serializes all questions in a specific bank to remove gaps in serial numbers.
   Questions are renumbered sequentially (001, 002, 003...) based on their original serial number order.
   Returns the number of questions updated and the old/new max serial numbers.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reserialize_questions_in_bank(text) TO authenticated;
