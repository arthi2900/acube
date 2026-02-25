/*
# Restore Teacher Assignments Foreign Key to Subjects

## Problem
When migration 00013 dropped the subjects table with CASCADE, it also dropped
the foreign key constraint from teacher_assignments to subjects. The teacher_assignments
table was not recreated in migration 00013, leaving it without the subject_id foreign key.

This causes the error:
"Could not find a relationship between 'teacher_assignments' and 'subjects'"

## Solution
1. Clean up orphaned teacher_assignments records (subjects that no longer exist)
2. Add back the missing foreign key constraint from teacher_assignments.subject_id to subjects.id

## Impact
- Removes orphaned teacher assignment records (acceptable for development)
- Restores the relationship between teacher_assignments and subjects
- Fixes the QuestionBank page error
*/

-- Step 1: Delete orphaned teacher_assignments records
DELETE FROM teacher_assignments
WHERE NOT EXISTS (
  SELECT 1 FROM subjects WHERE subjects.id = teacher_assignments.subject_id
);

-- Step 2: Add the missing foreign key constraint
ALTER TABLE teacher_assignments
ADD CONSTRAINT teacher_assignments_subject_id_fkey
FOREIGN KEY (subject_id)
REFERENCES subjects(id)
ON DELETE CASCADE;
