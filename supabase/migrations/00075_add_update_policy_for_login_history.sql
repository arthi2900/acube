-- Add UPDATE policy for login_history to allow users to update their own logout times
CREATE POLICY "Users can update their own login history"
  ON login_history FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add comment
COMMENT ON POLICY "Users can update their own login history" ON login_history 
IS 'Allows users to update logout_time in their own login history records';