/*
# Create Online Exam Management System Schema

## 1. New Tables

### profiles
- `id` (uuid, primary key, references auth.users)
- `username` (text, unique, not null)
- `full_name` (text)
- `role` (user_role enum: 'admin', 'principal', 'teacher', 'student')
- `created_at` (timestamptz, default: now())

### subjects
- `id` (uuid, primary key)
- `name` (text, not null)
- `code` (text, unique, not null)
- `description` (text)
- `created_by` (uuid, references profiles)
- `created_at` (timestamptz, default: now())

### questions
- `id` (uuid, primary key)
- `subject_id` (uuid, references subjects)
- `question_text` (text, not null)
- `question_type` (question_type enum: 'mcq', 'true_false', 'short_answer')
- `options` (jsonb) - for MCQ options
- `correct_answer` (text, not null)
- `marks` (integer, not null)
- `difficulty` (difficulty_level enum: 'easy', 'medium', 'hard')
- `created_by` (uuid, references profiles)
- `created_at` (timestamptz, default: now())

### exams
- `id` (uuid, primary key)
- `title` (text, not null)
- `subject_id` (uuid, references subjects)
- `duration_minutes` (integer, not null)
- `total_marks` (integer, not null)
- `pass_marks` (integer, not null)
- `instructions` (text)
- `status` (exam_status enum: 'draft', 'pending_approval', 'approved', 'published', 'completed')
- `created_by` (uuid, references profiles)
- `approved_by` (uuid, references profiles)
- `created_at` (timestamptz, default: now())
- `approved_at` (timestamptz)

### exam_questions
- `id` (uuid, primary key)
- `exam_id` (uuid, references exams)
- `question_id` (uuid, references questions)
- `question_order` (integer, not null)
- `created_at` (timestamptz, default: now())

### exam_schedules
- `id` (uuid, primary key)
- `exam_id` (uuid, references exams)
- `start_time` (timestamptz, not null)
- `end_time` (timestamptz, not null)
- `created_by` (uuid, references profiles)
- `created_at` (timestamptz, default: now())

### exam_attempts
- `id` (uuid, primary key)
- `exam_id` (uuid, references exams)
- `student_id` (uuid, references profiles)
- `started_at` (timestamptz, default: now())
- `submitted_at` (timestamptz)
- `score` (integer)
- `total_marks` (integer)
- `status` (attempt_status enum: 'in_progress', 'submitted', 'evaluated')
- `time_taken_minutes` (integer)

### exam_answers
- `id` (uuid, primary key)
- `attempt_id` (uuid, references exam_attempts)
- `question_id` (uuid, references questions)
- `answer` (text)
- `is_correct` (boolean)
- `marks_obtained` (integer)
- `created_at` (timestamptz, default: now())

## 2. Security

- Enable RLS on all tables
- Create helper function `is_admin` to check admin role
- Create helper function `is_principal` to check principal role
- Create helper function `is_teacher` to check teacher role
- Policies:
  - Admins have full access to all tables
  - Principals can view all data, approve exams
  - Teachers can manage their own questions and exams
  - Students can view published exams and their own attempts
  - Users can view their own profile
  - Admins can update any profile including roles
  - Users can update their own profile except role

## 3. Triggers

- Auto-sync new users to profiles table with 'student' role (first user becomes 'admin')
- Auto-calculate exam total marks when questions are added
- Auto-evaluate MCQ and True/False answers

## 4. Notes

- All timestamps use timestamptz for timezone support
- JSONB used for flexible MCQ options storage
- Enum types for type safety
- Comprehensive RLS policies for data security
*/

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'principal', 'teacher', 'student');
CREATE TYPE question_type AS ENUM ('mcq', 'true_false', 'short_answer');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE exam_status AS ENUM ('draft', 'pending_approval', 'approved', 'published', 'completed');
CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'evaluated');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  role user_role DEFAULT 'student'::user_role NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type question_type NOT NULL,
  options jsonb,
  correct_answer text NOT NULL,
  marks integer NOT NULL DEFAULT 1,
  difficulty difficulty_level DEFAULT 'medium'::difficulty_level,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  duration_minutes integer NOT NULL,
  total_marks integer DEFAULT 0,
  pass_marks integer NOT NULL,
  instructions text,
  status exam_status DEFAULT 'draft'::exam_status NOT NULL,
  created_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz
);

