-- Create storage history table for tracking usage over time
CREATE TABLE IF NOT EXISTS storage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_users INTEGER NOT NULL,
  total_file_storage_bytes BIGINT NOT NULL DEFAULT 0,
  total_database_storage_bytes BIGINT NOT NULL DEFAULT 0,
  total_storage_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient time-based queries
CREATE INDEX IF NOT EXISTS idx_storage_history_snapshot_time ON storage_history(snapshot_time DESC);

-- Create system capacity configuration table
CREATE TABLE IF NOT EXISTS system_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_storage_bytes BIGINT NOT NULL DEFAULT 107374182400, -- 100 GB default
  warning_threshold_percent INTEGER NOT NULL DEFAULT 80,
  critical_threshold_percent INTEGER NOT NULL DEFAULT 90,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Insert default capacity settings
INSERT INTO system_capacity (max_storage_bytes, warning_threshold_percent, critical_threshold_percent)
VALUES (107374182400, 80, 90)
ON CONFLICT (id) DO NOTHING;

-- Function to automatically update user storage when content changes
CREATE OR REPLACE FUNCTION auto_update_user_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  new_db_size BIGINT;
BEGIN
  -- Determine which user_id to update based on the table
  IF TG_TABLE_NAME = 'questions' THEN
    target_user_id := COALESCE(NEW.created_by, OLD.created_by);
  ELSIF TG_TABLE_NAME = 'exams' THEN
    target_user_id := COALESCE(NEW.teacher_id, OLD.teacher_id);
  ELSIF TG_TABLE_NAME = 'exam_attempts' THEN
    target_user_id := COALESCE(NEW.student_id, OLD.student_id);
  ELSIF TG_TABLE_NAME = 'question_papers' THEN
    target_user_id := COALESCE(NEW.created_by, OLD.created_by);
  ELSIF TG_TABLE_NAME IN ('login_history', 'active_sessions') THEN
    target_user_id := COALESCE(NEW.user_id, OLD.user_id);
  ELSIF TG_TABLE_NAME = 'exam_answers' THEN
    -- For exam_answers, get student_id via exam_attempts
    SELECT ea.student_id INTO target_user_id
    FROM exam_attempts ea
    WHERE ea.id = COALESCE(NEW.attempt_id, OLD.attempt_id);
  END IF;

  -- Calculate new database size for the user
  IF target_user_id IS NOT NULL THEN
    new_db_size := calculate_user_database_size(target_user_id);
    
    -- Update or insert storage_usage record
    INSERT INTO storage_usage (user_id, database_storage_bytes, last_calculated_at, updated_at)
    VALUES (target_user_id, new_db_size, NOW(), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
      database_storage_bytes = new_db_size,
      last_calculated_at = NOW(),
      updated_at = NOW();
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for automatic storage updates
DROP TRIGGER IF EXISTS trigger_auto_update_storage_questions ON questions;
CREATE TRIGGER trigger_auto_update_storage_questions
AFTER INSERT OR UPDATE OR DELETE ON questions
FOR EACH ROW EXECUTE FUNCTION auto_update_user_storage();

DROP TRIGGER IF EXISTS trigger_auto_update_storage_exams ON exams;
CREATE TRIGGER trigger_auto_update_storage_exams
AFTER INSERT OR UPDATE OR DELETE ON exams
FOR EACH ROW EXECUTE FUNCTION auto_update_user_storage();

DROP TRIGGER IF EXISTS trigger_auto_update_storage_exam_attempts ON exam_attempts;
CREATE TRIGGER trigger_auto_update_storage_exam_attempts
AFTER INSERT OR UPDATE OR DELETE ON exam_attempts
FOR EACH ROW EXECUTE FUNCTION auto_update_user_storage();

DROP TRIGGER IF EXISTS trigger_auto_update_storage_exam_answers ON exam_answers;
CREATE TRIGGER trigger_auto_update_storage_exam_answers
AFTER INSERT OR UPDATE OR DELETE ON exam_answers
FOR EACH ROW EXECUTE FUNCTION auto_update_user_storage();

DROP TRIGGER IF EXISTS trigger_auto_update_storage_question_papers ON question_papers;
CREATE TRIGGER trigger_auto_update_storage_question_papers
AFTER INSERT OR UPDATE OR DELETE ON question_papers
FOR EACH ROW EXECUTE FUNCTION auto_update_user_storage();

-- Function to capture system-wide storage snapshot
CREATE OR REPLACE FUNCTION capture_storage_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_users_count INTEGER;
  total_file_bytes BIGINT;
  total_db_bytes BIGINT;
  total_bytes BIGINT;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO total_users_count FROM profiles;
  
  -- Sum up all storage
  SELECT 
    COALESCE(SUM(file_storage_bytes), 0),
    COALESCE(SUM(database_storage_bytes), 0),
    COALESCE(SUM(file_storage_bytes + database_storage_bytes), 0)
  INTO total_file_bytes, total_db_bytes, total_bytes
  FROM storage_usage;
  
  -- Insert snapshot
  INSERT INTO storage_history (
    snapshot_time,
    total_users,
    total_file_storage_bytes,
    total_database_storage_bytes,
    total_storage_bytes
  ) VALUES (
    NOW(),
    total_users_count,
    total_file_bytes,
    total_db_bytes,
    total_bytes
  );
END;
$$;

-- Function to get current system capacity status
CREATE OR REPLACE FUNCTION get_system_capacity_status()
RETURNS TABLE (
  total_storage_bytes BIGINT,
  max_storage_bytes BIGINT,
  used_percentage NUMERIC,
  available_bytes BIGINT,
  status TEXT,
  warning_threshold_percent INTEGER,
  critical_threshold_percent INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_used BIGINT;
  max_capacity BIGINT;
  warn_threshold INTEGER;
  crit_threshold INTEGER;
  used_percent NUMERIC;
  status_text TEXT;
BEGIN
  -- Get total storage used
  SELECT COALESCE(SUM(su.file_storage_bytes + su.database_storage_bytes), 0)
  INTO total_used
  FROM storage_usage su;
  
  -- Get capacity settings
  SELECT sc.max_storage_bytes, sc.warning_threshold_percent, sc.critical_threshold_percent
  INTO max_capacity, warn_threshold, crit_threshold
  FROM system_capacity sc
  LIMIT 1;
  
  -- Calculate percentage
  IF max_capacity > 0 THEN
    used_percent := ROUND((total_used::NUMERIC / max_capacity::NUMERIC) * 100, 2);
  ELSE
    used_percent := 0;
  END IF;
  
  -- Determine status
  IF used_percent >= crit_threshold THEN
    status_text := 'critical';
  ELSIF used_percent >= warn_threshold THEN
    status_text := 'warning';
  ELSE
    status_text := 'healthy';
  END IF;
  
  RETURN QUERY SELECT
    total_used,
    max_capacity,
    used_percent,
    max_capacity - total_used,
    status_text,
    warn_threshold,
    crit_threshold;
END;
$$;

-- Function to get storage growth rate (bytes per day)
CREATE OR REPLACE FUNCTION get_storage_growth_rate()
RETURNS TABLE (
  growth_rate_bytes_per_day NUMERIC,
  days_until_full NUMERIC,
  projected_full_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  oldest_snapshot RECORD;
  latest_snapshot RECORD;
  days_diff NUMERIC;
  growth_bytes NUMERIC;
  growth_per_day NUMERIC;
  current_used BIGINT;
  max_capacity BIGINT;
  days_remaining NUMERIC;
  full_date TIMESTAMPTZ;
BEGIN
  -- Get oldest and latest snapshots
  SELECT * INTO oldest_snapshot
  FROM storage_history
  ORDER BY snapshot_time ASC
  LIMIT 1;
  
  SELECT * INTO latest_snapshot
  FROM storage_history
  ORDER BY snapshot_time DESC
  LIMIT 1;
  
  -- Calculate growth rate
  IF oldest_snapshot IS NOT NULL AND latest_snapshot IS NOT NULL THEN
    days_diff := EXTRACT(EPOCH FROM (latest_snapshot.snapshot_time - oldest_snapshot.snapshot_time)) / 86400;
    
    IF days_diff > 0 THEN
      growth_bytes := latest_snapshot.total_storage_bytes - oldest_snapshot.total_storage_bytes;
      growth_per_day := growth_bytes / days_diff;
      
      -- Get current capacity
      SELECT sc.max_storage_bytes INTO max_capacity
      FROM system_capacity sc
      LIMIT 1;
      
      current_used := latest_snapshot.total_storage_bytes;
      
      -- Calculate days until full
      IF growth_per_day > 0 THEN
        days_remaining := (max_capacity - current_used)::NUMERIC / growth_per_day;
        full_date := NOW() + (days_remaining || ' days')::INTERVAL;
      ELSE
        days_remaining := NULL;
        full_date := NULL;
      END IF;
      
      RETURN QUERY SELECT growth_per_day, days_remaining, full_date;
    ELSE
      RETURN QUERY SELECT 0::NUMERIC, NULL::NUMERIC, NULL::TIMESTAMPTZ;
    END IF;
  ELSE
    RETURN QUERY SELECT 0::NUMERIC, NULL::NUMERIC, NULL::TIMESTAMPTZ;
  END IF;
END;
$$;

-- Function to get storage history for charts
CREATE OR REPLACE FUNCTION get_storage_history(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  snapshot_time TIMESTAMPTZ,
  total_storage_bytes BIGINT,
  total_file_storage_bytes BIGINT,
  total_database_storage_bytes BIGINT,
  total_users INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.snapshot_time,
    sh.total_storage_bytes,
    sh.total_file_storage_bytes,
    sh.total_database_storage_bytes,
    sh.total_users
  FROM storage_history sh
  WHERE sh.snapshot_time >= NOW() - (days_back || ' days')::INTERVAL
  ORDER BY sh.snapshot_time ASC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION capture_storage_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_capacity_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_growth_rate() TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_history(INTEGER) TO authenticated;

-- RLS Policies for new tables
ALTER TABLE storage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_capacity ENABLE ROW LEVEL SECURITY;

-- Admin can view all storage history
CREATE POLICY "Admins can view storage history"
ON storage_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin can view and update system capacity
CREATE POLICY "Admins can view system capacity"
ON system_capacity FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update system capacity"
ON system_capacity FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Capture initial snapshot
SELECT capture_storage_snapshot();