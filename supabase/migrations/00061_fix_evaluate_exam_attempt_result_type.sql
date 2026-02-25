-- Fix evaluate_exam_attempt result type
-- Date: 2025-01-21

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
  
  -- Get total marks and passing marks from exams table
  SELECT e.total_marks, e.passing_marks 
  INTO total_possible, exam_passing_marks
  FROM exams e
  JOIN exam_attempts ea ON ea.exam_id = e.id
  WHERE ea.id = attempt_uuid;
  
  -- Validate exam was found
  IF total_possible IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Exam not found for attempt ' || attempt_uuid
    );
  END IF;
  
  -- Calculate total marks obtained from exam_answers
  SELECT COALESCE(SUM(marks_obtained), 0)
  INTO total_obtained
  FROM exam_answers
  WHERE attempt_id = attempt_uuid;
  
  -- Calculate percentage based on exam total marks
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
  
  -- Update attempt (result is text, not enum)
  UPDATE exam_attempts
  SET 
    status = 'evaluated'::attempt_status,
    total_marks_obtained = total_obtained,
    percentage = ROUND(calc_percentage, 2),
    result = pass_status
  WHERE id = attempt_uuid;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_marks_obtained', total_obtained,
    'total_marks', total_possible,
    'percentage', ROUND(calc_percentage, 2),
    'result', pass_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;