-- Create exam_questions table
CREATE TABLE IF NOT EXISTS exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  question_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, question_id)
);

-- Create exam_schedules table
CREATE TABLE IF NOT EXISTS exam_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create exam_attempts table
CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  score integer,
  total_marks integer,
  status attempt_status DEFAULT 'in_progress'::attempt_status NOT NULL,
  time_taken_minutes integer,
  UNIQUE(exam_id, student_id)
);

-- Create exam_answers table
CREATE TABLE IF NOT EXISTS exam_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  answer text,
  is_correct boolean,
  marks_obtained integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

-- Create helper functions
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

CREATE OR REPLACE FUNCTION is_principal(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'principal'::user_role
  );
$$;

CREATE OR REPLACE FUNCTION is_teacher(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'teacher'::user_role
  );
$$;

CREATE OR REPLACE FUNCTION is_student(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'student'::user_role
  );
$$;

-- Profiles policies
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile except role" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) 
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Principals can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (is_principal(auth.uid()));

-- Subjects policies
CREATE POLICY "Admins have full access to subjects" ON subjects
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Teachers can manage subjects" ON subjects
  FOR ALL TO authenticated USING (is_teacher(auth.uid()) OR is_principal(auth.uid()));

CREATE POLICY "Students can view subjects" ON subjects
  FOR SELECT TO authenticated USING (is_student(auth.uid()));

