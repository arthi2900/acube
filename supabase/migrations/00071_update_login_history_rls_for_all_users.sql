-- Drop existing admin-only policy
DROP POLICY IF EXISTS "Admin can view all login history" ON login_history;

-- Create new policy: Admin can view all login history
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

-- Create new policy: Users can view their own login history
CREATE POLICY "Users can view their own login history"
  ON login_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Add comment
COMMENT ON POLICY "Users can view their own login history" ON login_history IS 'Allows users to view their own login history records';