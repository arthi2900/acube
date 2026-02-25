-- Migration: Comprehensive Admin RLS Bypass
-- This migration ensures that admin users bypass ALL RLS policies on ALL tables
-- Admins will have full access (SELECT, INSERT, UPDATE, DELETE) without restrictions

-- Drop existing redundant admin policies and create comprehensive ones

-- 1. ACTIVE_SESSIONS
DROP POLICY IF EXISTS "Admin can view all active sessions" ON active_sessions;
CREATE POLICY "Admins bypass RLS for active_sessions"
  ON active_sessions
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 2. ERROR_LOGS
DROP POLICY IF EXISTS "Admins can view all error logs" ON error_logs;
DROP POLICY IF EXISTS "Admins can update error logs" ON error_logs;
CREATE POLICY "Admins bypass RLS for error_logs"
  ON error_logs
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 3. EXAM_ANSWERS (already has good policy, but let's ensure it's comprehensive)
DROP POLICY IF EXISTS "Admins have full access to exam_answers" ON exam_answers;
CREATE POLICY "Admins bypass RLS for exam_answers"
  ON exam_answers
  FOR ALL
  TO public
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 4. EXAM_ATTEMPTS (add comprehensive admin policy)
CREATE POLICY "Admins bypass RLS for exam_attempts"
  ON exam_attempts
  FOR ALL
  TO public
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 5. EXAM_STUDENT_ALLOCATIONS (add comprehensive admin policy)
CREATE POLICY "Admins bypass RLS for exam_student_allocations"
  ON exam_student_allocations
  FOR ALL
  TO public
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 6. EXAMS (already has good policy, ensure it's comprehensive)
DROP POLICY IF EXISTS "Admins can manage all exams" ON exams;
CREATE POLICY "Admins bypass RLS for exams"
  ON exams
  FOR ALL
  TO public
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 7. GLOBAL_QUESTIONS (already has good policy, ensure it's comprehensive)
DROP POLICY IF EXISTS "Admins have full access to global questions" ON global_questions;
CREATE POLICY "Admins bypass RLS for global_questions"
  ON global_questions
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 8. LESSONS (add pure admin bypass)
CREATE POLICY "Admins bypass RLS for lessons"
  ON lessons
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 9. LOGIN_HISTORY
DROP POLICY IF EXISTS "Admin can view all login history" ON login_history;
CREATE POLICY "Admins bypass RLS for login_history"
  ON login_history
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 10. PROFILES (already has good policy, ensure it's comprehensive)
DROP POLICY IF EXISTS "Admins have full access" ON profiles;
CREATE POLICY "Admins bypass RLS for profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 11. QUESTION_PAPER_QUESTIONS
DROP POLICY IF EXISTS "Admins can view all paper questions" ON question_paper_questions;
DROP POLICY IF EXISTS "Admins can manage all paper questions" ON question_paper_questions;
CREATE POLICY "Admins bypass RLS for question_paper_questions"
  ON question_paper_questions
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 12. QUESTION_PAPER_TEMPLATES (add admin policy)
CREATE POLICY "Admins bypass RLS for question_paper_templates"
  ON question_paper_templates
  FOR ALL
  TO public
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 13. QUESTION_PAPER_VERSIONS (add admin policy)
CREATE POLICY "Admins bypass RLS for question_paper_versions"
  ON question_paper_versions
  FOR ALL
  TO public
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 14. QUESTION_PAPERS
DROP POLICY IF EXISTS "Admins can view all question papers" ON question_papers;
DROP POLICY IF EXISTS "Admins can manage all question papers" ON question_papers;
CREATE POLICY "Admins bypass RLS for question_papers"
  ON question_papers
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 15. QUESTIONS (already has good policy, ensure it's comprehensive)
DROP POLICY IF EXISTS "Admins have full access to questions" ON questions;
CREATE POLICY "Admins bypass RLS for questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 16. SCHOOLS (already has admin policies, consolidate)
DROP POLICY IF EXISTS "Only admins can create schools" ON schools;
DROP POLICY IF EXISTS "Only admins can update schools" ON schools;
DROP POLICY IF EXISTS "Only admins can delete schools" ON schools;
CREATE POLICY "Admins bypass RLS for schools"
  ON schools
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 17. STORAGE_HISTORY
DROP POLICY IF EXISTS "Admins can view storage history" ON storage_history;
CREATE POLICY "Admins bypass RLS for storage_history"
  ON storage_history
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 18. STORAGE_USAGE
DROP POLICY IF EXISTS "Admins can view all storage usage" ON storage_usage;
DROP POLICY IF EXISTS "Admins can manage storage usage" ON storage_usage;
CREATE POLICY "Admins bypass RLS for storage_usage"
  ON storage_usage
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 19. SUBJECTS (already has good policy, ensure it's comprehensive)
DROP POLICY IF EXISTS "Admins have full access to subjects" ON subjects;
CREATE POLICY "Admins bypass RLS for subjects"
  ON subjects
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 20. SYSTEM_CAPACITY
DROP POLICY IF EXISTS "Admins can view system capacity" ON system_capacity;
DROP POLICY IF EXISTS "Admins can update system capacity" ON system_capacity;
CREATE POLICY "Admins bypass RLS for system_capacity"
  ON system_capacity
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Verification: List all admin bypass policies
COMMENT ON POLICY "Admins bypass RLS for active_sessions" ON active_sessions IS 
  'Admins have full access to all active_sessions records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for error_logs" ON error_logs IS 
  'Admins have full access to all error_logs records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for exam_answers" ON exam_answers IS 
  'Admins have full access to all exam_answers records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for exam_attempts" ON exam_attempts IS 
  'Admins have full access to all exam_attempts records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for exam_student_allocations" ON exam_student_allocations IS 
  'Admins have full access to all exam_student_allocations records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for exams" ON exams IS 
  'Admins have full access to all exams records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for global_questions" ON global_questions IS 
  'Admins have full access to all global_questions records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for lessons" ON lessons IS 
  'Admins have full access to all lessons records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for login_history" ON login_history IS 
  'Admins have full access to all login_history records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for profiles" ON profiles IS 
  'Admins have full access to all profiles records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for question_paper_questions" ON question_paper_questions IS 
  'Admins have full access to all question_paper_questions records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for question_paper_templates" ON question_paper_templates IS 
  'Admins have full access to all question_paper_templates records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for question_paper_versions" ON question_paper_versions IS 
  'Admins have full access to all question_paper_versions records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for question_papers" ON question_papers IS 
  'Admins have full access to all question_papers records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for questions" ON questions IS 
  'Admins have full access to all questions records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for schools" ON schools IS 
  'Admins have full access to all schools records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for storage_history" ON storage_history IS 
  'Admins have full access to all storage_history records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for storage_usage" ON storage_usage IS 
  'Admins have full access to all storage_usage records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for subjects" ON subjects IS 
  'Admins have full access to all subjects records without RLS restrictions';
COMMENT ON POLICY "Admins bypass RLS for system_capacity" ON system_capacity IS 
  'Admins have full access to all system_capacity records without RLS restrictions';