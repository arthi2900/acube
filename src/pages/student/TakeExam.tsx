import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { examApi, examAttemptApi, examAnswerApi, academicApi, profileApi } from '@/db/api';
import { Clock, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import type { ExamWithDetails, QuestionPaperQuestionWithDetails, ExamAttempt, MatchPair } from '@/types/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { hasExamStarted, hasExamEnded, getExamRemainingTime, formatSecondsToTime } from '@/utils/timezone';
import { MathRenderer } from '@/components/ui/math-renderer';
import { SubmissionProgressDialog } from '@/components/ui/submission-progress-dialog';

interface SubmissionStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

export default function TakeExam() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exam, setExam] = useState<ExamWithDetails | null>(null);
  const [questions, setQuestions] = useState<QuestionPaperQuestionWithDetails[]>([]);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [examInitialized, setExamInitialized] = useState(false);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState<{
    open: boolean;
    steps: SubmissionStep[];
    currentStep: number;
    progress?: number; // Add custom progress tracking
    error?: string;
  }>({
    open: false,
    steps: [],
    currentStep: 0,
    progress: 0,
  });

  useEffect(() => {
    if (examId) {
      initializeExam();
    }
  }, [examId]);

  // Mark current question as visited when navigating to it
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      const currentQuestionId = questions[currentQuestionIndex].question_id;
      setVisitedQuestions(prev => new Set(prev).add(currentQuestionId));
    }
  }, [currentQuestionIndex, questions]);

  // Mark the first question as visited when questions are initially loaded
  useEffect(() => {
    if (questionsLoaded && questions.length > 0) {
      const firstQuestionId = questions[0].question_id;
      setVisitedQuestions(prev => new Set(prev).add(firstQuestionId));
    }
  }, [questionsLoaded, questions]);

  useEffect(() => {
    // Debug: Log when this effect runs
    console.log('Timer useEffect triggered:', {
      timeRemaining,
      hasAttempt: !!attempt,
      examInitialized,
      shouldAutoSubmit: timeRemaining <= 0 && attempt && examInitialized
    });

    // Only trigger auto-submit if exam is initialized and timer has expired
    // This prevents auto-submit during initial load when timeRemaining is 0
    if (timeRemaining <= 0 && attempt && examInitialized) {
      handleAutoSubmit();
      return;
    }

    // Don't start timer until exam is initialized
    if (!examInitialized) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, attempt, examInitialized]);

  const initializeExam = async () => {
    try {
      if (!examId) return;

      const profile = await profileApi.getCurrentProfile();
      if (!profile) throw new Error('Profile not found');

      const examData = await examApi.getExamById(examId);
      if (!examData) throw new Error('Exam not found');
      setExam(examData);

      // Check time in IST
      if (!hasExamStarted(examData.start_time)) {
        throw new Error('Exam has not started yet');
      }
      if (hasExamEnded(examData.end_time)) {
        throw new Error('Exam has ended');
      }

      let attemptData = await examAttemptApi.getAttemptByStudent(examId, profile.id);

      if (!attemptData) {
        try {
          // Create attempt with current UTC time (database will store as UTC)
          attemptData = await examAttemptApi.createAttempt({
            exam_id: examId,
            student_id: profile.id,
            started_at: new Date().toISOString(),
            submitted_at: null,
            status: 'in_progress',
            submission_type: 'normal',
            total_marks_obtained: 0,
            percentage: 0,
            result: null,
          });
        } catch (createError: any) {
          // If 409 conflict (attempt already exists), try fetching again
          if (createError.message?.includes('409') || createError.code === '23505') {
            console.log('Attempt already exists, fetching existing attempt...');
            attemptData = await examAttemptApi.getAttemptByStudent(examId, profile.id);
            if (!attemptData) {
              throw new Error('Failed to create or retrieve exam attempt');
            }
          } else {
            throw createError;
          }
        }
      }
      
      if (attemptData.status === 'submitted' || attemptData.status === 'evaluated') {
        navigate('/student/results');
        return;
      }

      setAttempt(attemptData);

      // Load questions with validation
      const paperQuestions = await academicApi.getQuestionPaperQuestions(examData.question_paper_id);
      
      // ✅ CRITICAL VALIDATION: Ensure all questions are loaded
      console.log('=== QUESTION LOADING VALIDATION ===');
      console.log('Exam ID:', examId);
      console.log('Question Paper ID:', examData.question_paper_id);
      console.log('Exam Total Marks:', examData.total_marks);
      console.log('Questions Loaded:', paperQuestions?.length || 0);
      
      // Validation 1: Check if questions exist
      if (!paperQuestions || paperQuestions.length === 0) {
        throw new Error(
          'No questions loaded for this exam. Please refresh the page and try again. ' +
          'If the problem persists, contact your teacher.'
        );
      }
      
      // Validation 2: Compare with exam total marks (assuming 1 mark per question)
      const expectedQuestionCount = examData.total_marks;
      if (paperQuestions.length < expectedQuestionCount) {
        throw new Error(
          `Only ${paperQuestions.length} questions loaded, but exam requires ${expectedQuestionCount} questions. ` +
          'Please refresh the page and try again. If the problem persists, contact your teacher.'
        );
      }
      
      // Validation 3: Check for duplicate display_order
      const displayOrders = paperQuestions.map(q => q.display_order);
      const uniqueOrders = new Set(displayOrders);
      if (displayOrders.length !== uniqueOrders.size) {
        throw new Error(
          'Question loading error: Duplicate question numbers detected. ' +
          'Please contact your teacher.'
        );
      }
      
      // Validation 4: Check for gaps in display_order
      const sortedOrders = [...displayOrders].sort((a, b) => a - b);
      for (let i = 0; i < sortedOrders.length; i++) {
        if (sortedOrders[i] !== i + 1) {
          throw new Error(
            `Question loading error: Missing question #${i + 1}. ` +
            'Please refresh the page and try again.'
          );
        }
      }
      
      console.log('✅ All validations passed');
      console.log('Question IDs:', paperQuestions.map(q => q.question_id));
      console.log('Display Orders:', paperQuestions.map(q => q.display_order));
      console.log('===================================');
      
      setQuestions(paperQuestions);
      setQuestionsLoaded(true);

      const existingAnswers = await examAnswerApi.getAnswersByAttempt(attemptData.id);
      const answersMap: Record<string, any> = {};
      const visitedSet = new Set<string>();
      existingAnswers.forEach(ans => {
        answersMap[ans.question_id] = ans.student_answer;
        // Mark as visited if there's an answer record (even if answer is null/empty)
        visitedSet.add(ans.question_id);
      });
      setAnswers(answersMap);
      setVisitedQuestions(visitedSet);

      // Calculate remaining time in UTC
      const startedAtTime = attemptData.started_at || attemptData.created_at;
      const remainingSeconds = getExamRemainingTime(
        startedAtTime,
        examData.duration_minutes
      );
      
      // Debug logging
      console.log('=== EXAM TIMER DEBUG ===');
      console.log('Current UTC time:', new Date().toISOString());
      console.log('Attempt started_at (from DB):', startedAtTime);
      console.log('Attempt started_at (converted to UTC):', new Date(startedAtTime).toISOString());
      console.log('Exam duration (minutes):', examData.duration_minutes);
      console.log('Calculated remaining seconds:', remainingSeconds);
      console.log('Remaining time (formatted):', formatSecondsToTime(remainingSeconds));
      console.log('Exam start_time (from DB):', examData.start_time);
      console.log('Exam end_time (from DB):', examData.end_time);
      console.log('Note: Database returns timestamps with timezone offset (+05:30 for IST)');
      console.log('JavaScript automatically converts these to UTC for calculations');
      console.log('========================');
      
      setTimeRemaining(remainingSeconds);
      
      // Mark exam as initialized to enable timer and auto-submit logic
      setExamInitialized(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load exam',
        variant: 'destructive',
      });
      navigate('/student/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = async (questionId: string, answer: any) => {
    console.log('=== ANSWER CHANGE ===');
    console.log('Question ID:', questionId);
    console.log('Answer:', answer);
    console.log('Answer Type:', typeof answer);
    console.log('Attempt ID:', attempt?.id);
    console.log('Attempt Status:', attempt?.status);
    
    // Prevent saving if exam is already submitted or evaluated
    if (attempt && (attempt.status === 'submitted' || attempt.status === 'evaluated')) {
      console.warn('⚠️ Cannot save answer: Exam already submitted/evaluated');
      toast({
        title: 'Exam Already Submitted',
        description: 'This exam has already been submitted. Redirecting to results...',
        variant: 'destructive',
      });
      navigate('/student/results');
      return;
    }
    
    setAnswers({ ...answers, [questionId]: answer });
    
    // Mark question as visited when an answer is provided
    setVisitedQuestions(prev => new Set(prev).add(questionId));

    if (attempt) {
      try {
        const question = questions.find(q => q.question_id === questionId);
        const answerData = {
          attempt_id: attempt.id,
          question_id: questionId,
          student_answer: answer,
          marks_allocated: question?.question?.marks || 0,
        };
        
        console.log('Saving answer data:', answerData);
        const result = await examAnswerApi.saveAnswer(answerData);
        console.log('✅ Answer saved successfully:', result);
      } catch (error: any) {
        console.error('❌ Failed to save answer:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Check if error is due to RLS policy (exam already submitted)
        if (error.message?.includes('row-level security policy')) {
          toast({
            title: 'Exam Already Submitted',
            description: 'This exam has already been submitted. Redirecting to results...',
            variant: 'destructive',
          });
          navigate('/student/results');
          return;
        }
        
        // Show error to user
        toast({
          title: 'Error Saving Answer',
          description: 'Your answer may not have been saved. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      console.warn('⚠️ No attempt found, answer not saved');
    }
    console.log('====================');
  };

  const handleAutoSubmit = async () => {
    if (!attempt) return;

    console.log('=== AUTO-SUBMIT TRIGGERED ===');
    console.log('Reason: Timer expired (timeRemaining reached 0)');
    console.log('Attempt ID:', attempt.id);
    console.log('Attempt Status:', attempt.status);
    console.log('Current time:', new Date().toISOString());
    console.log('============================');

    // Prevent double submission
    if (attempt.status === 'submitted' || attempt.status === 'evaluated') {
      console.warn('⚠️ Attempt already submitted/evaluated, skipping auto-submit');
      navigate('/student/results');
      return;
    }

    // Initialize progress dialog
    const steps: SubmissionStep[] = [
      { id: 'save', label: 'Saving your answers...', status: 'in-progress' },
      { id: 'submit', label: 'Submitting exam...', status: 'pending' },
      { id: 'evaluate', label: 'Evaluating your answers...', status: 'pending' },
      { id: 'complete', label: 'Finalizing results...', status: 'pending' },
    ];

    setSubmissionProgress({
      open: true,
      steps,
      currentStep: 0,
    });

    try {
      // Step 1: Save all answers
      console.log('Auto-submit: Ensuring all questions are saved...');
      console.log('Total questions to save:', questions.length);
      
      const totalQuestions = questions.length;
      const step1ProgressRange = 25; // Step 1 is 0% to 25%
      
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const questionId = question.question_id;
        const hasAnswer = isQuestionAnswered(questionId);
        const marks = question.question?.marks || 1;
        
        console.log(`Processing question ${i + 1}/${questions.length}:`, {
          display_order: question.display_order,
          question_id: questionId,
          has_answer: hasAnswer,
          marks: marks,
          answer: answers[questionId]
        });
        
        const answerData = {
          attempt_id: attempt.id,
          question_id: questionId,
          student_answer: answers[questionId] || null,
          marks_allocated: marks,
        };
        
        try {
          const savedAnswer = await examAnswerApi.saveAnswer(answerData);
          console.log(`✅ Auto-submit saved question ${question.display_order}:`, {
            status: hasAnswer ? 'answered' : 'unanswered',
            saved_id: savedAnswer?.id
          });
          
          // Update progress dynamically as each question is saved
          const currentProgress = ((i + 1) / totalQuestions) * step1ProgressRange;
          steps[0].label = `Saving your answers... (${i + 1}/${totalQuestions})`;
          setSubmissionProgress({
            open: true,
            steps: [...steps],
            currentStep: 0,
            progress: currentProgress,
          });
        } catch (saveError: any) {
          console.error(`❌ Auto-submit failed to save question ${question.display_order}:`, {
            error: saveError.message || saveError,
            question_id: questionId,
            attempt_id: attempt.id
          });
          // Continue saving other questions even if one fails
        }
      }
      
      // Step 1 Complete: Update progress
      steps[0].status = 'completed';
      steps[0].label = 'Saving your answers...';
      steps[1].status = 'in-progress';
      setSubmissionProgress({
        open: true,
        steps: [...steps],
        currentStep: 1,
        progress: 25,
      });
      
      // Verify all answers are saved
      console.log('Verifying saved answers...');
      const savedAnswers = await examAnswerApi.getAnswersByAttempt(attempt.id);
      console.log(`Verification: ${savedAnswers.length} of ${questions.length} questions saved`);
      
      if (savedAnswers.length < questions.length) {
        console.warn(`⚠️ WARNING: Only ${savedAnswers.length} of ${questions.length} questions saved!`);
        const savedQuestionIds = new Set(savedAnswers.map(a => a.question_id));
        const missingQuestions = questions.filter(q => !savedQuestionIds.has(q.question_id));
        console.error('Missing questions:', missingQuestions.map(q => ({
          display_order: q.display_order,
          question_id: q.question_id
        })));
      } else {
        console.log('✅ All questions saved successfully');
      }
      
      // Step 2: Submit exam (this triggers backend evaluation)
      steps[1].status = 'completed';
      steps[2].status = 'in-progress';
      setSubmissionProgress({
        open: true,
        steps: [...steps],
        currentStep: 2,
        progress: 50,
      });
      
      await examAttemptApi.submitAttempt(attempt.id, 'auto_submit');
      
      // Step 3: Evaluation complete (handled by backend)
      steps[2].status = 'completed';
      steps[3].status = 'in-progress';
      setSubmissionProgress({
        open: true,
        steps: [...steps],
        currentStep: 3,
        progress: 75,
      });
      
      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 4: Complete
      steps[3].status = 'completed';
      setSubmissionProgress({
        open: true,
        steps: [...steps],
        currentStep: 3,
        progress: 100,
      });
      
      // Small delay before redirect
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: 'Time Up!',
        description: 'Your exam has been automatically submitted and evaluated',
      });
      navigate('/student/results');
    } catch (error: any) {
      console.error('Auto-submit error:', error);
      
      // Update progress with error
      const errorSteps = steps.map(s => 
        s.status === 'in-progress' ? { ...s, status: 'error' as const } : s
      );
      setSubmissionProgress({
        open: true,
        steps: errorSteps,
        currentStep: steps.findIndex(s => s.status === 'in-progress'),
        error: error.message || 'Failed to submit exam. Please contact your teacher.',
      });
      
      // Close dialog after showing error
      setTimeout(() => {
        setSubmissionProgress({ open: false, steps: [], currentStep: 0 });
        toast({
          title: 'Submission Error',
          description: error.message || 'Failed to submit exam',
          variant: 'destructive',
        });
      }, 3000);
    }
  };

  const handleSubmit = async () => {
    if (!attempt) return;

    console.log('=== MANUAL SUBMIT ===');
    console.log('Attempt ID:', attempt.id);
    console.log('Attempt Status:', attempt.status);
    console.log('Answers in state:', answers);
    console.log('Answered questions:', Object.keys(answers).length);
    console.log('Total questions:', questions.length);
    console.log('====================');

    // Prevent double submission
    if (attempt.status === 'submitted' || attempt.status === 'evaluated') {
      console.warn('⚠️ Attempt already submitted/evaluated, skipping manual submit');
      toast({
        title: 'Already Submitted',
        description: 'This exam has already been submitted.',
        variant: 'destructive',
      });
      navigate('/student/results');
      return;
    }

    // Close confirmation dialog
    setSubmitDialogOpen(false);

    // Initialize progress dialog
    const steps: SubmissionStep[] = [
      { id: 'save', label: 'Saving your answers...', status: 'in-progress' },
      { id: 'submit', label: 'Submitting exam...', status: 'pending' },
      { id: 'evaluate', label: 'Evaluating your answers...', status: 'pending' },
      { id: 'complete', label: 'Finalizing results...', status: 'pending' },
    ];

    setSubmissionProgress({
      open: true,
      steps,
      currentStep: 0,
      progress: 0,
    });

    try {
      // Step 1: Save all answers
      console.log('Ensuring all questions are saved...');
      console.log('Total questions to save:', questions.length);
      
      const totalQuestions = questions.length;
      const step1ProgressRange = 25; // Step 1 is 0% to 25%
      
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const questionId = question.question_id;
        const hasAnswer = isQuestionAnswered(questionId);
        const marks = question.question?.marks || 1;
        
        console.log(`Processing question ${i + 1}/${questions.length}:`, {
          display_order: question.display_order,
          question_id: questionId,
          has_answer: hasAnswer,
          marks: marks,
          answer: answers[questionId]
        });
        
        // Save the question with its answer (or null if not answered)
        const answerData = {
          attempt_id: attempt.id,
          question_id: questionId,
          student_answer: answers[questionId] || null,
          marks_allocated: marks,
        };
        
        try {
          const savedAnswer = await examAnswerApi.saveAnswer(answerData);
          console.log(`✅ Saved question ${question.display_order}:`, {
            status: hasAnswer ? 'answered' : 'unanswered',
            saved_id: savedAnswer?.id
          });
          
          // Update progress dynamically as each question is saved
          const currentProgress = ((i + 1) / totalQuestions) * step1ProgressRange;
          steps[0].label = `Saving your answers... (${i + 1}/${totalQuestions})`;
          setSubmissionProgress({
            open: true,
            steps: [...steps],
            currentStep: 0,
            progress: currentProgress,
          });
        } catch (saveError: any) {
          console.error(`❌ Failed to save question ${question.display_order}:`, {
            error: saveError.message || saveError,
            question_id: questionId,
            attempt_id: attempt.id
          });
          // Continue saving other questions even if one fails
        }
      }
      
      // Step 1 Complete: Update progress
      steps[0].status = 'completed';
      steps[0].label = 'Saving your answers...';
      steps[1].status = 'in-progress';
      setSubmissionProgress({
        open: true,
        steps: [...steps],
        currentStep: 1,
        progress: 25,
      });
      
      // Verify all answers are saved
      console.log('Verifying saved answers...');
      const savedAnswers = await examAnswerApi.getAnswersByAttempt(attempt.id);
      console.log(`Verification: ${savedAnswers.length} of ${questions.length} questions saved`);
      
      if (savedAnswers.length < questions.length) {
        console.warn(`⚠️ WARNING: Only ${savedAnswers.length} of ${questions.length} questions saved!`);
        const savedQuestionIds = new Set(savedAnswers.map(a => a.question_id));
        const missingQuestions = questions.filter(q => !savedQuestionIds.has(q.question_id));
        console.error('Missing questions:', missingQuestions.map(q => ({
          display_order: q.display_order,
          question_id: q.question_id
        })));
      } else {
        console.log('✅ All questions saved successfully');
      }
      
      // Step 2: Submit exam (this triggers backend evaluation)
      steps[1].status = 'completed';
      steps[2].status = 'in-progress';
      setSubmissionProgress({
        open: true,
        steps: [...steps],
        currentStep: 2,
        progress: 50,
      });
      
      await examAttemptApi.submitAttempt(attempt.id, 'normal');
      
      // Step 3: Evaluation complete (handled by backend)
      steps[2].status = 'completed';
      steps[3].status = 'in-progress';
      setSubmissionProgress({
        open: true,
        steps: [...steps],
        currentStep: 3,
        progress: 75,
      });
      
      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 4: Complete
      steps[3].status = 'completed';
      setSubmissionProgress({
        open: true,
        steps: [...steps],
        currentStep: 3,
        progress: 100,
      });
      
      // Small delay before redirect
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: 'Success',
        description: 'Exam submitted and evaluated successfully',
      });
      navigate('/student/results');
    } catch (error: any) {
      console.error('❌ Submit failed:', error);
      
      // Update progress with error
      const errorSteps = steps.map(s => 
        s.status === 'in-progress' ? { ...s, status: 'error' as const } : s
      );
      setSubmissionProgress({
        open: true,
        steps: errorSteps,
        currentStep: steps.findIndex(s => s.status === 'in-progress'),
        error: error.message || 'Failed to submit exam. Please contact your teacher.',
      });
      
      // Close dialog after showing error
      setTimeout(() => {
        setSubmissionProgress({ open: false, steps: [], currentStep: 0 });
        toast({
          title: 'Submission Error',
          description: error.message || 'Failed to submit exam',
          variant: 'destructive',
        });
      }, 3000);
    }
  };

  const isQuestionAnswered = (questionId: string) => {
    const answer = answers[questionId];
    if (answer === undefined || answer === null) return false;
    if (typeof answer === 'string') return answer.trim().length > 0;
    if (Array.isArray(answer)) return answer.length > 0;
    return true;
  };

  const isQuestionSkipped = (questionId: string) => {
    return visitedQuestions.has(questionId) && !isQuestionAnswered(questionId);
  };

  // Helper function to get unanswered question numbers
  const getUnansweredQuestionNumbers = (): number[] => {
    return questions
      .filter(q => !isQuestionAnswered(q.question_id))
      .map(q => q.display_order)
      .sort((a, b) => a - b);
  };

  // Helper function to get skipped question numbers
  const getSkippedQuestionNumbers = (): number[] => {
    return questions
      .filter(q => isQuestionSkipped(q.question_id))
      .map(q => q.display_order)
      .sort((a, b) => a - b);
  };

  // Helper function to get not visited question numbers
  const getNotVisitedQuestionNumbers = (): number[] => {
    return questions
      .filter(q => !visitedQuestions.has(q.question_id))
      .map(q => q.display_order)
      .sort((a, b) => a - b);
  };

  // Loading state - exam data is being fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Exam truly not found (hard failure)
  if (!exam && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Exam not found</p>
          <Button onClick={() => navigate('/student/exams')} className="mt-4">
            Back to Exams
          </Button>
        </div>
      </div>
    );
  }

  // Questions are still loading (DO NOT treat as exam not found)
  if (exam && !questionsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  // Questions loaded but empty (no questions in question paper)
  if (exam && questionsLoaded && questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No questions found in this exam</p>
          <p className="text-sm text-muted-foreground mb-4">Please contact your teacher</p>
          <Button onClick={() => navigate('/student/exams')}>
            Back to Exams
          </Button>
        </div>
      </div>
    );
  }

  // Safety check: exam and questions must be loaded
  if (!exam || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load exam</p>
          <Button onClick={() => navigate('/student/exams')} className="mt-4">
            Back to Exams
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.question_id];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{exam.title}</h1>
              <p className="text-sm text-muted-foreground">
                {exam.class?.class_name} • {exam.subject?.subject_name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                timeRemaining < 300 ? 'bg-destructive text-destructive-foreground' : 'bg-muted'
              }`}>
                <Clock className="h-5 w-5" />
                <span className="font-mono text-lg font-bold">{formatSecondsToTime(timeRemaining)}</span>
              </div>
              <Button onClick={() => setSubmitDialogOpen(true)}>
                Submit Exam
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Question Loading Success Indicator */}
      {questionsLoaded && questions.length > 0 && (
        <div className="container mx-auto px-4 pt-4">
          <div className="p-3 bg-success/10 border border-success rounded-lg">
            <div className="flex items-center gap-2 text-success text-sm">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">
                ✅ {questions.length} questions loaded successfully
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </CardTitle>
                    {isQuestionSkipped(currentQuestion.question_id) && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                        Skipped
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline">
                    {currentQuestion.question?.marks} {currentQuestion.question?.marks === 1 ? 'mark' : 'marks'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose max-w-none">
                  <MathRenderer 
                    content={currentQuestion.question?.question_text || ''}
                    className="question-content text-lg"
                  />
                  {currentQuestion.question?.image_url && (
                    <img
                      src={currentQuestion.question.image_url}
                      alt="Question"
                      className="max-w-full h-auto rounded-md mt-4"
                    />
                  )}
                </div>

                <div className="space-y-4">
                  {currentQuestion.question?.question_type === 'mcq' && (
                    <RadioGroup
                      value={currentAnswer || ''}
                      onValueChange={(value) => handleAnswerChange(currentQuestion.question_id, value)}
                    >
                      {((currentQuestion.shuffled_options || currentQuestion.question?.options || []) as string[]).map((option: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted">
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                            <MathRenderer 
                              content={option}
                              className="question-content"
                            />
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {currentQuestion.question?.question_type === 'true_false' && (
                    <RadioGroup
                      value={currentAnswer || ''}
                      onValueChange={(value) => handleAnswerChange(currentQuestion.question_id, value)}
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted">
                        <RadioGroupItem value="True" id="true" />
                        <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted">
                        <RadioGroupItem value="False" id="false" />
                        <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                      </div>
                    </RadioGroup>
                  )}

                  {currentQuestion.question?.question_type === 'multiple_response' && (
                    <div className="space-y-4">
                      {/* Display main options (A, B, C, D) */}
                      {currentQuestion.question?.options && Array.isArray(currentQuestion.question.options) && (
                        <div className="space-y-2 mb-4 p-4 bg-muted/50 rounded-md">
                          <p className="text-sm font-medium mb-2">Options:</p>
                          {(currentQuestion.question.options as string[]).map((option: string, index: number) => (
                            <div key={index} className="text-sm pl-2">
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Display answer options (i, ii, iii, iv) as radio buttons */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium mb-2">Select the correct answer:</p>
                        <RadioGroup
                          value={currentAnswer || ''}
                          onValueChange={(value) => handleAnswerChange(currentQuestion.question_id, value)}
                        >
                          {(currentQuestion.shuffled_answer_options || currentQuestion.question?.answer_options || []).map((option: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted">
                              <RadioGroupItem value={option} id={`answer-option-${index}`} />
                              <Label htmlFor={`answer-option-${index}`} className="flex-1 cursor-pointer">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>
                  )}

                  {currentQuestion.question?.question_type === 'short_answer' && (
                    <Textarea
                      value={currentAnswer || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.question_id, e.target.value)}
                      placeholder="Type your answer here..."
                      rows={6}
                    />
                  )}

                  {currentQuestion.question?.question_type === 'match_following' && (
                    <div className="space-y-4">
                      {(() => {
                        const matchPairs = (currentQuestion.shuffled_options || currentQuestion.question?.options || []) as MatchPair[];
                        const leftItems = matchPairs.map(pair => pair.left);
                        const rightItems = matchPairs.map(pair => pair.right);
                        
                        // Parse current answer (JSON string) to object
                        let currentMatches: Record<string, string> = {};
                        try {
                          if (currentAnswer) {
                            currentMatches = JSON.parse(currentAnswer);
                          }
                        } catch (e) {
                          currentMatches = {};
                        }

                        return (
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                              Match the items from the left column with the appropriate items from the right column
                            </p>
                            {leftItems.map((leftItem, index) => (
                              <div key={index} className="flex items-center gap-4 p-3 border rounded-md">
                                <div className="flex-1 font-medium">{leftItem}</div>
                                <div className="text-muted-foreground">→</div>
                                <div className="flex-1">
                                  <Select
                                    value={currentMatches[leftItem] || ''}
                                    onValueChange={(value) => {
                                      const newMatches = { ...currentMatches, [leftItem]: value };
                                      handleAnswerChange(
                                        currentQuestion.question_id,
                                        JSON.stringify(newMatches)
                                      );
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a match" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {rightItems.map((rightItem, rightIndex) => (
                                        <SelectItem key={rightIndex} value={rightItem}>
                                          {rightItem}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Question Palette</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, index) => {
                    const answered = isQuestionAnswered(q.question_id);
                    const skipped = isQuestionSkipped(q.question_id);
                    const isCurrent = index === currentQuestionIndex;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`
                          aspect-square rounded-md flex items-center justify-center text-sm font-medium
                          transition-colors
                          ${isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : answered
                            ? 'bg-success text-success-foreground'
                            : skipped
                            ? 'bg-warning text-warning-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }
                        `}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-success"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-warning"></div>
                    <span>Skipped</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-muted"></div>
                    <span>Not Visited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-primary"></div>
                    <span>Current</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Total Questions:</span>
                      <span className="font-medium">{questions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Answered:</span>
                      <span className="font-medium text-success">
                        {questions.filter(q => isQuestionAnswered(q.question_id)).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skipped:</span>
                      <span className="font-medium text-warning">
                        {questions.filter(q => isQuestionSkipped(q.question_id)).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Not Visited:</span>
                      <span className="font-medium text-muted-foreground">
                        {questions.filter(q => !visitedQuestions.has(q.question_id)).length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>Are you sure you want to submit your exam?</p>
              
              {/* Summary Card */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="font-medium text-foreground">Summary:</div>
                <div className="flex justify-between text-sm">
                  <span>Total Questions:</span>
                  <span className="font-medium">{questions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Answered:</span>
                  <span className="font-medium text-success">
                    {questions.filter(q => isQuestionAnswered(q.question_id)).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Skipped:</span>
                  <span className="font-medium text-warning">
                    {getSkippedQuestionNumbers().length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Not Visited:</span>
                  <span className="font-medium text-muted-foreground">
                    {getNotVisitedQuestionNumbers().length}
                  </span>
                </div>
              </div>
              
              {/* Warning Banner for Skipped Questions */}
              {getSkippedQuestionNumbers().length > 0 && (
                <div className="p-4 bg-warning/10 border-2 border-warning rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-warning font-semibold">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>You have {getSkippedQuestionNumbers().length} skipped questions!</span>
                  </div>
                  
                  <div className="text-sm text-warning/90">
                    <p className="font-medium mb-1">Skipped Questions:</p>
                    <div className="flex flex-wrap gap-1">
                      {getSkippedQuestionNumbers().map(num => (
                        <Badge key={num} className="text-xs bg-warning text-warning-foreground">
                          #{num}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Warning Banner for Not Visited Questions */}
              {getNotVisitedQuestionNumbers().length > 0 && (
                <div className="p-4 bg-destructive/10 border-2 border-destructive rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-destructive font-semibold">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>Warning: You have {getNotVisitedQuestionNumbers().length} questions you haven't visited!</span>
                  </div>
                  
                  <div className="text-sm text-destructive/90">
                    <p className="font-medium mb-1">Not Visited Questions:</p>
                    <div className="flex flex-wrap gap-1">
                      {getNotVisitedQuestionNumbers().map(num => (
                        <Badge key={num} variant="destructive" className="text-xs">
                          #{num}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Warning Banner for All Unanswered Questions */}
              {getUnansweredQuestionNumbers().length > 0 && (
                <div className="space-y-2">
                  <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive/90">
                      ⚠️ All unanswered questions (skipped + not visited) will be marked as incorrect and you will receive 0 marks for them.
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => {
                      setSubmitDialogOpen(false);
                      // Jump to first unanswered question
                      const firstUnanswered = questions.findIndex(q => !isQuestionAnswered(q.question_id));
                      if (firstUnanswered !== -1) {
                        setCurrentQuestionIndex(firstUnanswered);
                      }
                    }}
                  >
                    Review Unanswered Questions
                  </Button>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Once submitted, you cannot change your answers.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSubmit}
              className={getUnansweredQuestionNumbers().length > 0 ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {getUnansweredQuestionNumbers().length > 0 ? 'Submit Anyway' : 'Submit Exam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submission Progress Dialog */}
      <SubmissionProgressDialog
        open={submissionProgress.open}
        steps={submissionProgress.steps}
        currentStep={submissionProgress.currentStep}
        error={submissionProgress.error}
      />
    </div>
  );
}
