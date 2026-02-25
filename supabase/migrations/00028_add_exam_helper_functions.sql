/*
# Add Exam Helper Functions

## New Functions
1. get_exam_statistics - Get statistics for an exam (total attempts, average score, etc.)
2. get_student_exam_status - Check if student can take an exam
3. evaluate_exam_attempt - Evaluate all answers for an attempt and update status

## Purpose
- Provide helper functions for exam management
- Simplify complex queries
- Ensure consistent business logic
*/

-- Function to get exam statistics
CREATE OR REPLACE FUNCTION get_exam_statistics(exam_uuid uuid)
RETURNS TABLE (
  total_attempts bigint,
  completed_attempts bigint,
  average_score numeric,
  highest_score numeric,
  lowest_score numeric,
  pass_count bigint,
  fail_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_attempts,
    COUNT(*) FILTER (WHERE status IN ('submitted', 'evaluated'))::bigint as completed_attempts,
    COALESCE(AVG(total_marks_obtained) FILTER (WHERE status IN ('submitted', 'evaluated')), 0) as average_score,
    COALESCE(MAX(total_marks_obtained) FILTER (WHERE status IN ('submitted', 'evaluated')), 0) as highest_score,
    COALESCE(MIN(total_marks_obtained) FILTER (WHERE status IN ('submitted', 'evaluated')), 0) as lowest_score,
    COUNT(*) FILTER (WHERE result = 'pass')::bigint as pass_count,
    COUNT(*) FILTER (WHERE result = 'fail')::bigint as fail_count
  FROM exam_attempts
  WHERE exam_id = exam_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if student can take exam
CREATE OR REPLACE FUNCTION can_student_take_exam(exam_uuid uuid, student_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  exam_record RECORD;
  attempt_record RECORD;
  result jsonb;
BEGIN
  -- Get exam details
  SELECT * INTO exam_record FROM exams WHERE id = exam_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_take', false, 'reason', 'Exam not found');
  END IF;
  
  -- Check if exam is published
  IF exam_record.status != 'published' THEN
    RETURN jsonb_build_object('can_take', false, 'reason', 'Exam is not published');
  END IF;
  
  -- Check if exam has started
  IF exam_record.start_time > now() THEN
    RETURN jsonb_build_object('can_take', false, 'reason', 'Exam has not started yet');
  END IF;
  
  -- Check if exam has ended
  IF exam_record.end_time < now() THEN
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

-- Function to evaluate an exam attempt
CREATE OR REPLACE FUNCTION evaluate_exam_attempt(attempt_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  total_obtained numeric;
  total_possible numeric;
  calc_percentage numeric;
  exam_passing_marks integer;
  pass_status text;
  unevaluated_count integer;
BEGIN
  -- Check for unevaluated subjective questions
  SELECT COUNT(*) INTO unevaluated_count
  FROM exam_answers ea
  JOIN questions q ON q.id = ea.question_id
  WHERE ea.attempt_id = attempt_uuid
  AND q.question_type = 'short_answer'
  AND ea.marks_obtained IS NULL;
  
  IF unevaluated_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Cannot evaluate: ' || unevaluated_count || ' subjective questions not graded'
    );
  END IF;
  
  -- Get exam passing marks
  SELECT e.passing_marks INTO exam_passing_marks
  FROM exams e
  JOIN exam_attempts ea ON ea.exam_id = e.id
  WHERE ea.id = attempt_uuid;
  
  -- Calculate totals
  SELECT 
    COALESCE(SUM(marks_obtained), 0),
    COALESCE(SUM(marks_allocated), 0)
  INTO total_obtained, total_possible
  FROM exam_answers
  WHERE attempt_id = attempt_uuid;
  
  -- Calculate percentage
  IF total_possible > 0 THEN
    calc_percentage := (total_obtained / total_possible) * 100;
  ELSE
    calc_percentage := 0;
  END IF;
  
  -- Determine pass/fail
  IF total_obtained >= exam_passing_marks THEN
    pass_status := 'pass';
  ELSE
    pass_status := 'fail';
  END IF;
  
  -- Update attempt
  UPDATE exam_attempts
  SET 
    status = 'evaluated'::attempt_status,
    total_marks_obtained = total_obtained,
    percentage = calc_percentage,
    result = pass_status
  WHERE id = attempt_uuid;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_marks_obtained', total_obtained,
    'total_marks', total_possible,
    'percentage', calc_percentage,
    'result', pass_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;