-- Questions policies
CREATE POLICY "Admins have full access to questions" ON questions
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Teachers can manage their own questions" ON questions
  FOR ALL TO authenticated USING (is_teacher(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Teachers can view all questions" ON questions
  FOR SELECT TO authenticated USING (is_teacher(auth.uid()) OR is_principal(auth.uid()));

-- Exams policies
CREATE POLICY "Admins have full access to exams" ON exams
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Teachers can manage their own exams" ON exams
  FOR ALL TO authenticated USING (is_teacher(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Principals can view and approve exams" ON exams
  FOR SELECT TO authenticated USING (is_principal(auth.uid()));

CREATE POLICY "Principals can update exam status" ON exams
  FOR UPDATE TO authenticated USING (is_principal(auth.uid()));

CREATE POLICY "Students can view published exams" ON exams
  FOR SELECT TO authenticated USING (is_student(auth.uid()) AND status = 'published'::exam_status);

-- Exam questions policies
CREATE POLICY "Admins have full access to exam_questions" ON exam_questions
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Teachers can manage exam_questions for their exams" ON exam_questions
  FOR ALL TO authenticated USING (
    is_teacher(auth.uid()) AND 
    EXISTS (SELECT 1 FROM exams WHERE exams.id = exam_questions.exam_id AND exams.created_by = auth.uid())
  );

CREATE POLICY "All authenticated users can view exam_questions" ON exam_questions
  FOR SELECT TO authenticated USING (true);

-- Exam schedules policies
CREATE POLICY "Admins have full access to exam_schedules" ON exam_schedules
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Teachers can manage schedules for their exams" ON exam_schedules
  FOR ALL TO authenticated USING (
    is_teacher(auth.uid()) AND 
    EXISTS (SELECT 1 FROM exams WHERE exams.id = exam_schedules.exam_id AND exams.created_by = auth.uid())
  );

CREATE POLICY "All authenticated users can view exam_schedules" ON exam_schedules
  FOR SELECT TO authenticated USING (true);

-- Exam attempts policies
CREATE POLICY "Admins have full access to exam_attempts" ON exam_attempts
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Students can manage their own attempts" ON exam_attempts
  FOR ALL TO authenticated USING (is_student(auth.uid()) AND student_id = auth.uid());

CREATE POLICY "Teachers can view attempts for their exams" ON exam_attempts
  FOR SELECT TO authenticated USING (
    (is_teacher(auth.uid()) OR is_principal(auth.uid())) AND 
    EXISTS (SELECT 1 FROM exams WHERE exams.id = exam_attempts.exam_id AND exams.created_by = auth.uid())
  );

CREATE POLICY "Principals can view all attempts" ON exam_attempts
  FOR SELECT TO authenticated USING (is_principal(auth.uid()));

-- Exam answers policies
CREATE POLICY "Admins have full access to exam_answers" ON exam_answers
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Students can manage their own answers" ON exam_answers
  FOR ALL TO authenticated USING (
    is_student(auth.uid()) AND 
    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = exam_answers.attempt_id AND exam_attempts.student_id = auth.uid())
  );

CREATE POLICY "Teachers can view answers for their exams" ON exam_answers
  FOR SELECT TO authenticated USING (
    (is_teacher(auth.uid()) OR is_principal(auth.uid())) AND 
    EXISTS (
      SELECT 1 FROM exam_attempts ea
      JOIN exams e ON e.id = ea.exam_id
      WHERE ea.id = exam_answers.attempt_id AND e.created_by = auth.uid()
    )
  );

CREATE POLICY "Principals can view all answers" ON exam_answers
  FOR SELECT TO authenticated USING (is_principal(auth.uid()));

-- Create trigger function for new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  extracted_username text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Extract username from email (remove @miaoda.com)
  extracted_username := REPLACE(NEW.email, '@miaoda.com', '');
  
  INSERT INTO profiles (id, username, role)
  VALUES (
    NEW.id,
    extracted_username,
    CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'student'::user_role END
  );
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Create function to update exam total marks
CREATE OR REPLACE FUNCTION update_exam_total_marks()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE exams
  SET total_marks = (
    SELECT COALESCE(SUM(q.marks), 0)
    FROM exam_questions eq
    JOIN questions q ON q.id = eq.question_id
    WHERE eq.exam_id = NEW.exam_id
  )
  WHERE id = NEW.exam_id;
  RETURN NEW;
END;
$$;

-- Create trigger for updating exam total marks
DROP TRIGGER IF EXISTS update_exam_marks_trigger ON exam_questions;
CREATE TRIGGER update_exam_marks_trigger
  AFTER INSERT OR DELETE ON exam_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_total_marks();

-- Create function to auto-evaluate answers
CREATE OR REPLACE FUNCTION evaluate_answer()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  question_record RECORD;
BEGIN
  -- Get question details
  SELECT q.correct_answer, q.marks, q.question_type
  INTO question_record
  FROM questions q
  WHERE q.id = NEW.question_id;
  
  -- Auto-evaluate MCQ and True/False
  IF question_record.question_type IN ('mcq', 'true_false') THEN
    IF LOWER(TRIM(NEW.answer)) = LOWER(TRIM(question_record.correct_answer)) THEN
      NEW.is_correct := true;
      NEW.marks_obtained := question_record.marks;
    ELSE
      NEW.is_correct := false;
      NEW.marks_obtained := 0;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-evaluation
DROP TRIGGER IF EXISTS evaluate_answer_trigger ON exam_answers;
CREATE TRIGGER evaluate_answer_trigger
  BEFORE INSERT OR UPDATE ON exam_answers
  FOR EACH ROW
  EXECUTE FUNCTION evaluate_answer();

-- Create function to update attempt score
CREATE OR REPLACE FUNCTION update_attempt_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE exam_attempts
  SET score = (
    SELECT COALESCE(SUM(marks_obtained), 0)
    FROM exam_answers
    WHERE attempt_id = NEW.attempt_id
  )
  WHERE id = NEW.attempt_id;
  RETURN NEW;
END;
$$;

-- Create trigger for updating attempt score
DROP TRIGGER IF EXISTS update_attempt_score_trigger ON exam_answers;
CREATE TRIGGER update_attempt_score_trigger
  AFTER INSERT OR UPDATE ON exam_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_attempt_score();