-- Drop the old function
DROP FUNCTION IF EXISTS calculate_user_database_size(UUID);

-- Create corrected function to calculate database size per user
CREATE OR REPLACE FUNCTION calculate_user_database_size(target_user_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_size BIGINT := 0;
  profile_size BIGINT := 0;
  questions_size BIGINT := 0;
  exams_size BIGINT := 0;
  exam_attempts_size BIGINT := 0;
  exam_answers_size BIGINT := 0;
  question_papers_size BIGINT := 0;
  login_history_size BIGINT := 0;
  active_sessions_size BIGINT := 0;
BEGIN
  -- Calculate size from profiles table
  SELECT COALESCE(pg_column_size(p.*), 0) INTO profile_size
  FROM profiles p
  WHERE p.id = target_user_id;
  
  -- Calculate size from questions created by user
  SELECT COALESCE(SUM(pg_column_size(q.*)), 0) INTO questions_size
  FROM questions q
  WHERE q.created_by = target_user_id;
  
  -- Calculate size from exams created by user (teacher_id, not created_by)
  SELECT COALESCE(SUM(pg_column_size(e.*)), 0) INTO exams_size
  FROM exams e
  WHERE e.teacher_id = target_user_id;
  
  -- Calculate size from exam attempts (student)
  SELECT COALESCE(SUM(pg_column_size(ea.*)), 0) INTO exam_attempts_size
  FROM exam_attempts ea
  WHERE ea.student_id = target_user_id;
  
  -- Calculate size from exam answers (via attempts)
  SELECT COALESCE(SUM(pg_column_size(eans.*)), 0) INTO exam_answers_size
  FROM exam_answers eans
  JOIN exam_attempts ea ON eans.attempt_id = ea.id
  WHERE ea.student_id = target_user_id;
  
  -- Calculate size from question papers created by user
  SELECT COALESCE(SUM(pg_column_size(qp.*)), 0) INTO question_papers_size
  FROM question_papers qp
  WHERE qp.created_by = target_user_id;
  
  -- Calculate size from login history
  SELECT COALESCE(SUM(pg_column_size(lh.*)), 0) INTO login_history_size
  FROM login_history lh
  WHERE lh.user_id = target_user_id;
  
  -- Calculate size from active sessions
  SELECT COALESCE(SUM(pg_column_size(ases.*)), 0) INTO active_sessions_size
  FROM active_sessions ases
  WHERE ases.user_id = target_user_id;
  
  total_size := profile_size + questions_size + exams_size + exam_attempts_size + 
                exam_answers_size + question_papers_size + login_history_size + 
                active_sessions_size;
  
  RETURN total_size;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_user_database_size(UUID) TO authenticated;