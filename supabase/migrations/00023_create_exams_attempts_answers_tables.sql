/*
# Create Exams, Attempts, and Answers Tables

## 1. New Tables

### exams
- `id` (uuid, primary key)
- `question_paper_id` (uuid, references question_papers)
- `title` (text, not null)
- `class_id` (uuid, references classes)
- `subject_id` (uuid, references subjects)
- `teacher_id` (uuid, references profiles)
- `start_time` (timestamptz, not null)
- `end_time` (timestamptz, not null)
- `duration_minutes` (integer, not null)
- `total_marks` (integer, not null)
- `passing_marks` (integer, not null)
- `instructions` (text)
- `status` (exam_status: draft, pending_approval, approved, published, completed)
- `approved_by` (uuid, references profiles)
- `approved_at` (timestamptz)
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

### exam_attempts
- `id` (uuid, primary key)
- `exam_id` (uuid, references exams)
- `student_id` (uuid, references profiles)
- `started_at` (timestamptz)
- `submitted_at` (timestamptz)
- `status` (attempt_status: not_started, in_progress, submitted, evaluated)
- `total_marks_obtained` (numeric)
- `percentage` (numeric)
- `result` (text: pass, fail)
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

### exam_answers
- `id` (uuid, primary key)
- `attempt_id` (uuid, references exam_attempts)
- `question_id` (uuid, references questions)
- `student_answer` (jsonb)
- `is_correct` (boolean)
- `marks_obtained` (numeric)
- `marks_allocated` (numeric)
- `evaluated_by` (uuid, references profiles)
- `evaluated_at` (timestamptz)
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

## 2. Security
- RLS enabled on all tables
- Students: view own attempts/answers
- Teachers: view/manage their exams and attempts
- Principals: view all, approve exams

## 3. Triggers
- Auto-update timestamps
- Auto-evaluate MCQ and True/False answers
- Auto-calculate total marks
*/

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_paper_id uuid REFERENCES question_papers(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  total_marks integer NOT NULL,
  passing_marks integer NOT NULL,
  instructions text,
  status exam_status DEFAULT 'draft'::exam_status NOT NULL,
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exam_attempts table
CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz,
  submitted_at timestamptz,
  status attempt_status DEFAULT 'not_started'::attempt_status NOT NULL,
  total_marks_obtained numeric DEFAULT 0,
  percentage numeric DEFAULT 0,
  result text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

-- Create exam_answers table
CREATE TABLE IF NOT EXISTS exam_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES exam_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  student_answer jsonb,
  is_correct boolean,
  marks_obtained numeric DEFAULT 0,
  marks_allocated numeric NOT NULL,
  evaluated_by uuid REFERENCES profiles(id),
  evaluated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- Enable RLS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

-- Policies for exams table
CREATE POLICY "Teachers can view their own exams" ON exams
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Principals can view all exams" ON exams
  FOR SELECT USING (is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal'::user_role
  ));

CREATE POLICY "Students can view published exams for their class" ON exams
  FOR SELECT USING (
    status = 'published'::exam_status AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'student'::user_role 
      AND class_id = exams.class_id
    )
  );

CREATE POLICY "Teachers can create exams" ON exams
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own exams" ON exams
  FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own exams" ON exams
  FOR DELETE USING (teacher_id = auth.uid());

-- Policies for exam_attempts table
CREATE POLICY "Students can view their own attempts" ON exam_attempts
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view attempts for their exams" ON exam_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exams WHERE id = exam_attempts.exam_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Principals can view all attempts" ON exam_attempts
  FOR SELECT USING (is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal'::user_role
  ));

CREATE POLICY "Students can create their own attempts" ON exam_attempts
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own attempts" ON exam_attempts
  FOR UPDATE USING (student_id = auth.uid());

-- Policies for exam_answers table
CREATE POLICY "Students can view their own answers after submission" ON exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_attempts 
      WHERE id = exam_answers.attempt_id 
      AND student_id = auth.uid()
      AND status IN ('submitted'::attempt_status, 'evaluated'::attempt_status)
    )
  );

CREATE POLICY "Teachers can view answers for their exams" ON exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_attempts ea
      JOIN exams e ON e.id = ea.exam_id
      WHERE ea.id = exam_answers.attempt_id AND e.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Principals can view all answers" ON exam_answers
  FOR SELECT USING (is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal'::user_role
  ));

