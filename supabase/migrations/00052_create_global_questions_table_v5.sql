/*
# Create Global Questions Table (v5)

## Plain English Explanation
This migration creates a separate table for global questions to prevent duplication.
Global questions are shared across all schools and managed by admins.

## Problem Being Solved
- Current system copies questions when marking them as global
- This creates duplicates (e.g., "Synonyms - seized" has 4 duplicates)
- 81 global questions exist with many duplicates

## Solution
- Create dedicated global_questions table
- Migrate existing global questions (deduplicate first)
- Provide single source of truth for global questions
- Allow all users to read, only admins to manage
*/

-- Step 1: Create global_questions table (without unique constraint initially)
CREATE TABLE IF NOT EXISTS global_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  question_type question_type NOT NULL,
  options jsonb,
  correct_answer text NOT NULL,
  marks integer NOT NULL DEFAULT 1,
  difficulty difficulty_level DEFAULT 'medium',
  bank_name text NOT NULL DEFAULT 'Global_Default',
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  image_url text,
  negative_marks numeric NOT NULL DEFAULT 0,
  answer_options jsonb,
  serial_number text NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Metadata
  source_question_id uuid, -- Reference to original question if copied from school
  usage_count integer DEFAULT 0 -- Track how many times this question is used
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_global_questions_bank_name ON global_questions(bank_name);
CREATE INDEX IF NOT EXISTS idx_global_questions_difficulty ON global_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_global_questions_question_type ON global_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_global_questions_created_at ON global_questions(created_at);

-- Step 3: Create trigger for auto-generating serial numbers
CREATE OR REPLACE FUNCTION generate_global_question_serial_number()
RETURNS TRIGGER AS $$
DECLARE
  question_bank_name text;
  next_serial_num integer;
BEGIN
  -- Ensure bank_name has a value
  IF NEW.bank_name IS NULL OR NEW.bank_name = '' THEN
    NEW.bank_name := 'Global_Default';
  END IF;
  
  -- Only generate if serial_number is not provided
  IF NEW.serial_number IS NULL OR NEW.serial_number = '' THEN
    question_bank_name := NEW.bank_name;
    
    -- Get the next serial number for this bank
    SELECT COALESCE(MAX(serial_number::integer), 0) + 1 INTO next_serial_num
    FROM global_questions
    WHERE bank_name = question_bank_name;
    
    -- Assign the serial number
    NEW.serial_number := LPAD(next_serial_num::text, 3, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_global_question_serial_number
BEFORE INSERT ON global_questions
FOR EACH ROW
EXECUTE FUNCTION generate_global_question_serial_number();

-- Step 4: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_global_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_global_questions_updated_at
BEFORE UPDATE ON global_questions
FOR EACH ROW
EXECUTE FUNCTION update_global_questions_updated_at();

-- Step 5: Migrate existing global questions (deduplicated) with proper serial numbers
-- Use ROW_NUMBER to generate serial numbers during insert
WITH deduplicated_questions AS (
  SELECT 
    question_text,
    question_type,
    options,
    correct_answer,
    marks,
    difficulty,
    COALESCE(bank_name, 'Global_Default') as bank_name,
    lesson_id,
    image_url,
    negative_marks,
    answer_options,
    created_by,
    MIN(created_at) as created_at,
    (ARRAY_AGG(id ORDER BY created_at))[1] as source_question_id
  FROM questions
  WHERE is_global = true
  GROUP BY 
    question_text,
    question_type,
    options,
    correct_answer,
    marks,
    difficulty,
    bank_name,
    lesson_id,
    image_url,
    negative_marks,
    answer_options,
    created_by
),
numbered_questions AS (
  SELECT 
    *,
    LPAD(ROW_NUMBER() OVER (PARTITION BY bank_name ORDER BY created_at)::text, 3, '0') as generated_serial
  FROM deduplicated_questions
)
INSERT INTO global_questions (
  question_text,
  question_type,
  options,
  correct_answer,
  marks,
  difficulty,
  bank_name,
  lesson_id,
  image_url,
  negative_marks,
  answer_options,
  serial_number,
  created_by,
  created_at,
  source_question_id
)
SELECT 
  question_text,
  question_type,
  options,
  correct_answer,
  marks,
  difficulty,
  bank_name,
  lesson_id,
  image_url,
  negative_marks,
  answer_options,
  generated_serial,
  created_by,
  created_at,
  source_question_id
FROM numbered_questions
ORDER BY bank_name, created_at;

-- Step 6: Add unique constraint after data is populated
ALTER TABLE global_questions 
ADD CONSTRAINT global_questions_bank_serial_unique 
UNIQUE (bank_name, serial_number);

-- Step 7: Create RLS policies
ALTER TABLE global_questions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins have full access
CREATE POLICY "Admins have full access to global questions"
ON global_questions
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- Policy 2: All authenticated users can view global questions
CREATE POLICY "All users can view global questions"
ON global_questions
FOR SELECT
TO authenticated
USING (true);

-- Step 8: Add comments for documentation
COMMENT ON TABLE global_questions IS 'Global questions shared across all schools, managed by admins';
COMMENT ON COLUMN global_questions.serial_number IS 'Persistent serial number unique within each global question bank';
COMMENT ON COLUMN global_questions.source_question_id IS 'Reference to original question if copied from a school';
COMMENT ON COLUMN global_questions.usage_count IS 'Number of times this question has been used in question papers';
COMMENT ON COLUMN global_questions.bank_name IS 'Category/bank name for organizing global questions (e.g., "Global_English", "Global_Math")';

-- Step 9: Create a view to easily access all questions (school + global)
CREATE OR REPLACE VIEW all_questions_view AS
SELECT 
  id,
  question_text,
  question_type,
  options,
  correct_answer,
  marks,
  difficulty,
  bank_name,
  lesson_id,
  image_url,
  negative_marks,
  answer_options,
  serial_number,
  created_by,
  created_at,
  'school' as question_source,
  subject_id,
  is_global,
  source_question_id
FROM questions
UNION ALL
SELECT 
  id,
  question_text,
  question_type,
  options,
  correct_answer,
  marks,
  difficulty,
  bank_name,
  lesson_id,
  image_url,
  negative_marks,
  answer_options,
  serial_number,
  created_by,
  created_at,
  'global' as question_source,
  NULL as subject_id,
  true as is_global,
  source_question_id
FROM global_questions;

COMMENT ON VIEW all_questions_view IS 'Combined view of school questions and global questions for easy querying';
