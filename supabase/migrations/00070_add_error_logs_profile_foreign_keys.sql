-- Drop existing foreign key constraints
ALTER TABLE error_logs DROP CONSTRAINT IF EXISTS error_logs_user_id_fkey;
ALTER TABLE error_logs DROP CONSTRAINT IF EXISTS error_logs_resolved_by_fkey;

-- Add new foreign key constraints referencing profiles table
ALTER TABLE error_logs 
  ADD CONSTRAINT error_logs_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;

ALTER TABLE error_logs 
  ADD CONSTRAINT error_logs_resolved_by_fkey 
  FOREIGN KEY (resolved_by) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;