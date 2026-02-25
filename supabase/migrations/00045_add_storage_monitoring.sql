-- Create storage_usage table to track file and database usage per user
CREATE TABLE IF NOT EXISTS storage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_storage_bytes BIGINT DEFAULT 0,
  database_storage_bytes BIGINT DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_storage_usage_user_id ON storage_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_usage_last_calculated ON storage_usage(last_calculated_at);

-- Function to calculate database size per user
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
  answers_size BIGINT := 0;
  results_size BIGINT := 0;
BEGIN
  -- Calculate size from profiles table
  SELECT COALESCE(pg_column_size(p.*), 0) INTO profile_size
  FROM profiles p
  WHERE p.id = target_user_id;
  
  -- Calculate size from questions created by user
  SELECT COALESCE(SUM(pg_column_size(q.*)), 0) INTO questions_size
  FROM questions q
  WHERE q.created_by = target_user_id;
  
  -- Calculate size from exams created by user
  SELECT COALESCE(SUM(pg_column_size(e.*)), 0) INTO exams_size
  FROM exams e
  WHERE e.created_by = target_user_id;
  
  -- Calculate size from student answers
  SELECT COALESCE(SUM(pg_column_size(sa.*)), 0) INTO answers_size
  FROM student_answers sa
  WHERE sa.student_id = target_user_id;
  
  -- Calculate size from exam results
  SELECT COALESCE(SUM(pg_column_size(er.*)), 0) INTO results_size
  FROM exam_results er
  WHERE er.student_id = target_user_id;
  
  total_size := profile_size + questions_size + exams_size + answers_size + results_size;
  
  RETURN total_size;
END;
$$;

-- Function to get all users storage usage
CREATE OR REPLACE FUNCTION get_all_users_storage()
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  email TEXT,
  role TEXT,
  file_storage_bytes BIGINT,
  database_storage_bytes BIGINT,
  total_storage_bytes BIGINT,
  last_calculated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only admins can access this function
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.username,
    p.email,
    p.role::TEXT,
    COALESCE(su.file_storage_bytes, 0) as file_storage_bytes,
    COALESCE(su.database_storage_bytes, 0) as database_storage_bytes,
    COALESCE(su.file_storage_bytes, 0) + COALESCE(su.database_storage_bytes, 0) as total_storage_bytes,
    su.last_calculated_at
  FROM profiles p
  LEFT JOIN storage_usage su ON p.id = su.user_id
  ORDER BY total_storage_bytes DESC;
END;
$$;

-- Function to update storage usage for a user
CREATE OR REPLACE FUNCTION update_user_storage_usage(target_user_id UUID, file_bytes BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  db_bytes BIGINT;
BEGIN
  -- Calculate database size
  db_bytes := calculate_user_database_size(target_user_id);
  
  -- Insert or update storage usage
  INSERT INTO storage_usage (user_id, file_storage_bytes, database_storage_bytes, last_calculated_at, updated_at)
  VALUES (target_user_id, file_bytes, db_bytes, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    file_storage_bytes = EXCLUDED.file_storage_bytes,
    database_storage_bytes = EXCLUDED.database_storage_bytes,
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$;

-- Function to recalculate all users storage (for manual refresh)
CREATE OR REPLACE FUNCTION recalculate_all_storage()
RETURNS TABLE (
  user_id UUID,
  file_storage_bytes BIGINT,
  database_storage_bytes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only admins can access this function
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update database storage for all users
  INSERT INTO storage_usage (user_id, database_storage_bytes, last_calculated_at, updated_at)
  SELECT 
    p.id,
    calculate_user_database_size(p.id),
    NOW(),
    NOW()
  FROM profiles p
  ON CONFLICT (user_id)
  DO UPDATE SET
    database_storage_bytes = EXCLUDED.database_storage_bytes,
    last_calculated_at = NOW(),
    updated_at = NOW();

  RETURN QUERY
  SELECT su.user_id, su.file_storage_bytes, su.database_storage_bytes
  FROM storage_usage su;
END;
$$;

-- Enable RLS on storage_usage table
ALTER TABLE storage_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view storage usage
CREATE POLICY "Admins can view all storage usage" ON storage_usage
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

-- Policy: Only admins can insert/update storage usage
CREATE POLICY "Admins can manage storage usage" ON storage_usage
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION calculate_user_database_size(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_storage() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_storage_usage(UUID, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_storage() TO authenticated;