/*
# Sync Principal-School Assignment

## Problem
When a principal is assigned to a school (schools.principal_id is set), the principal's 
profile (profiles.school_id) is not automatically updated. This causes the principal to 
not be able to view teachers from their school.

## Solution
1. Create a trigger to automatically sync school_id to principal's profile when principal_id is set
2. Create a trigger to clear school_id from old principal when a new principal is assigned
3. Fix existing data where principals are assigned to schools but don't have school_id set

## Changes

### Triggers
- `sync_principal_school_on_insert` - When a school is created with a principal
- `sync_principal_school_on_update` - When a school's principal is changed

### Data Fix
- Update all existing principals to have the correct school_id

## Example
Before:
- schools: { id: 'school-1', principal_id: 'user-1' }
- profiles: { id: 'user-1', school_id: null }

After:
- schools: { id: 'school-1', principal_id: 'user-1' }
- profiles: { id: 'user-1', school_id: 'school-1' }
*/

-- Function to sync principal's school_id when principal is assigned to a school
CREATE OR REPLACE FUNCTION sync_principal_school_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- If principal_id is being set (not null)
  IF NEW.principal_id IS NOT NULL THEN
    -- Update the principal's profile to have this school_id
    UPDATE profiles
    SET school_id = NEW.id
    WHERE id = NEW.principal_id;
  END IF;

  -- If principal_id is being changed (from one principal to another)
  IF TG_OP = 'UPDATE' AND OLD.principal_id IS DISTINCT FROM NEW.principal_id THEN
    -- Clear school_id from old principal (if there was one)
    IF OLD.principal_id IS NOT NULL THEN
      UPDATE profiles
      SET school_id = NULL
      WHERE id = OLD.principal_id AND school_id = OLD.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for INSERT operations
CREATE TRIGGER trigger_sync_principal_school_on_insert
  AFTER INSERT ON schools
  FOR EACH ROW
  WHEN (NEW.principal_id IS NOT NULL)
  EXECUTE FUNCTION sync_principal_school_assignment();

-- Create trigger for UPDATE operations
CREATE TRIGGER trigger_sync_principal_school_on_update
  AFTER UPDATE ON schools
  FOR EACH ROW
  WHEN (OLD.principal_id IS DISTINCT FROM NEW.principal_id)
  EXECUTE FUNCTION sync_principal_school_assignment();

-- Fix existing data: Update all principals to have the correct school_id
UPDATE profiles p
SET school_id = s.id
FROM schools s
WHERE s.principal_id = p.id
  AND (p.school_id IS NULL OR p.school_id != s.id);

-- Add comment for documentation
COMMENT ON FUNCTION sync_principal_school_assignment() IS 
  'Automatically syncs school_id to principal profile when principal is assigned to a school';
