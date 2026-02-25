/*
# Fix Subjects Table Structure

## Problem
There were two conflicting subjects table definitions:
1. Old structure (migration 00001): columns `name`, `code`, `description`
2. New structure (migration 00012): columns `subject_name`, `subject_code`, `school_id`, `class_id`

The `CREATE TABLE IF NOT EXISTS` in migration 00012 didn't recreate the table,
causing a mismatch between the database structure and the application code.

## Solution
1. Drop the old subjects table (CASCADE to handle foreign key dependencies)
2. Recreate with the correct structure from migration 00012
3. Recreate dependent tables (questions, exams, etc.)

## Impact
- All existing subjects data will be lost
- All existing questions will be lost
- All existing exams will be lost
- This is acceptable for a development/setup phase
- Principals will need to recreate subjects
- Teachers will need to recreate questions

## New Structure
- `subjects` table with proper columns:
  - `id` (uuid, primary key)
  - `school_id` (uuid, required, references schools)
  - `class_id` (uuid, required, references classes)
  - `subject_name` (text, required)
  - `subject_code` (text, required)
  - `description` (text, optional)
  - `created_at` (timestamptz)
  - UNIQUE constraint on (school_id, class_id, subject_code)
*/

-- Drop dependent tables first (CASCADE will handle foreign keys)
DROP TABLE IF EXISTS exam_answers CASCADE;
DROP TABLE IF EXISTS exam_attempts CASCADE;
DROP TABLE IF EXISTS exam_schedules CASCADE;
DROP TABLE IF EXISTS exam_questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS questions CASCADE;

-- Drop and recreate subjects table with correct structure
DROP TABLE IF EXISTS subjects CASCADE;

CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_name text NOT NULL,
  subject_code text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(school_id, class_id, subject_code)
);

-- Recreate questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type question_type NOT NULL,
  options jsonb,
  correct_answer text NOT NULL,
  marks integer NOT NULL DEFAULT 1,
  difficulty difficulty_level DEFAULT 'medium'::difficulty_level,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Recreate exams table
CREATE TABLE exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  duration_minutes integer NOT NULL,
  total_marks integer DEFAULT 0,
  pass_marks integer NOT NULL,
  instructions text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Recreate exam_questions table
CREATE TABLE exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  question_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, question_id)
);

-- Recreate exam_schedules table
CREATE TABLE exam_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Recreate exam_attempts table
CREATE TABLE exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  status exam_status DEFAULT 'not_started'::exam_status,
  score integer,
  total_marks integer,
  percentage numeric(5,2),
  result exam_result,
  created_at timestamptz DEFAULT now()
);

-- Recreate exam_answers table
CREATE TABLE exam_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer text,
  is_correct boolean,
  marks_obtained integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- Recreate RLS policies for subjects
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subjects" ON subjects
  FOR SELECT USING (true);

CREATE POLICY "Principals can manage subjects in their school" ON subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'principal'
      AND profiles.school_id = subjects.school_id
    )
  );

-- Recreate RLS policies for questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions" ON questions
  FOR SELECT USING (true);

CREATE POLICY "Teachers can manage their own questions" ON questions
  FOR ALL USING (auth.uid() = created_by);

-- Recreate RLS policies for exams
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exams" ON exams
  FOR SELECT USING (true);

CREATE POLICY "Teachers can manage their own exams" ON exams
  FOR ALL USING (auth.uid() = created_by);

-- Recreate RLS policies for exam_questions
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exam questions" ON exam_questions
  FOR SELECT USING (true);

CREATE POLICY "Teachers can manage exam questions for their exams" ON exam_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_questions.exam_id
      AND exams.created_by = auth.uid()
    )
  );

-- Recreate RLS policies for exam_schedules
ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exam schedules" ON exam_schedules
  FOR SELECT USING (true);

CREATE POLICY "Teachers can manage exam schedules for their exams" ON exam_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_schedules.exam_id
      AND exams.created_by = auth.uid()
    )
  );

-- Recreate RLS policies for exam_attempts
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own attempts" ON exam_attempts
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own attempts" ON exam_attempts
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own attempts" ON exam_attempts
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view attempts for their exams" ON exam_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_attempts.exam_id
      AND exams.created_by = auth.uid()
    )
  );

-- Recreate RLS policies for exam_answers
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own answers" ON exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_attempts
      WHERE exam_attempts.id = exam_answers.attempt_id
      AND exam_attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can manage their own answers" ON exam_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM exam_attempts
      WHERE exam_attempts.id = exam_answers.attempt_id
      AND exam_attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view answers for their exams" ON exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_attempts
      JOIN exams ON exams.id = exam_attempts.exam_id
      WHERE exam_attempts.id = exam_answers.attempt_id
      AND exams.created_by = auth.uid()
    )
  );
