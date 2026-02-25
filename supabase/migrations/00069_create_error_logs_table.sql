-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_type TEXT NOT NULL CHECK (error_type IN ('frontend', 'api', 'auth', 'database', 'user_action', 'system')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved')),
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_status ON error_logs(status);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view error logs
CREATE POLICY "Admins can view all error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can update error logs (mark as resolved)
CREATE POLICY "Admins can update error logs"
  ON error_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Allow system to insert error logs (anyone can log errors)
CREATE POLICY "Allow error log insertion"
  ON error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to get error log statistics
CREATE OR REPLACE FUNCTION get_error_log_stats()
RETURNS TABLE (
  total_errors BIGINT,
  critical_errors BIGINT,
  high_errors BIGINT,
  medium_errors BIGINT,
  low_errors BIGINT,
  new_errors BIGINT,
  resolved_errors BIGINT,
  errors_today BIGINT,
  errors_this_week BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_errors,
    COUNT(*) FILTER (WHERE severity = 'critical')::BIGINT as critical_errors,
    COUNT(*) FILTER (WHERE severity = 'high')::BIGINT as high_errors,
    COUNT(*) FILTER (WHERE severity = 'medium')::BIGINT as medium_errors,
    COUNT(*) FILTER (WHERE severity = 'low')::BIGINT as low_errors,
    COUNT(*) FILTER (WHERE status = 'new')::BIGINT as new_errors,
    COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved_errors,
    COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE)::BIGINT as errors_today,
    COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as errors_this_week
  FROM error_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;