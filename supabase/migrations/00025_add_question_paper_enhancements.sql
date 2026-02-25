/*
# Question Paper Enhancements

## Plain English Explanation
This migration adds advanced features to the question paper system:
1. Templates for reusable configurations
2. Multiple versions (A, B, C, D) with shuffled options
3. Difficulty distribution tracking
4. Lesson coverage tracking
5. Version history

## 1. New Tables

### A. question_paper_templates
Stores reusable question paper configurations.

**Columns**:
- `id` (uuid, primary key)
- `school_id` (uuid, foreign key → schools.id)
- `name` (text, required) - Template name (e.g., "Mid-term Format")
- `description` (text, nullable) - Template description
- `class_id` (uuid, foreign key → classes.id)
- `subject_id` (uuid, foreign key → subjects.id)
- `difficulty_distribution` (jsonb) - {easy: 40, medium: 40, hard: 20}
- `total_marks` (integer) - Target total marks
- `shuffle_questions` (boolean, default false)
- `shuffle_mcq_options` (boolean, default false)
- `created_by` (uuid, foreign key → auth.users.id)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### B. question_paper_versions
Stores multiple versions (A, B, C, D) of the same question paper.

**Columns**:
- `id` (uuid, primary key)
- `question_paper_id` (uuid, foreign key → question_papers.id)
- `version_label` (text, required) - 'A', 'B', 'C', 'D'
- `shuffled_question_order` (jsonb) - Array of question IDs in shuffled order
- `answer_key` (jsonb) - Correct answers for this version
- `created_at` (timestamptz, default now())

### C. Enhanced question_papers table
Add new columns to existing table:
- `template_id` (uuid, nullable, foreign key → question_paper_templates.id)
- `difficulty_distribution` (jsonb) - Actual difficulty distribution
- `lesson_coverage` (jsonb) - Array of lesson IDs covered
- `has_versions` (boolean, default false) - Whether multiple versions exist

## 2. Security
- Enable RLS on new tables
- Teachers can only access their own templates
- Teachers can only access versions of their own papers
- No cross-teacher data visibility

## 3. Indexes
- Index on templates by teacher and subject
- Index on versions by question_paper_id
- Index on question_papers by template_id

## 4. Notes
- Templates are reusable across multiple papers
- Versions maintain answer key consistency
- Difficulty distribution is calculated automatically
- Lesson coverage helps ensure balanced topic distribution
*/

-- Create question_paper_templates table
CREATE TABLE IF NOT EXISTS question_paper_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  difficulty_distribution jsonb DEFAULT '{"easy": 40, "medium": 40, "hard": 20}'::jsonb,
  total_marks integer NOT NULL DEFAULT 100,
  shuffle_questions boolean NOT NULL DEFAULT false,
  shuffle_mcq_options boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create question_paper_versions table
CREATE TABLE IF NOT EXISTS question_paper_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_paper_id uuid NOT NULL REFERENCES question_papers(id) ON DELETE CASCADE,
  version_label text NOT NULL CHECK (version_label IN ('A', 'B', 'C', 'D')),
  shuffled_question_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer_key jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(question_paper_id, version_label)
);

-- Add new columns to question_papers table
ALTER TABLE question_papers 
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES question_paper_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS difficulty_distribution jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS lesson_coverage jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS has_versions boolean NOT NULL DEFAULT false;

-- Create indexes
CREATE INDEX idx_question_paper_templates_created_by ON question_paper_templates(created_by);
CREATE INDEX idx_question_paper_templates_subject ON question_paper_templates(subject_id);
CREATE INDEX idx_question_paper_templates_class ON question_paper_templates(class_id);
CREATE INDEX idx_question_paper_versions_paper_id ON question_paper_versions(question_paper_id);
CREATE INDEX idx_question_papers_template_id ON question_papers(template_id);

-- Enable Row Level Security
ALTER TABLE question_paper_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_paper_versions ENABLE ROW LEVEL SECURITY;

