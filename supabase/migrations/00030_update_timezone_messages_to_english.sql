/*
# Update Timezone Error Messages to English

## Changes
1. Update can_student_take_exam function error messages to English
2. All user-facing messages now in English

## Purpose
- Consistent English UI language throughout the application
*/

-- Update the can_student_take_exam function with English messages
CREATE OR REPLACE FUNCTION can_student_take_exam(exam_uuid uuid, student_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  exam_record RECORD;
  attempt_record RECORD;
  current_time_ist timestamptz;
  result jsonb;
BEGIN
  -- Get current time in IST
  current_time_ist := now() AT TIME ZONE 'Asia/Kolkata';
  
  -- Get exam details
  SELECT * INTO exam_record FROM exams WHERE id = exam_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_take', false, 'reason', 'Exam not found');
  END IF;
  
  -- Check if exam is published
  IF exam_record.status != 'published' THEN
    RETURN jsonb_build_object('can_take', false, 'reason', 'Exam is not published');
  END IF;
  
  -- Check if exam has started (compare in IST)
  IF (exam_record.start_time AT TIME ZONE 'Asia/Kolkata') > current_time_ist THEN
    RETURN jsonb_build_object('can_take', false, 'reason', 'Exam has not started yet');
  END IF;
  
  -- Check if exam has ended (compare in IST)
  IF (exam_record.end_time AT TIME ZONE 'Asia/Kolkata') < current_time_ist THEN
    RETURN jsonb_build_object('can_take', false, 'reason', 'Exam has ended');
  END IF;
  
  -- Check if student already has an attempt
  SELECT * INTO attempt_record FROM exam_attempts 
  WHERE exam_id = exam_uuid AND student_id = student_uuid;
  
  IF FOUND THEN
    IF attempt_record.status = 'submitted' OR attempt_record.status = 'evaluated' THEN
      RETURN jsonb_build_object('can_take', false, 'reason', 'You have already submitted this exam');
    ELSIF attempt_record.status = 'in_progress' THEN
      RETURN jsonb_build_object('can_take', true, 'reason', 'Continue your exam', 'attempt_id', attempt_record.id);
    END IF;
  END IF;
  
  RETURN jsonb_build_object('can_take', true, 'reason', 'You can start the exam');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;