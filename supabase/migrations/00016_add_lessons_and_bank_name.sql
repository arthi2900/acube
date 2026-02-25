/*
# Add Lessons Table and Question Bank Name

## Overview
This migration adds lesson management capability and auto-generated bank names to the question system.

## Changes

### 1. New Tables
- `lessons`
  - `id` (uuid, primary key)
  - `subject_id` (uuid, foreign key → subjects.id)
  - `lesson_name` (text, required)
  - `lesson_code` (varchar, optional)
  - `created_at` (timestamptz, default: now())

### 2. Modified Tables
- `questions`
  - Added `lesson_id` (uuid, foreign key → lessons.id, nullable)
  - Added `bank_name` (text, auto-generated as "ClassName_SubjectName")

### 3. Functions
- `generate_bank_name()`: Trigger function to auto-generate bank_name from class and subject
- `get_class_name_from_subject()`: Helper function to get class name from subject_id

### 4. Security
- Enable RLS on lessons table
- Public read access for lessons
- Teachers and admins can create/update/delete lessons
- Auto-generate bank_name on question insert/update

## Purpose
- Enable lesson-level organization of questions
- Support lesson-wise performance analytics
- Auto-generate descriptive bank names for questions
- Maintain data integrity with proper foreign keys
*/

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  lesson_name text NOT NULL,
  lesson_code varchar(50),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON lessons(subject_id);

-- Enable RLS on lessons table
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Public read access for lessons
CREATE POLICY "Anyone can view lessons" ON lessons
  FOR SELECT USING (true);

-- Teachers and admins can manage lessons
CREATE POLICY "Teachers and admins can insert lessons" ON lessons
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers and admins can update lessons" ON lessons
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers and admins can delete lessons" ON lessons
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'admin')
    )
  );

-- Add lesson_id and bank_name to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS bank_name text;

-- Create index for lesson_id
CREATE INDEX IF NOT EXISTS idx_questions_lesson_id ON questions(lesson_id);

-- Helper function to get class name from subject_id
CREATE OR REPLACE FUNCTION get_class_name_from_subject(p_subject_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_class_name text;
BEGIN
  SELECT c.class_name INTO v_class_name
  FROM subjects s
  JOIN classes c ON s.class_id = c.id
  WHERE s.id = p_subject_id;
  
  RETURN v_class_name;
END;
$$;

-- Function to auto-generate bank_name
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
  -- Remove spaces and special characters for clean format
  NEW.bank_name := REPLACE(v_class_name, ' ', '') || '_' || REPLACE(v_subject_name, ' ', '');
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate bank_name on insert and update
DROP TRIGGER IF EXISTS trigger_generate_bank_name ON questions;
CREATE TRIGGER trigger_generate_bank_name
  BEFORE INSERT OR UPDATE OF subject_id ON questions
  FOR EACH ROW
  EXECUTE FUNCTION generate_bank_name();

-- Update existing questions to have bank_name
UPDATE questions q
SET bank_name = REPLACE(c.class_name, ' ', '') || '_' || REPLACE(s.subject_name, ' ', '')
FROM subjects s
JOIN classes c ON s.class_id = c.id
WHERE q.subject_id = s.id
AND q.bank_name IS NULL;

-- Add comment to document the bank_name format
COMMENT ON COLUMN questions.bank_name IS 'Auto-generated name in format: ClassName_SubjectName (e.g., Class10_English)';
COMMENT ON COLUMN questions.lesson_id IS 'Optional reference to lesson for lesson-level analytics';