CREATE POLICY "Students can insert their own answers" ON exam_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_attempts 
      WHERE id = exam_answers.attempt_id 
      AND student_id = auth.uid()
      AND status = 'in_progress'::attempt_status
    )
  );

CREATE POLICY "Students can update their own answers during exam" ON exam_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM exam_attempts 
      WHERE id = exam_answers.attempt_id 
      AND student_id = auth.uid()
      AND status = 'in_progress'::attempt_status
    )
  );

CREATE POLICY "Teachers can update answers for grading" ON exam_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM exam_attempts ea
      JOIN exams e ON e.id = ea.exam_id
      WHERE ea.id = exam_answers.attempt_id AND e.teacher_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_attempts_updated_at
  BEFORE UPDATE ON exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_answers_updated_at
  BEFORE UPDATE ON exam_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-evaluate MCQ and True/False answers
CREATE OR REPLACE FUNCTION auto_evaluate_answer()
RETURNS TRIGGER AS $$
DECLARE
  question_record RECORD;
  correct_answer jsonb;
  student_ans jsonb;
BEGIN
  -- Get question details
  SELECT question_type, correct_answer, marks 
  INTO question_record
  FROM questions 
  WHERE id = NEW.question_id;

  -- Only auto-evaluate MCQ and True/False
  IF question_record.question_type IN ('mcq', 'true_false') THEN
    correct_answer := to_jsonb(question_record.correct_answer);
    student_ans := NEW.student_answer;

    -- Compare answers
    IF correct_answer = student_ans THEN
      NEW.is_correct := true;
      NEW.marks_obtained := NEW.marks_allocated;
    ELSE
      NEW.is_correct := false;
      NEW.marks_obtained := 0;
    END IF;
    
    NEW.evaluated_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_evaluate_answer_trigger
  BEFORE INSERT OR UPDATE ON exam_answers
  FOR EACH ROW
  EXECUTE FUNCTION auto_evaluate_answer();

-- Function to calculate total marks for attempt
CREATE OR REPLACE FUNCTION calculate_attempt_marks()
RETURNS TRIGGER AS $$
DECLARE
  total_obtained numeric;
  total_possible numeric;
  calc_percentage numeric;
  exam_passing_marks integer;
  exam_total_marks integer;
BEGIN
  -- Get exam details
  SELECT passing_marks, total_marks INTO exam_passing_marks, exam_total_marks
  FROM exams e
  JOIN exam_attempts ea ON ea.exam_id = e.id
  WHERE ea.id = NEW.attempt_id;

  -- Calculate total marks obtained
  SELECT COALESCE(SUM(marks_obtained), 0), COALESCE(SUM(marks_allocated), 0)
  INTO total_obtained, total_possible
  FROM exam_answers
  WHERE attempt_id = NEW.attempt_id;

  -- Update attempt
  IF total_possible > 0 THEN
    calc_percentage := (total_obtained / total_possible) * 100;
  ELSE
    calc_percentage := 0;
  END IF;

  UPDATE exam_attempts
  SET 
    total_marks_obtained = total_obtained,
    percentage = calc_percentage,
    result = CASE 
      WHEN total_obtained >= exam_passing_marks THEN 'pass'
      ELSE 'fail'
    END
  WHERE id = NEW.attempt_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_marks_trigger
  AFTER INSERT OR UPDATE ON exam_answers
  FOR EACH ROW
  EXECUTE FUNCTION calculate_attempt_marks();

-- Create indexes for performance
CREATE INDEX idx_exams_teacher_id ON exams(teacher_id);
CREATE INDEX idx_exams_class_id ON exams(class_id);
CREATE INDEX idx_exams_subject_id ON exams(subject_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_start_time ON exams(start_time);
CREATE INDEX idx_exam_attempts_exam_id ON exam_attempts(exam_id);
CREATE INDEX idx_exam_attempts_student_id ON exam_attempts(student_id);
CREATE INDEX idx_exam_attempts_status ON exam_attempts(status);
CREATE INDEX idx_exam_answers_attempt_id ON exam_answers(attempt_id);
CREATE INDEX idx_exam_answers_question_id ON exam_answers(question_id);
