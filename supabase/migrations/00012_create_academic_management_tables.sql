/*
# Academic Management System - Database Schema

## Overview
This migration creates the complete academic management system for schools,
including classes, sections, subjects, student assignments, and teacher assignments.

## New Tables

### 1. classes
Stores class/grade information (e.g., Class 10, Grade 12)
- `id` (uuid, primary key)
- `school_id` (uuid, foreign key to schools) - Links class to school
- `class_name` (text, not null) - Display name (e.g., "Class 10", "Grade 12")
- `class_code` (text, not null) - Short code (e.g., "10", "12")
- `description` (text, nullable) - Optional description
- `created_at` (timestamptz, default now())

### 2. sections
Stores section information within a class (e.g., Section A, B, C)
- `id` (uuid, primary key)
- `class_id` (uuid, foreign key to classes) - Links section to class
- `section_name` (text, not null) - Display name (e.g., "Section A")
- `section_code` (text, not null) - Short code (e.g., "A", "B")
- `created_at` (timestamptz, default now())

### 3. subjects
Stores subject information per class (e.g., Mathematics for Class 10)
- `id` (uuid, primary key)
- `school_id` (uuid, foreign key to schools) - Links subject to school
- `class_id` (uuid, foreign key to classes) - Links subject to class
- `subject_name` (text, not null) - Display name (e.g., "Mathematics")
- `subject_code` (text, not null) - Short code (e.g., "MATH")
- `description` (text, nullable) - Optional description
- `created_at` (timestamptz, default now())

### 4. student_class_sections
Maps students to their class and section
- `id` (uuid, primary key)
- `student_id` (uuid, foreign key to profiles) - Links to student profile
- `class_id` (uuid, foreign key to classes) - Student's class
- `section_id` (uuid, foreign key to sections) - Student's section
- `academic_year` (text, not null) - Academic year (e.g., "2024-2025")
- `created_at` (timestamptz, default now())

### 5. teacher_assignments
Maps teachers to subject-class-section combinations (HEART OF THE SYSTEM)
- `id` (uuid, primary key)
- `teacher_id` (uuid, foreign key to profiles) - Links to teacher profile
- `subject_id` (uuid, foreign key to subjects) - Subject being taught
- `class_id` (uuid, foreign key to classes) - Class being taught
- `section_id` (uuid, foreign key to sections) - Section being taught
- `academic_year` (text, not null) - Academic year
- `created_at` (timestamptz, default now())

## Security
- All tables are public (no RLS) for simplicity
- School-level access control handled at application level
- Principals can manage all data for their school
- Teachers can view their assignments
- Students can view their class/section info

## Constraints
- Unique constraints to prevent duplicate assignments
- Foreign key constraints for data integrity
- Cascade deletes where appropriate

## Notes
- Academic year format: "YYYY-YYYY" (e.g., "2024-2025")
- All IDs are UUIDs for consistency
- Timestamps use timestamptz for timezone support
*/

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  class_code text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(school_id, class_code)
);

-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_name text NOT NULL,
  section_code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_id, section_code)
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_name text NOT NULL,
  subject_code text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(school_id, class_id, subject_code)
);

-- Create student_class_sections table
CREATE TABLE IF NOT EXISTS student_class_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, academic_year)
);

-- Create teacher_assignments table (HEART OF THE SYSTEM)
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, subject_id, class_id, section_id, academic_year)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_sections_class_id ON sections(class_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_student_class_sections_student_id ON student_class_sections(student_id);
CREATE INDEX IF NOT EXISTS idx_student_class_sections_class_id ON student_class_sections(class_id);
CREATE INDEX IF NOT EXISTS idx_student_class_sections_section_id ON student_class_sections(section_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_subject_id ON teacher_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_id ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_section_id ON teacher_assignments(section_id);