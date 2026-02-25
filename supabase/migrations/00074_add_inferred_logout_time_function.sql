-- Create a function to infer logout times based on next login or timeout
CREATE OR REPLACE FUNCTION infer_logout_times()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update logout_time for records where:
  -- 1. logout_time is NULL
  -- 2. There's a newer login for the same user
  -- Set logout_time to the timestamp of the next login
  UPDATE login_history lh1
  SET logout_time = (
    SELECT lh2.login_time
    FROM login_history lh2
    WHERE lh2.user_id = lh1.user_id
      AND lh2.login_time > lh1.login_time
    ORDER BY lh2.login_time ASC
    LIMIT 1
  )
  WHERE lh1.logout_time IS NULL
    AND EXISTS (
      SELECT 1
      FROM login_history lh2
      WHERE lh2.user_id = lh1.user_id
        AND lh2.login_time > lh1.login_time
    );

  -- For records older than 24 hours with no logout_time and no subsequent login,
  -- set logout_time to login_time + 8 hours (assumed session duration)
  UPDATE login_history
  SET logout_time = login_time + INTERVAL '8 hours'
  WHERE logout_time IS NULL
    AND login_time < NOW() - INTERVAL '24 hours'
    AND NOT EXISTS (
      SELECT 1
      FROM login_history lh2
      WHERE lh2.user_id = login_history.user_id
        AND lh2.login_time > login_history.login_time
    );
END;
$$;

-- Create a view that shows login history with inferred logout times
CREATE OR REPLACE VIEW login_history_with_inferred_logout AS
SELECT 
  lh.*,
  CASE 
    WHEN lh.logout_time IS NOT NULL THEN lh.logout_time
    WHEN lh.login_time < NOW() - INTERVAL '24 hours' THEN lh.login_time + INTERVAL '8 hours'
    WHEN EXISTS (
      SELECT 1 FROM login_history lh2 
      WHERE lh2.user_id = lh.user_id 
        AND lh2.login_time > lh.login_time
    ) THEN (
      SELECT MIN(lh2.login_time)
      FROM login_history lh2
      WHERE lh2.user_id = lh.user_id
        AND lh2.login_time > lh.login_time
    )
    ELSE NULL
  END as inferred_logout_time,
  CASE 
    WHEN lh.logout_time IS NOT NULL THEN 'explicit'
    WHEN lh.login_time < NOW() - INTERVAL '24 hours' THEN 'timeout'
    WHEN EXISTS (
      SELECT 1 FROM login_history lh2 
      WHERE lh2.user_id = lh.user_id 
        AND lh2.login_time > lh.login_time
    ) THEN 'next_login'
    ELSE 'active'
  END as logout_type
FROM login_history lh;

-- Grant access to the view
GRANT SELECT ON login_history_with_inferred_logout TO authenticated;

-- Add comment
COMMENT ON VIEW login_history_with_inferred_logout IS 'Login history with inferred logout times based on next login or timeout';