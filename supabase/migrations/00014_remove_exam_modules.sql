/*
# Remove Exam Modules

## Purpose
Remove all exam-related functionality from the system, keeping only the Question Bank module.

## Tables to Remove
1. exam_answers - Student answers to exam questions
2. exam_attempts - Student exam attempts
3. exam_schedules - Scheduled exams for classes/sections
4. exam_questions - Questions in an exam
5. exams - Exam papers

## Impact
- All exam data will be deleted
- Question Bank remains intact
- Teachers can still create and manage questions
- No exam creation, scheduling, or taking functionality

## Remaining Functionality
- Question Bank (questions table remains)
- User Management (profiles, schools, classes, sections)
- Teacher Assignments
- Student Class Assignments
*/

-- Drop exam-related tables in correct order (dependencies first)
DROP TABLE IF EXISTS exam_answers CASCADE;
DROP TABLE IF EXISTS exam_attempts CASCADE;
DROP TABLE IF EXISTS exam_schedules CASCADE;
DROP TABLE IF EXISTS exam_questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;

-- Note: questions table is NOT dropped - Question Bank remains functional
