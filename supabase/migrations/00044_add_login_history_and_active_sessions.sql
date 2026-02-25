-- Create login_history table to track all login events
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create active_sessions table to track currently logged-in users
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'logged_out')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_time ON login_history(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_role ON login_history(role);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_status ON active_sessions(status);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON active_sessions(last_activity DESC);

-- Enable RLS
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for login_history (Admin only)
CREATE POLICY "Admin can view all login history"
  ON login_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert login history"
  ON login_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for active_sessions (Admin only)
CREATE POLICY "Admin can view all active sessions"
  ON active_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can manage their own session"
  ON active_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to update last_activity timestamp
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_active_sessions_updated_at
  BEFORE UPDATE ON active_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- Function to clean up stale sessions (sessions inactive for more than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS void AS $$
BEGIN
  UPDATE active_sessions
  SET status = 'logged_out'
  WHERE status = 'active'
  AND last_activity < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE login_history IS 'Tracks all user login events for audit purposes';
COMMENT ON TABLE active_sessions IS 'Tracks currently active user sessions for real-time monitoring';
COMMENT ON FUNCTION cleanup_stale_sessions IS 'Marks sessions as logged_out if inactive for more than 24 hours';