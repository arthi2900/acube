-- Add logout_time column to login_history table
ALTER TABLE login_history 
ADD COLUMN logout_time TIMESTAMPTZ NULL;

-- Add index for better query performance
CREATE INDEX idx_login_history_logout_time ON login_history(logout_time);

-- Add comment
COMMENT ON COLUMN login_history.logout_time IS 'Timestamp when user logged out';