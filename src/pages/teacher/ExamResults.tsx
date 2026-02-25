import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { examApi, examAttemptApi, profileApi } from '@/db/api';
import { ArrowLeft, Users, TrendingUp, Award, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import type { ExamWithDetails, StudentExamAllocation, Profile } from '@/types/types';
import { formatISTDateTime } from '@/utils/timezone';

// Helper function to format date as dd/mm/yyyy with time
const formatDateDDMMYYYY = (dateString: string): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  // Format time in 12-hour format with AM/PM
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  
  return `${day}/${month}/${year} at ${timeStr}`;
};

// Helper function to extract section letter from "Section A" format
const extractSectionLetter = (sectionName: string): string => {
  return sectionName.replace(/^Section\s+/i, '');
};

export default function ExamResults() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Get the source page from query parameter
  const fromPage = searchParams.get('from') || 'manage';
  const [exam, setExam] = useState<ExamWithDetails | null>(null);
  const [students, setStudents] = useState<StudentExamAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  // Load current profile to determine user role
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await profileApi.getCurrentProfile();
        setCurrentProfile(profile);
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    loadProfile();
  }, []);

  // Helper function to get the correct back URL
  const getBackUrl = () => {
    if (fromPage === 'analysis') {
      // Return to the appropriate analysis page based on user role
      if (currentProfile?.role === 'principal') {
        return '/principal/analyses/exam';
      }
      return '/teacher/analyses/exam';
    }
    return '/teacher/exams';
  };

  // Helper function to handle back navigation
  const handleBack = () => {
    navigate(getBackUrl());
  };

  useEffect(() => {
    if (examId) {
      loadExamResults();
    }
  }, [examId]);

  // Auto-refresh every 2 seconds when enabled
  useEffect(() => {
    if (!autoRefresh || !examId) return;

    const interval = setInterval(() => {
      loadExamResults();
    }, 2000); // 2 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, examId]);

  const handleBulkEvaluation = async () => {
    if (!students) return;
    
    const submittedAttempts = students
      .filter(s => s.attempt_id && s.status === 'submitted')
      .map(s => s.attempt_id!);
    
    if (submittedAttempts.length === 0) {
      toast({
        title: 'தகவல்',
        description: 'மதிப்பீடு செய்ய சமர்ப்பிக்கப்பட்ட தேர்வுகள் இல்லை',
      });
      return;
    }
    
    setProcessing(true);
    let successCount = 0;
    let failCount = 0;
    
    try {
      for (const attemptId of submittedAttempts) {
        try {
          await examAttemptApi.processSubmission(attemptId);
          successCount++;
        } catch (error) {
          console.error(`Failed to process attempt ${attemptId}:`, error);
          failCount++;
        }
      }
      
      toast({
        title: 'வெற்றி',
        description: `${successCount} தேர்வுகள் மதிப்பீடு செய்யப்பட்டன${failCount > 0 ? `, ${failCount} தோல்வி` : ''}`,
      });
      
      // Reload results
      await loadExamResults();
    } catch (error: any) {
      toast({
        title: 'பிழை',
        description: error.message || 'மதிப்பீடு செயலாக்கத்தில் பிழை',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const loadExamResults = async () => {
    try {
      if (!examId) return;

      const examData = await examApi.getExamById(examId);
      setExam(examData);

      // Auto-submit any expired attempts that are still in_progress
      // This handles cases where students closed browser before auto-submit triggered
      try {
        const autoSubmitResult = await examAttemptApi.autoSubmitExpiredAttempts(examId);
        if (autoSubmitResult.submitted_count > 0) {
          console.log(`Auto-submitted ${autoSubmitResult.submitted_count} expired attempts`);
        }
      } catch (autoSubmitError) {
        console.error('Error auto-submitting expired attempts:', autoSubmitError);
        // Don't fail the whole load if auto-submit fails
      }

      const studentsData = await examAttemptApi.getAllStudentsForExam(examId);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      
      setLastRefreshTime(new Date());
    } catch (error: any) {
      console.error('Error loading exam results:', error);
      // Only show error toast if not in initial loading state
      if (!loading) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load exam results',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadExamResults();
  };

  const calculateStats = () => {
    if (!students || students.length === 0) {
      return {
        totalStudents: 0,
        submitted: 0,
        evaluated: 0,
        passed: 0,
        failed: 0,
        avgPercentage: '0.00',
        attendanceRate: '0',
      };
    }

    const submitted = students.filter(s => s.status === 'submitted' || s.status === 'evaluated');
    const evaluated = students.filter(s => s.status === 'evaluated');
    const passed = evaluated.filter(s => s.result === 'pass');
    const avgPercentage = evaluated.length > 0
      ? evaluated.reduce((sum, s) => sum + s.percentage, 0) / evaluated.length
      : 0;

    return {
      totalStudents: students.length,
      submitted: submitted.length,
      evaluated: evaluated.length,
      passed: passed.length,
      failed: evaluated.length - passed.length,
      avgPercentage: avgPercentage.toFixed(2),
      attendanceRate: students.length > 0 
        ? ((submitted.length / students.length) * 100).toFixed(1)
        : '0',
    };
  };

  const stats = calculateStats();

  // Sort students by marks obtained (descending) and time taken (ascending)
  const sortedStudents = Array.isArray(students) ? [...students].sort((a, b) => {
    // Calculate time taken for each student (in milliseconds)
    const getTimeTaken = (student: StudentExamAllocation) => {
      if (!student.started_at || !student.submitted_at) return Infinity;
      return new Date(student.submitted_at).getTime() - new Date(student.started_at).getTime();
    };

    const aTimeTaken = getTimeTaken(a);
    const bTimeTaken = getTimeTaken(b);

    // Primary sort: Marks obtained (descending - highest first)
    // Students who haven't submitted get marks of -1 for sorting purposes (appear last)
    const aMarks = (a.status === 'evaluated' || a.status === 'submitted') ? a.total_marks_obtained : -1;
    const bMarks = (b.status === 'evaluated' || b.status === 'submitted') ? b.total_marks_obtained : -1;

    if (aMarks !== bMarks) {
      return bMarks - aMarks; // Descending order (highest marks first)
    }

    // Secondary sort: Time taken (ascending - shortest time first among same marks)
    return aTimeTaken - bTimeTaken;
  }) : [];

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

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Exam not found</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Exams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{exam.title}</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              {exam.class?.class_name} • {exam.subject?.subject_name}
              {autoRefresh && (
                <span className="ml-2">
                  • Last updated: {lastRefreshTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            {autoRefresh ? '⏸️ Manual' : '▶️ Auto'}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || autoRefresh}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing || autoRefresh ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {stats.submitted > stats.evaluated && (
            <Button 
              onClick={handleBulkEvaluation}
              disabled={processing}
              size="sm"
            >
              {processing ? 'Processing...' : 'Evaluate All'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="gradient-card-blue rounded-lg shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Students</CardTitle>
            <Users className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalStudents}</div>
            <p className="text-xs text-white/80">
              {stats.submitted} submitted • {stats.attendanceRate}% attendance
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card-blue rounded-lg shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Exams</CardTitle>
            <Award className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.submitted}</div>
            <p className="text-xs text-white/80">
              {stats.evaluated} evaluated
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card-blue rounded-lg shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.avgPercentage}%</div>
            <p className="text-xs text-white/80">
              {stats.passed} passed • {stats.failed} failed
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card-blue rounded-lg shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Pass Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.evaluated > 0 ? ((stats.passed / stats.evaluated) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-white/80">
              {stats.passed} of {stats.evaluated} students
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle>Student Results</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students allocated to this exam
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pl-4 pr-2 w-16">S.No</th>
                    <th className="text-left py-3 px-4">Student</th>
                    <th className="text-left py-3 px-4">Section</th>
                    <th className="text-left py-3 px-4">Started At</th>
                    <th className="text-left py-3 px-4">Submitted At</th>
                    <th className="text-right py-3 px-4">Marks Obtained</th>
                    <th className="text-right py-3 px-4">Time Taken</th>
                    <th className="text-right py-3 px-4">Percentage</th>
                    <th className="text-center py-3 px-4">Result</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((student, index) => {
                    // Calculate time taken
                    const timeTaken = student.started_at && student.submitted_at
                      ? Math.floor((new Date(student.submitted_at).getTime() - new Date(student.started_at).getTime()) / 1000 / 60)
                      : null;

                    return (
                      <tr key={student.student_id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 pl-4 pr-2 text-muted-foreground w-16">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => navigate(`/teacher/exams/${examId}/students/${student.student_id}?from=${fromPage}`)}
                            className="text-primary hover:underline font-medium text-left"
                          >
                            {student.student_name}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          {extractSectionLetter(student.section_name)}
                        </td>
                        <td className="py-3 px-4">
                          {student.started_at 
                            ? formatDateDDMMYYYY(student.started_at)
                            : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {student.submitted_at 
                            ? formatDateDDMMYYYY(student.submitted_at)
                            : '-'}
                        </td>
                        <td className="text-right py-3 px-4">
                          {student.status === 'evaluated' || student.status === 'submitted'
                            ? `${student.total_marks_obtained} / ${exam.total_marks}`
                            : '-'}
                        </td>
                        <td className="text-right py-3 px-4">
                          {timeTaken !== null
                            ? `${timeTaken} min`
                            : '-'}
                        </td>
                        <td className="text-right py-3 px-4">
                          {student.status === 'evaluated' || student.status === 'submitted'
                            ? `${student.percentage.toFixed(2)}%`
                            : '-'}
                        </td>
                        <td className="text-center py-3 px-4">
                          {student.result === 'pass' && (
                            <Badge variant="default" className="bg-secondary">Pass</Badge>
                          )}
                          {student.result === 'fail' && (
                            <Badge variant="destructive">Fail</Badge>
                          )}
                          {!student.result && '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              student.status === 'evaluated' ? 'default' :
                              student.status === 'submitted' ? 'secondary' :
                              student.status === 'in_progress' ? 'outline' :
                              'secondary'
                            } className={
                              student.status === 'not_started' ? 'bg-muted text-muted-foreground' : ''
                            }>
                              {student.status === 'not_started' && 'Not Attempted'}
                              {student.status === 'in_progress' && 'In Progress'}
                              {student.status === 'submitted' && 'Submitted'}
                              {student.status === 'evaluated' && 'Evaluated'}
                            </Badge>
                            {student.submission_type === 'manually_corrected' && (
                              <div 
                                className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-md text-xs font-medium"
                                title="This exam was recovered after a connection issue or browser closure"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                <span>Recovered</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
