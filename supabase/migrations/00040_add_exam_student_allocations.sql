-- Create exam_student_allocations table for student-specific exam assignments
CREATE TABLE IF NOT EXISTS exam_student_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_exam_student_allocations_exam_id ON exam_student_allocations(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_student_allocations_student_id ON exam_student_allocations(student_id);

-- Add RLS policies
ALTER TABLE exam_student_allocations ENABLE ROW LEVEL SECURITY;

-- Teachers can insert allocations for their exams
CREATE POLICY "Teachers can create student allocations for their exams"
  ON exam_student_allocations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_student_allocations.exam_id
      AND exams.teacher_id = auth.uid()
    )
  );

-- Teachers can view allocations for their exams
CREATE POLICY "Teachers can view student allocations for their exams"
  ON exam_student_allocations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_student_allocations.exam_id
      AND exams.teacher_id = auth.uid()
    )
  );

-- Students can view their own allocations
CREATE POLICY "Students can view their own allocations"
  ON exam_student_allocations
  FOR SELECT
  USING (student_id = auth.uid());

-- Admins and principals can view all allocations
CREATE POLICY "Admins and principals can view all allocations"
  ON exam_student_allocations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

-- Teachers can delete allocations for their exams
CREATE POLICY "Teachers can delete student allocations for their exams"
  ON exam_student_allocations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_student_allocations.exam_id
      AND exams.teacher_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_exam_student_allocations_updated_at
  BEFORE UPDATE ON exam_student_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
