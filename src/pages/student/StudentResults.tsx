import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { examAttemptApi, profileApi, examApi } from '@/db/api';
import { supabase } from '@/db/supabase';
import { Award, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import type { ExamAttemptWithDetails } from '@/types/types';
import { formatISTDateTimeSeparate } from '@/utils/timezone';

interface ExamResultSummary {
  id: string;
  examId: string;
  examTitle: string;
  subjectName: string;
  subjectId: string;
  status: 'completed' | 'missed' | 'recovered';
  dateTime: string | null;
  timeTaken: string;
  marksObtained: number | null;
  totalMarks: number;
  percentage: number;
  result: string | null;
  attemptId?: string;
}

export default function StudentResults() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [examSummaries, setExamSummaries] = useState<ExamResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const profile = await profileApi.getCurrentProfile();
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Query student's class assignment directly
      const { data: classAssignments, error: classError } = await supabase
        .from('student_class_sections')
        .select('class_id')
        .eq('student_id', profile.id)
        .limit(1);

      if (classError) throw classError;

      if (!classAssignments || classAssignments.length === 0) {
        setExamSummaries([]);
        setLoading(false);
        return;
      }

      const studentClassId = classAssignments[0].class_id;

      // Get all completed exams for the student's class (exams that have ended)
      const completedExams = await examApi.getCompletedExamsForStudentClass(studentClassId);
      
      // Get all attempts by the student
      const attempts = await examAttemptApi.getAttemptsByStudent(profile.id);

      // Create a map of attempts by exam_id
      const attemptsMap = new Map<string, ExamAttemptWithDetails>();
      attempts.forEach(attempt => {
        attemptsMap.set(attempt.exam_id, attempt);
      });

      // Create a set of exam IDs we've already processed
      const processedExamIds = new Set<string>();

      // Process each exam to determine status
      const summaries: ExamResultSummary[] = [];

      // First, process submitted attempts for exams that haven't ended yet
      // This ensures students see their results immediately after submission
      for (const attempt of attempts) {
        // Skip if not submitted/evaluated
        if (attempt.status !== 'submitted' && attempt.status !== 'evaluated') {
          continue;
        }

        // Get exam details from the attempt
        const exam = attempt.exam;
        if (!exam) continue;

        // Only include if exam is for the student's class
        if (exam.class_id !== studentClassId) continue;

        // Check if exam has ended - if not, include it here
        const examEndTime = new Date(exam.end_time);
        const now = new Date();
        
        if (examEndTime > now) {
          // Exam hasn't ended yet, but student has submitted
          processedExamIds.add(attempt.exam_id);

          const summary: ExamResultSummary = {
            id: attempt.id,
            examId: exam.id,
            examTitle: exam.title,
            subjectName: exam.subject?.subject_name || '-',
            subjectId: exam.subject?.id || '',
            status: 'completed',
            dateTime: attempt.submitted_at,
            timeTaken: calculateTimeTaken(attempt.started_at, attempt.submitted_at),
            marksObtained: attempt.total_marks_obtained,
            totalMarks: exam.total_marks,
            percentage: attempt.percentage,
            result: attempt.result,
            attemptId: attempt.id,
          };

          summaries.push(summary);
        }
      }

      // Second, process all completed exams (exams that have ended)
      for (const exam of completedExams) {
        // Skip if already processed
        if (processedExamIds.has(exam.id)) {
          continue;
        }

        const attempt = attemptsMap.get(exam.id);
        processedExamIds.add(exam.id);
        
        let summary: ExamResultSummary;

        if (attempt && (attempt.status === 'submitted' || attempt.status === 'evaluated')) {
          // Completed exam
          summary = {
            id: attempt.id,
            examId: exam.id,
            examTitle: exam.title,
            subjectName: exam.subject?.subject_name || '-',
            subjectId: exam.subject?.id || '',
            status: 'completed',
            dateTime: attempt.submitted_at,
            timeTaken: calculateTimeTaken(attempt.started_at, attempt.submitted_at),
            marksObtained: attempt.total_marks_obtained,
            totalMarks: exam.total_marks,
            percentage: attempt.percentage,
            result: attempt.result,
            attemptId: attempt.id,
          };
        } else {
          // Missed exam (exam ended but not submitted)
          summary = {
            id: `missed-${exam.id}`,
            examId: exam.id,
            examTitle: exam.title,
            subjectName: exam.subject?.subject_name || '-',
            subjectId: exam.subject?.id || '',
            status: 'missed',
            dateTime: exam.end_time,
            timeTaken: '-',
            marksObtained: null,
            totalMarks: exam.total_marks,
            percentage: 0,
            result: null,
          };
        }

        summaries.push(summary);
      }

      // Sort by date (most recent first)
      summaries.sort((a, b) => {
        const dateA = a.dateTime ? new Date(a.dateTime).getTime() : 0;
        const dateB = b.dateTime ? new Date(b.dateTime).getTime() : 0;
        return dateB - dateA;
      });

      setExamSummaries(summaries);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load results',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeTaken = (startedAt: string | null, submittedAt: string | null): string => {
    if (!startedAt || !submittedAt) return '-';
    
    const start = new Date(startedAt);
    const end = new Date(submittedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  // Get unique subjects from summaries
  const subjects = useMemo(() => {
    const uniqueSubjects = new Map<string, string>();
    examSummaries.forEach((summary) => {
      if (summary.subjectId && summary.subjectName) {
        uniqueSubjects.set(summary.subjectId, summary.subjectName);
      }
    });
    return Array.from(uniqueSubjects, ([id, name]) => ({ id, name }));
  }, [examSummaries]);

  // Filter summaries based on selected subject
  const filteredSummaries = useMemo(() => {
    if (selectedSubject === 'all') {
      return examSummaries;
    }
    return examSummaries.filter((summary) => summary.subjectId === selectedSubject);
  }, [examSummaries, selectedSubject]);

  // Calculate statistics
  const stats = useMemo(() => {
    const completed = filteredSummaries.filter(s => s.status === 'completed');
    const missed = filteredSummaries.filter(s => s.status === 'missed');
    const recovered = filteredSummaries.filter(s => s.status === 'recovered');
    
    const totalExams = filteredSummaries.length;
    const completedCount = completed.length;
    const missedCount = missed.length;
    const recoveredCount = recovered.length;
    
    const averageScore = completedCount > 0
      ? completed.reduce((sum, s) => sum + s.percentage, 0) / completedCount
      : 0;
    
    const passedCount = completed.filter(s => s.result === 'pass').length;
    const passRate = completedCount > 0 ? (passedCount / completedCount) * 100 : 0;
    
    return {
      totalExams,
      completedCount,
      missedCount,
      recoveredCount,
      averageScore,
      passedCount,
      passRate,
    };
  }, [filteredSummaries]);

  const getResultBadge = (status: 'completed' | 'missed' | 'recovered', result: string | null, percentage: number) => {
    if (status === 'missed') {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Missed</Badge>;
    }
    
    if (status === 'recovered') {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-200">Recovered</Badge>;
    }
    
    if (!result) {
      return <Badge variant="secondary">Pending</Badge>;
    }
    
    if (result === 'pass') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-200">Pass</Badge>;
    } else {
      return <Badge variant="destructive">Fail</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Results</h1>
            <p className="text-muted-foreground mt-2">
              View your exam performance and detailed analysis
            </p>
          </div>
          {subjects.length > 0 && (
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button variant="outline" onClick={() => navigate('/student')}>
          Back to Dashboard
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExams}</div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-medium text-foreground">{stats.completedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Missed:</span>
                <span className="font-medium text-destructive">{stats.missedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Recovered:</span>
                <span className="font-medium text-foreground">{stats.recoveredCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {stats.completedCount} completed exam{stats.completedCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.passRate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.passedCount} of {stats.completedCount} passed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSummaries.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedSubject === 'all' 
                  ? 'No exam results available yet'
                  : 'No exam results available for the selected subject'}
              </p>
              {selectedSubject === 'all' ? (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/student/exams')}
                >
                  View Available Exams
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSelectedSubject('all')}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">S.No</TableHead>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Time Taken</TableHead>
                    <TableHead>Marks Obtained</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummaries.map((summary, index) => {
                    const dateTime = summary.dateTime
                      ? formatISTDateTimeSeparate(summary.dateTime)
                      : { date: '-', time: '' };
                    
                    return (
                      <TableRow 
                        key={summary.id}
                        className={summary.status === 'missed' ? 'bg-destructive/5' : ''}
                      >
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{dateTime.date}</div>
                            <div className="text-xs text-muted-foreground">{dateTime.time}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {summary.examTitle}
                          </div>
                        </TableCell>
                        <TableCell>{summary.subjectName}</TableCell>
                        <TableCell>
                          {summary.timeTaken}
                        </TableCell>
                        <TableCell>
                          {summary.status === 'missed' ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <>
                              <span className="font-medium">
                                {summary.marksObtained !== null
                                  ? summary.marksObtained
                                  : '-'}
                              </span>
                              {' / '}
                              {summary.totalMarks}
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                          {summary.status === 'missed' ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <span className="font-medium">
                              {summary.percentage.toFixed(2)}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getResultBadge(summary.status, summary.result, summary.percentage)}
                        </TableCell>
                        <TableCell className="text-right">
                          {summary.status === 'completed' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/student/exams/${summary.examId}/result`)}
                            >
                              View Details
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">No details</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
