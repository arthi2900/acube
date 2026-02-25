/*
# Create Schools Table

## Purpose
Implement school profile management system where only admins can create and manage school information.
Principals can view their school details but cannot edit them.

## Tables Created

### schools
- `id` (uuid, primary key, default: gen_random_uuid())
- `school_name` (text, not null, unique)
- `school_address` (text, not null)
- `contact_number` (text, not null)
- `email` (text, not null)
- `school_code` (text, unique, auto-generated)
- `affiliation_board` (text, not null) - e.g., State Board, CBSE, ICSE
- `class_range_from` (integer, not null) - Starting class (e.g., 1)
- `class_range_to` (integer, not null) - Ending class (e.g., 12)
- `subjects_offered` (text[], not null) - Array of subjects
- `principal_id` (uuid, references profiles.id, nullable)
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

## Schema Changes
- Add `school_id` to profiles table to link users to schools

## Security
- Only admins can create, update, or delete schools
- All users can view schools (for dropdown selection)
- Principals can view their assigned school details

## Notes
- School code is auto-generated with format: SCH-XXXXXX (6-digit number)
- Principal can be assigned to only one school
- Multiple teachers and students can be linked to one school
*/

-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name text NOT NULL UNIQUE,
  school_address text NOT NULL,
  contact_number text NOT NULL,
  email text NOT NULL,
  school_code text UNIQUE,
  affiliation_board text NOT NULL,
  class_range_from integer NOT NULL CHECK (class_range_from >= 1 AND class_range_from <= 12),
  class_range_to integer NOT NULL CHECK (class_range_to >= 1 AND class_range_to <= 12 AND class_range_to >= class_range_from),
  subjects_offered text[] NOT NULL DEFAULT '{}',
  principal_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add school_id to profiles table
ALTER TABLE profiles 
ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE SET NULL;

-- Create function to auto-generate school code
CREATE OR REPLACE FUNCTION generate_school_code()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate a 6-digit random number
    new_code := 'SCH-' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM schools WHERE school_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Create trigger to auto-generate school code before insert
CREATE OR REPLACE FUNCTION set_school_code()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.school_code IS NULL THEN
    NEW.school_code := generate_school_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_school_code
  BEFORE INSERT ON schools
  FOR EACH ROW
  EXECUTE FUNCTION set_school_code();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on schools table
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view schools (for dropdown selection)
CREATE POLICY "Anyone can view schools" ON schools
  FOR SELECT USING (true);

-- Policy: Only admins can insert schools
CREATE POLICY "Only admins can create schools" ON schools
  FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Policy: Only admins can update schools
CREATE POLICY "Only admins can update schools" ON schools
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policy: Only admins can delete schools
CREATE POLICY "Only admins can delete schools" ON schools
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

-- Add indexes for better performance
CREATE INDEX idx_schools_principal_id ON schools(principal_id);
CREATE INDEX idx_schools_school_code ON schools(school_code);
CREATE INDEX idx_profiles_school_id ON profiles(school_id);

-- Add comments for documentation
COMMENT ON TABLE schools IS 'Stores school profile information. Only admins can manage schools.';
COMMENT ON COLUMN schools.school_code IS 'Auto-generated unique identifier with format SCH-XXXXXX';
COMMENT ON COLUMN schools.principal_id IS 'Reference to the principal user assigned to this school';
COMMENT ON COLUMN profiles.school_id IS 'Reference to the school this user belongs to';
