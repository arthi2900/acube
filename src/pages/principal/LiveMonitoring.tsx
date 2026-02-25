import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { examAttemptApi } from '@/db/api';
import { useAuth } from '@/hooks/useAuth';
import { ExamWithDetails, ExamAttemptWithDetails, Profile } from '@/types/types';
import { RefreshCw, Clock, Users, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AttemptWithMonitoring = ExamAttemptWithDetails & {
  student: Profile;
  answers_count: number;
  total_questions: number;
  time_elapsed_minutes: number | null;
  time_remaining_minutes: number | null;
};

type ExamMonitoringData = {
  exam: ExamWithDetails | null;
  attempts: AttemptWithMonitoring[];
};

export default function LiveMonitoring() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ongoingExams, setOngoingExams] = useState<ExamWithDetails[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [monitoringData, setMonitoringData] = useState<ExamMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Load ongoing exams
  const loadOngoingExams = async () => {
    try {
      setRefreshing(true);
      const exams = await examAttemptApi.getOngoingExams(
        user?.role === 'teacher' ? user.id : undefined
      );
      setOngoingExams(exams);
      
      // If an exam is selected, refresh its data
      if (selectedExamId) {
        await loadExamMonitoringData(selectedExamId);
      } else if (exams.length > 0 && !selectedExamId) {
        // Auto-select first exam if none selected
        setSelectedExamId(exams[0].id);
      } else if (exams.length === 0) {
        // Clear selected exam if no exams available
        setSelectedExamId(null);
        setMonitoringData(null);
      }
      
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error loading ongoing exams:', error);
      // Only show error toast if not in initial loading state
      if (!loading) {
        toast({
          title: 'Error',
          description: 'Failed to load ongoing exams',
          variant: 'destructive',
        });
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Load monitoring data for selected exam
  const loadExamMonitoringData = async (examId: string) => {
    try {
      const data = await examAttemptApi.getExamMonitoringData(examId);
      setMonitoringData(data);
    } catch (error) {
      console.error('Error loading exam monitoring data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load exam monitoring data',
        variant: 'destructive',
      });
    }
  };

  // Initial load
  useEffect(() => {
    loadOngoingExams();
  }, [user]);

  // Load monitoring data when exam is selected
  useEffect(() => {
    if (selectedExamId) {
      loadExamMonitoringData(selectedExamId);
    }
  }, [selectedExamId]);

  // Auto-refresh every 5 seconds (only when there are ongoing exams)
  useEffect(() => {
    if (!autoRefresh || ongoingExams.length === 0) return;

    const interval = setInterval(() => {
      loadOngoingExams();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, selectedExamId, ongoingExams.length]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-blue-500">🟢 Active</Badge>;
      case 'submitted':
        return <Badge className="bg-green-500">✅ Submitted</Badge>;
      case 'not_started':
        return <Badge className="bg-yellow-500">🟡 Not Started</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Get submission type badge
  const getSubmissionTypeBadge = (submissionType: string | null) => {
    if (submissionType === 'auto_submit') {
      return <Badge variant="destructive">⏰ Auto-submitted</Badge>;
    }
    return null;
  };

  // Calculate statistics
  const getExamStats = (attempts: AttemptWithMonitoring[]) => {
    const total = attempts.length;
    const notStarted = attempts.filter(a => a.status === 'not_started').length;
    const active = attempts.filter(a => a.status === 'in_progress').length;
    const submitted = attempts.filter(a => a.status === 'submitted').length;

    return { total, notStarted, active, submitted };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (ongoingExams.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Live Exam Monitoring</h1>
            <p className="text-muted-foreground">Monitor ongoing exams in real-time</p>
          </div>
          <Button onClick={loadOngoingExams} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Ongoing Exams</h3>
            <p className="text-muted-foreground text-center">
              There are no exams currently in progress. Exams will appear here when they are active.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Auto-refresh is paused. Click Refresh to check for new exams.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = monitoringData ? getExamStats(monitoringData.attempts) : null;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Live Exam Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor ongoing exams in real-time • Last updated: {lastRefreshTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            disabled={ongoingExams.length === 0}
          >
            {autoRefresh ? '⏸️ Pause' : '▶️ Resume'} Auto-refresh
          </Button>
          <Button onClick={loadOngoingExams} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Ongoing Exams List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Exam List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Ongoing Exams ({ongoingExams.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ongoingExams.map((exam) => (
                <Button
                  key={exam.id}
                  variant={selectedExamId === exam.id ? 'default' : 'outline'}
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => setSelectedExamId(exam.id)}
                >
                  <div className="flex flex-col items-start gap-1 w-full">
                    <span className="font-semibold">{exam.title}</span>
                    <span className="text-xs opacity-80">
                      {exam.class?.class_name} - {exam.subject?.subject_name}
                    </span>
                    <span className="text-xs opacity-60">
                      {new Date(exam.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - {new Date(exam.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Monitoring Details */}
        <div className="lg:col-span-3">
          {monitoringData && monitoringData.exam && stats ? (
            <div className="space-y-6">
              {/* Exam Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{monitoringData.exam.title}</CardTitle>
                  <CardDescription>
                    {monitoringData.exam.class?.class_name} - {monitoringData.exam.subject?.subject_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-xs text-muted-foreground">Total Students</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold text-blue-500">{stats.active}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold text-green-500">{stats.submitted}</p>
                        <p className="text-xs text-muted-foreground">Submitted</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-2xl font-bold text-yellow-500">{stats.notStarted}</p>
                        <p className="text-xs text-muted-foreground">Not Started</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Students List */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Progress</CardTitle>
                  <CardDescription>Real-time monitoring of student exam progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monitoringData.attempts
                      .sort((a, b) => {
                        // Sort by status: active first, then submitted, then not started
                        const statusOrder = { in_progress: 0, submitted: 1, not_started: 2 };
                        const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
                        const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
                        if (aOrder !== bOrder) return aOrder - bOrder;
                        
                        // Within same status, sort by name
                        return (a.student?.full_name || '').localeCompare(b.student?.full_name || '');
                      })
                      .map((attempt) => (
                        <div
                          key={attempt.student_id}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{attempt.student?.full_name}</h4>
                                {getStatusBadge(attempt.status)}
                                {attempt.submission_type && getSubmissionTypeBadge(attempt.submission_type)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {attempt.student?.username}
                              </p>
                            </div>
                            {attempt.status === 'in_progress' && attempt.time_remaining_minutes !== null && (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4" />
                                <span className={attempt.time_remaining_minutes < 10 ? 'text-red-500 font-semibold' : ''}>
                                  {attempt.time_remaining_minutes} min left
                                </span>
                              </div>
                            )}
                          </div>

                          {attempt.status !== 'not_started' && (
                            <div className="space-y-2">
                              {/* Progress Bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Questions Answered: {attempt.answers_count} / {attempt.total_questions}
                                  </span>
                                  <span className="font-medium">
                                    {attempt.total_questions > 0
                                      ? Math.round((attempt.answers_count / attempt.total_questions) * 100)
                                      : 0}%
                                  </span>
                                </div>
                                <Progress
                                  value={
                                    attempt.total_questions > 0
                                      ? (attempt.answers_count / attempt.total_questions) * 100
                                      : 0
                                  }
                                />
                              </div>

                              {/* Time Info */}
                              <div className="flex gap-4 text-sm text-muted-foreground">
                                {attempt.started_at && (
                                  <span>Started: {new Date(attempt.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                )}
                                {attempt.submitted_at && (
                                  <span>Submitted: {new Date(attempt.submitted_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                )}
                                {attempt.time_elapsed_minutes !== null && (
                                  <span>Time Elapsed: {attempt.time_elapsed_minutes} min</span>
                                )}
                              </div>

                              {/* Marks (if submitted) */}
                              {attempt.status === 'submitted' && monitoringData.exam && (
                                <div className="flex gap-4 text-sm">
                                  <span className="font-semibold">
                                    Marks: {attempt.total_marks_obtained} / {monitoringData.exam.total_marks}
                                  </span>
                                  <span className="font-semibold">
                                    Percentage: {attempt.percentage?.toFixed(2)}%
                                  </span>
                                  {attempt.result && (
                                    <Badge variant={attempt.result === 'pass' ? 'default' : 'destructive'}>
                                      {attempt.result.toUpperCase()}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {attempt.status === 'not_started' && (
                            <p className="text-sm text-muted-foreground">
                              Student has not started the exam yet
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Select an exam to view monitoring details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
