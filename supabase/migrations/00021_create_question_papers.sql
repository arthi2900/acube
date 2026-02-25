/*
# Create Question Papers Table

## Plain English Explanation
This migration creates the infrastructure for question paper preparation and management.
Teachers can create question papers by selecting questions from their question bank,
shuffle questions and MCQ options, save drafts, and generate final papers.

## 1. New Tables

### A. question_papers
Stores question paper metadata and configuration.

**Columns**:
- `id` (uuid, primary key)
- `school_id` (uuid, foreign key → schools.id)
- `class_id` (uuid, foreign key → classes.id)
- `subject_id` (uuid, foreign key → subjects.id)
- `title` (text, required) - Paper title
- `status` (enum: draft, final) - Paper status
- `shuffle_questions` (boolean, default false) - Whether to shuffle question order
- `shuffle_mcq_options` (boolean, default false) - Whether to shuffle MCQ options
- `total_marks` (integer) - Auto-calculated total marks
- `created_by` (uuid, foreign key → auth.users.id)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### B. question_paper_questions
Junction table linking question papers to selected questions.

**Columns**:
- `id` (uuid, primary key)
- `question_paper_id` (uuid, foreign key → question_papers.id)
- `question_id` (uuid, foreign key → questions.id)
- `display_order` (integer) - Order of question in paper
- `shuffled_options` (jsonb, nullable) - Shuffled MCQ options if shuffle is enabled
- `created_at` (timestamptz, default now())

## 2. Security

### Row Level Security (RLS)
- **question_papers table**: Teachers can only access their own question papers
- **question_paper_questions table**: Access controlled through question_papers relationship

### Policies
- Teachers can create, read, update, and delete their own question papers
- Teachers can only add questions they created to question papers
- No cross-teacher data visibility

## 3. Indexes
- Index on `question_papers.created_by` for fast teacher-specific queries
- Index on `question_papers.status` for filtering drafts/finals
- Index on `question_paper_questions.question_paper_id` for fast joins

## 4. Triggers
- Auto-update `updated_at` timestamp on question_papers
- Auto-calculate `total_marks` when questions are added/removed

## 5. Notes
- Shuffle functionality is applied at generation time, not storage time
- Shuffled options are stored to maintain consistency across views
- Draft papers can be edited, final papers are read-only
*/

-- Create enum for question paper status
CREATE TYPE question_paper_status AS ENUM ('draft', 'final');

-- Create question_papers table
CREATE TABLE IF NOT EXISTS question_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  status question_paper_status NOT NULL DEFAULT 'draft',
  shuffle_questions boolean NOT NULL DEFAULT false,
  shuffle_mcq_options boolean NOT NULL DEFAULT false,
  total_marks integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create question_paper_questions junction table
CREATE TABLE IF NOT EXISTS question_paper_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_paper_id uuid NOT NULL REFERENCES question_papers(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  display_order integer NOT NULL,
  shuffled_options jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(question_paper_id, question_id)
);

-- Create indexes for performance
CREATE INDEX idx_question_papers_created_by ON question_papers(created_by);
CREATE INDEX idx_question_papers_status ON question_papers(status);
CREATE INDEX idx_question_papers_school_id ON question_papers(school_id);
CREATE INDEX idx_question_papers_class_subject ON question_papers(class_id, subject_id);
CREATE INDEX idx_question_paper_questions_paper_id ON question_paper_questions(question_paper_id);
CREATE INDEX idx_question_paper_questions_question_id ON question_paper_questions(question_id);

-- Enable Row Level Security
ALTER TABLE question_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_paper_questions ENABLE ROW LEVEL SECURITY;

-- Policies for question_papers table
-- Teachers can view their own question papers
CREATE POLICY "Teachers can view own question papers" ON question_papers
  FOR SELECT USING (auth.uid() = created_by);

-- Teachers can create question papers
CREATE POLICY "Teachers can create question papers" ON question_papers
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Teachers can update their own draft question papers
CREATE POLICY "Teachers can update own draft papers" ON question_papers
  FOR UPDATE USING (auth.uid() = created_by AND status = 'draft');

-- Teachers can delete their own question papers
CREATE POLICY "Teachers can delete own question papers" ON question_papers
  FOR DELETE USING (auth.uid() = created_by);

-- Policies for question_paper_questions table
-- Teachers can view questions in their own papers
CREATE POLICY "Teachers can view own paper questions" ON question_paper_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM question_papers qp
      WHERE qp.id = question_paper_questions.question_paper_id
      AND qp.created_by = auth.uid()
    )
  );

-- Teachers can add questions to their own papers
CREATE POLICY "Teachers can add questions to own papers" ON question_paper_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM question_papers qp
      WHERE qp.id = question_paper_questions.question_paper_id
      AND qp.created_by = auth.uid()
    )
  );

-- Teachers can update questions in their own draft papers
CREATE POLICY "Teachers can update questions in own draft papers" ON question_paper_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM question_papers qp
      WHERE qp.id = question_paper_questions.question_paper_id
      AND qp.created_by = auth.uid()
      AND qp.status = 'draft'
    )
  );

-- Teachers can delete questions from their own papers
CREATE POLICY "Teachers can delete questions from own papers" ON question_paper_questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM question_papers qp
      WHERE qp.id = question_paper_questions.question_paper_id
      AND qp.created_by = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_question_paper_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_question_papers_updated_at
  BEFORE UPDATE ON question_papers
  FOR EACH ROW
  EXECUTE FUNCTION update_question_paper_updated_at();

-- Function to calculate total marks
CREATE OR REPLACE FUNCTION calculate_question_paper_total_marks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE question_papers
  SET total_marks = (
    SELECT COALESCE(SUM(q.marks), 0)
    FROM question_paper_questions qpq
    JOIN questions q ON q.id = qpq.question_id
    WHERE qpq.question_paper_id = COALESCE(NEW.question_paper_id, OLD.question_paper_id)
  )
  WHERE id = COALESCE(NEW.question_paper_id, OLD.question_paper_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate total marks when questions are added/removed
CREATE TRIGGER calculate_total_marks_on_insert
  AFTER INSERT ON question_paper_questions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_question_paper_total_marks();

CREATE TRIGGER calculate_total_marks_on_delete
  AFTER DELETE ON question_paper_questions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_question_paper_total_marks();

-- Add comments for documentation
COMMENT ON TABLE question_papers IS 'Stores question paper metadata and configuration';
COMMENT ON TABLE question_paper_questions IS 'Junction table linking question papers to selected questions';
COMMENT ON COLUMN question_papers.shuffle_questions IS 'Whether to randomize question order in the paper';
COMMENT ON COLUMN question_papers.shuffle_mcq_options IS 'Whether to randomize MCQ options within questions';
COMMENT ON COLUMN question_paper_questions.shuffled_options IS 'Stores shuffled MCQ options to maintain consistency';
