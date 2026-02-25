
-- Fix the generate_bank_name function to preserve spaces in class names
-- This ensures "Class 10" + "English" becomes "Class 10_English" instead of "Class10_English"

CREATE OR REPLACE FUNCTION generate_bank_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_class_name text;
  v_subject_name text;
BEGIN
  -- Get class name and subject name
  SELECT 
    c.class_name,
    s.subject_name
  INTO v_class_name, v_subject_name
  FROM subjects s
  JOIN classes c ON s.class_id = c.id
  WHERE s.id = NEW.subject_id;
  
  -- Generate bank_name in format: ClassName_SubjectName
  -- Preserve spaces in class name, only remove spaces from subject name for consistency
  NEW.bank_name := v_class_name || '_' || REPLACE(v_subject_name, ' ', '');
  
  RETURN NEW;
END;
$$;

-- Update existing questions to fix their bank_name with proper spacing
UPDATE questions q
SET bank_name = c.class_name || '_' || REPLACE(s.subject_name, ' ', '')
FROM subjects s
JOIN classes c ON s.class_id = c.id
WHERE q.subject_id = s.id;

-- Add comment to document the updated bank_name format
COMMENT ON COLUMN questions.bank_name IS 'Auto-generated name in format: ClassName_SubjectName (e.g., Class 10_English). Class name preserves spaces, subject name has spaces removed.';
