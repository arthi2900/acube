-- Add missing columns to lessons table
ALTER TABLE lessons 
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update existing records to set class_id from subject
UPDATE lessons l
SET class_id = s.class_id
FROM subjects s
WHERE l.subject_id = s.id AND l.class_id IS NULL;

-- Update existing records to set school_id from subject
UPDATE lessons l
SET school_id = s.school_id
FROM subjects s
WHERE l.subject_id = s.id AND l.school_id IS NULL;

-- Make class_id and school_id NOT NULL after updating
ALTER TABLE lessons 
  ALTER COLUMN class_id SET NOT NULL,
  ALTER COLUMN school_id SET NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lessons_class_subject ON lessons(class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_school ON lessons(school_id);

-- Drop existing constraint if it exists and create new one
DO $$ 
BEGIN
  ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_subject_id_lesson_name_key;
  ALTER TABLE lessons ADD CONSTRAINT lessons_unique_per_school 
    UNIQUE(class_id, subject_id, lesson_name, school_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view lessons in their school" ON lessons;
DROP POLICY IF EXISTS "Teachers and principals can create lessons" ON lessons;
DROP POLICY IF EXISTS "Teachers and principals can update lessons" ON lessons;
DROP POLICY IF EXISTS "Teachers and principals can delete lessons" ON lessons;

-- Policy: Teachers and principals can view lessons in their school
CREATE POLICY "Users can view lessons in their school"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Teachers and principals can create lessons in their school
CREATE POLICY "Teachers and principals can create lessons"
  ON lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'principal', 'admin')
    )
  );

-- Policy: Teachers and principals can update lessons in their school
CREATE POLICY "Teachers and principals can update lessons"
  ON lessons FOR UPDATE
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'principal', 'admin')
    )
  );

-- Policy: Teachers and principals can delete lessons in their school
CREATE POLICY "Teachers and principals can delete lessons"
  ON lessons FOR DELETE
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'principal', 'admin')
    )
  );