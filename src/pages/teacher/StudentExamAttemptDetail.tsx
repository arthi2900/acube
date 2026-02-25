import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { examApi, examAttemptApi, examAnswerApi } from '@/db/api';
import { ArrowLeft, Award, CheckCircle2, XCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import type { ExamWithDetails, ExamAttempt, ExamAnswerWithDetails } from '@/types/types';
import { MathRenderer } from '@/components/ui/math-renderer';
import { formatISTDateTime } from '@/utils/timezone';

export default function StudentExamAttemptDetail() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [exam, setExam] = useState<ExamWithDetails | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [answers, setAnswers] = useState<ExamAnswerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState<string>('');

  useEffect(() => {
    if (attemptId) {
      loadResult();
    }
  }, [attemptId]);

  const loadResult = async () => {
    try {
      if (!attemptId) return;

      // Get attempt data first
      const attemptData = await examAttemptApi.getAttemptById(attemptId);
      if (!attemptData) {
        throw new Error('Exam attempt not found');
      }
      setAttempt(attemptData);
      
      // Get student name from location state or attempt data
      if (location.state?.studentName) {
        setStudentName(location.state.studentName);
      } else if (attemptData.student?.full_name) {
        setStudentName(attemptData.student.full_name);
      }

      // Get exam data
      const examData = await examApi.getExamById(attemptData.exam_id);
      setExam(examData);

      // Get answers
      const answersData = await examAnswerApi.getAnswersByAttempt(attemptData.id);
      setAnswers(answersData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load exam attempt details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Navigate back to Student Analysis page
    navigate('/teacher/analyses/student', { 
      state: { 
        returnFromDetail: true,
        expandedStudentId: location.state?.studentId 
      } 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading exam details...</p>
        </div>
      </div>
    );
  }

  if (!exam || !attempt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Exam Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The exam attempt you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Student Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPassed = attempt.result === 'pass';
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.is_correct).length;
  const incorrectAnswers = answers.filter(a => !a.is_correct && a.student_answer).length;
  const skippedQuestions = totalQuestions - correctAnswers - incorrectAnswers;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Student Analysis
          </Button>
          <Button onClick={() => window.print()}>Print Report</Button>
        </div>

        {/* Result Banner */}
        <Card className={isPassed ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {isPassed ? (
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold">
                  {isPassed ? 'Congratulations! You Passed' : 'You Did Not Pass'}
                </h2>
                <p className="text-muted-foreground">
                  {studentName && `Student: ${studentName} - `}
                  You have {isPassed ? 'successfully passed' : 'not passed'} this exam.
                </p>
              </div>
              <Button variant={isPassed ? 'default' : 'destructive'} size="lg" disabled>
                {isPassed ? 'PASS' : 'FAIL'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Score Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Marks</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exam.total_marks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marks Obtained</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attempt.total_marks_obtained || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Percentage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attempt.percentage?.toFixed(2)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passing Marks</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exam.passing_marks}</div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Score Progress</span>
                <span className="text-sm text-muted-foreground">
                  {correctAnswers} / {totalQuestions}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                  style={{ width: `${(correctAnswers / totalQuestions) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-green-500">{correctAnswers}</p>
                    <p className="text-xs text-muted-foreground">Correct Answers</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-red-500">{incorrectAnswers}</p>
                    <p className="text-xs text-muted-foreground">Incorrect Answers</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-muted" />
                  <div>
                    <p className="text-2xl font-bold text-muted-foreground">{skippedQuestions}</p>
                    <p className="text-xs text-muted-foreground">Skipped Questions</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exam Details */}
        <Card>
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-medium">{exam.class?.class_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="font-medium">{exam.subject?.subject_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Started At</p>
                <p className="font-medium">
                  {attempt.started_at ? formatISTDateTime(attempt.started_at) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted At</p>
                <p className="font-medium">
                  {attempt.submitted_at ? formatISTDateTime(attempt.submitted_at) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question-wise Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Question-wise Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {answers.map((answer, index) => {
                const question = answer.question;
                if (!question) return null;

                const studentAnswer = answer.student_answer;
                const isCorrect = answer.is_correct || false;
                const isSkipped = !studentAnswer;

                return (
                  <div
                    key={answer.id}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : isSkipped
                        ? 'border-muted bg-muted/50'
                        : 'border-red-500 bg-red-50 dark:bg-red-950'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Q{index + 1}</Badge>
                        <Badge variant={question.question_type === 'mcq' ? 'default' : 'secondary'}>
                          {question.question_type === 'mcq' ? 'MCQ' : question.question_type === 'true_false' ? 'True/False' : 'Short Answer'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                        </span>
                      </div>
                      {isCorrect ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Correct
                        </Badge>
                      ) : isSkipped ? (
                        <Badge variant="secondary">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Skipped
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Incorrect
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="font-medium mb-2">Question:</p>
                        <MathRenderer content={question.question_text} />
                      </div>

                      {question.question_type === 'mcq' && (
                        <div className="space-y-2">
                          <p className="font-medium">Options:</p>
                          {(question.options as string[])?.map((option, idx) => {
                            const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D
                            const isSelected = studentAnswer === optionLetter;
                            const isCorrectOption = question.correct_answer === optionLetter;

                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded border ${
                                  isCorrectOption
                                    ? 'border-green-500 bg-green-100 dark:bg-green-900'
                                    : isSelected
                                    ? 'border-red-500 bg-red-100 dark:bg-red-900'
                                    : 'border-border'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold">{optionLetter}.</span>
                                  <MathRenderer content={option} className="flex-1" />
                                  {isCorrectOption && (
                                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                  )}
                                  {isSelected && !isCorrectOption && (
                                    <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.question_type === 'true_false' && (
                        <div className="space-y-2">
                          <p className="font-medium">Options:</p>
                          {['True', 'False'].map((opt) => {
                            const isSelected = studentAnswer === opt;
                            const isCorrectOption = question.correct_answer === opt;

                            return (
                              <div
                                key={opt}
                                className={`p-3 rounded border ${
                                  isCorrectOption
                                    ? 'border-green-500 bg-green-100 dark:bg-green-900'
                                    : isSelected
                                    ? 'border-red-500 bg-red-100 dark:bg-red-900'
                                    : 'border-border'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{opt}</span>
                                  {isCorrectOption && (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  )}
                                  {isSelected && !isCorrectOption && (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.question_type === 'short_answer' && (
                        <div>
                          <p className="font-medium mb-2">Student Answer:</p>
                          <div className="p-3 rounded border bg-muted">
                            {studentAnswer || 'No answer provided'}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <p className="font-medium mb-1">Correct Answer:</p>
                        <p className="text-green-600 dark:text-green-400 font-semibold">
                          {question.correct_answer}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t text-sm">
                        <span className="text-muted-foreground">
                          Marks Obtained: <span className="font-semibold">{answer.marks_obtained || 0}</span> / {question.marks}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Student Analysis
          </Button>
          <Button onClick={() => window.print()}>Print Report</Button>
        </div>
      </div>
    </div>
  );
}