-- Policies for question_paper_templates
CREATE POLICY "Teachers can view own templates" ON question_paper_templates
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Teachers can create templates" ON question_paper_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Teachers can update own templates" ON question_paper_templates
  FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Teachers can delete own templates" ON question_paper_templates
  FOR DELETE USING (auth.uid() = created_by);

-- Policies for question_paper_versions
CREATE POLICY "Teachers can view versions of own papers" ON question_paper_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM question_papers qp
      WHERE qp.id = question_paper_versions.question_paper_id
      AND qp.created_by = auth.uid()
    )
  );

CREATE POLICY "Teachers can create versions for own papers" ON question_paper_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM question_papers qp
      WHERE qp.id = question_paper_versions.question_paper_id
      AND qp.created_by = auth.uid()
    )
  );

CREATE POLICY "Teachers can update versions of own papers" ON question_paper_versions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM question_papers qp
      WHERE qp.id = question_paper_versions.question_paper_id
      AND qp.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM question_papers qp
      WHERE qp.id = question_paper_versions.question_paper_id
      AND qp.created_by = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete versions of own papers" ON question_paper_versions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM question_papers qp
      WHERE qp.id = question_paper_versions.question_paper_id
      AND qp.created_by = auth.uid()
    )
  );

-- Function to update template updated_at timestamp
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on templates
CREATE TRIGGER update_question_paper_templates_updated_at
  BEFORE UPDATE ON question_paper_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_template_updated_at();

-- Function to calculate difficulty distribution
CREATE OR REPLACE FUNCTION calculate_difficulty_distribution(paper_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'easy', COUNT(*) FILTER (WHERE q.difficulty = 'easy'),
    'medium', COUNT(*) FILTER (WHERE q.difficulty = 'medium'),
    'hard', COUNT(*) FILTER (WHERE q.difficulty = 'hard')
  )
  INTO result
  FROM question_paper_questions qpq
  JOIN questions q ON q.id = qpq.question_id
  WHERE qpq.question_paper_id = paper_id;
  
  RETURN COALESCE(result, '{"easy": 0, "medium": 0, "hard": 0}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate lesson coverage
CREATE OR REPLACE FUNCTION calculate_lesson_coverage(paper_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(DISTINCT q.lesson_id)
  INTO result
  FROM question_paper_questions qpq
  JOIN questions q ON q.id = qpq.question_id
  WHERE qpq.question_paper_id = paper_id
  AND q.lesson_id IS NOT NULL;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update difficulty distribution and lesson coverage
CREATE OR REPLACE FUNCTION update_paper_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE question_papers
  SET 
    difficulty_distribution = calculate_difficulty_distribution(COALESCE(NEW.question_paper_id, OLD.question_paper_id)),
    lesson_coverage = calculate_lesson_coverage(COALESCE(NEW.question_paper_id, OLD.question_paper_id))
  WHERE id = COALESCE(NEW.question_paper_id, OLD.question_paper_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update paper metadata when questions change
CREATE TRIGGER update_paper_metadata_on_insert
  AFTER INSERT ON question_paper_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_paper_metadata();

CREATE TRIGGER update_paper_metadata_on_delete
  AFTER DELETE ON question_paper_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_paper_metadata();

-- Add comments for documentation
COMMENT ON TABLE question_paper_templates IS 'Stores reusable question paper configurations';
COMMENT ON TABLE question_paper_versions IS 'Stores multiple versions (A, B, C, D) of question papers';
COMMENT ON COLUMN question_paper_templates.difficulty_distribution IS 'Target difficulty distribution as percentages';
COMMENT ON COLUMN question_papers.difficulty_distribution IS 'Actual difficulty distribution of selected questions';
COMMENT ON COLUMN question_papers.lesson_coverage IS 'Array of lesson IDs covered in this paper';
COMMENT ON COLUMN question_papers.has_versions IS 'Whether this paper has multiple versions (A, B, C, D)';
