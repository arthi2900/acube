import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, FileText, PlayCircle, CheckCircle2, ClockAlert } from 'lucide-react';
import type { ExamWithDetails } from '@/types/types';
import { hasExamStarted, hasExamEnded, formatISTDateTime } from '@/utils/timezone';
import { useStudentData } from '@/contexts/StudentDataContext';

export default function StudentExams() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter'); // 'current', 'upcoming', or null (show all)
  const { exams, attempts, loading, loadData } = useStudentData();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isExamAvailable = (exam: ExamWithDetails) => {
    return hasExamStarted(exam.start_time) && !hasExamEnded(exam.end_time);
  };

  const isExamUpcoming = (exam: ExamWithDetails) => {
    return !hasExamStarted(exam.start_time);
  };

  const isExamCompleted = (exam: ExamWithDetails) => {
    return hasExamEnded(exam.end_time);
  };

  const getExamStatus = (exam: ExamWithDetails) => {
    const attempt = attempts[exam.id];
    
    // If student has submitted or is being evaluated, show that status
    if (attempt) {
      if (attempt.status === 'submitted' || attempt.status === 'evaluated') {
        // Check if this was manually corrected
        if (attempt.submission_type === 'manually_corrected') {
          return { label: 'Submitted (Recovered)', variant: 'warning' as const, isManuallyRecovered: true };
        }
        return { label: 'Submitted', variant: 'secondary' as const, isManuallyRecovered: false };
      }
      if (attempt.status === 'in_progress') {
        return { label: 'In Progress', variant: 'default' as const, isManuallyRecovered: false };
      }
    }
    
    // Check if exam time has ended
    if (isExamCompleted(exam)) {
      // If no attempt exists, student missed the exam
      if (!attempt) {
        return { label: 'Missed', variant: 'destructive' as const, isManuallyRecovered: false };
      }
      // If attempt exists but not submitted, time expired
      return { label: 'Time Expired', variant: 'secondary' as const, isManuallyRecovered: false };
    }
    
    // Check if exam is currently available
    if (isExamAvailable(exam)) {
      return { label: 'Available', variant: 'default' as const, isManuallyRecovered: false };
    }
    
    // Check if exam is upcoming
    if (isExamUpcoming(exam)) {
      return { label: 'Upcoming', variant: 'outline' as const, isManuallyRecovered: false };
    }
    
    return { label: 'Unknown', variant: 'secondary' as const, isManuallyRecovered: false };
  };

  // Categorize exams into three groups
  const categorizeExams = () => {
    const now = new Date();
    const currentExams: ExamWithDetails[] = [];
    const upcomingExams: ExamWithDetails[] = [];
    const completedExams: ExamWithDetails[] = [];

    exams.forEach(exam => {
      const attempt = attempts[exam.id];
      const started = hasExamStarted(exam.start_time);
      const ended = hasExamEnded(exam.end_time);
      
      // Completed: submitted, evaluated, or time has ended
      if (attempt && (attempt.status === 'submitted' || attempt.status === 'evaluated')) {
        completedExams.push(exam);
      } else if (ended || isExamCompleted(exam)) {
        completedExams.push(exam);
      }
      // Current: exam has started but not ended
      else if (started && !ended) {
        currentExams.push(exam);
      }
      // Upcoming: exam hasn't started yet
      else if (!started) {
        upcomingExams.push(exam);
      }
    });

    // Sort upcoming exams by start time (ascending - soonest first)
    upcomingExams.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    // Sort current exams by end time (ascending - ending soonest first)
    currentExams.sort((a, b) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime());
    
    // Sort completed exams by end time (descending - most recent first)
    completedExams.sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime());

    return { currentExams, upcomingExams, completedExams };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading exams...</p>
        </div>
      </div>
    );
  }

  const { currentExams, upcomingExams, completedExams } = categorizeExams();

  // Apply filter based on URL parameter
  let filteredCurrentExams = currentExams;
  let filteredUpcomingExams = upcomingExams;
  
  if (filterParam === 'current') {
    // Show only current exams
    filteredUpcomingExams = [];
  } else if (filterParam === 'upcoming') {
    // Show only upcoming exams
    filteredCurrentExams = [];
  }
  // If no filter or 'all', show both

  // Combine current and upcoming exams for Card 1
  const activeExams = [...filteredCurrentExams, ...filteredUpcomingExams];

  // Render function for exam card details
  const renderExamCard = (exam: ExamWithDetails, showActions: boolean = true) => {
    const status = getExamStatus(exam);
    const available = isExamAvailable(exam);
    const attempt = attempts[exam.id];
    const inProgress = attempt && attempt.status === 'in_progress';
    const hasSubmitted = attempt && (attempt.status === 'submitted' || attempt.status === 'evaluated');
    const isUpcoming = isExamUpcoming(exam);

    return (
      <Card key={exam.id} className={!showActions ? "opacity-90" : ""}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>{exam.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{exam.class?.class_name}</span>
                <span>•</span>
                <span>{exam.subject?.subject_name}</span>
              </div>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Start</p>
                <p className="font-medium">{formatISTDateTime(exam.start_time)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">End</p>
                <p className="font-medium">{formatISTDateTime(exam.end_time)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">{exam.duration_minutes} minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Total Marks</p>
                <p className="font-medium">{exam.total_marks}</p>
              </div>
            </div>
          </div>

          {exam.instructions && (
            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Instructions:</p>
              <p className="text-sm text-muted-foreground">{exam.instructions}</p>
            </div>
          )}

          {showActions && (
            <div className="flex gap-2">
              {inProgress && available && (
                <Button onClick={() => navigate(`/student/exams/${exam.id}/take`)}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Continue Exam
                </Button>
              )}
              
              {!attempt && available && (
                <Button onClick={() => navigate(`/student/exams/${exam.id}/take`)}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Exam
                </Button>
              )}

              {isUpcoming && (
                <Button disabled>
                  <ClockAlert className="h-4 w-4 mr-2" />
                  Exam not yet available
                </Button>
              )}

              {hasSubmitted && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/student/exams/${exam.id}/result`)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  View Result
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {filterParam === 'current' ? 'Current Exams' : filterParam === 'upcoming' ? 'Upcoming Exams' : 'My Exams'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {filterParam === 'current' 
              ? 'Take your ongoing exams' 
              : filterParam === 'upcoming' 
              ? 'View your scheduled exams' 
              : 'View and take your assigned exams'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/student')}>
          Back to Dashboard
        </Button>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No exams available</h3>
            <p className="text-muted-foreground text-center">
              You don't have any exams assigned yet. Check back later.
            </p>
          </CardContent>
        </Card>
      ) : activeExams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {filterParam === 'current' ? 'No ongoing exams' : filterParam === 'upcoming' ? 'No upcoming exams' : 'No exams available'}
            </h3>
            <p className="text-muted-foreground text-center">
              {filterParam === 'current' 
                ? 'You don\'t have any exams in progress right now.' 
                : filterParam === 'upcoming' 
                ? 'You don\'t have any scheduled exams at the moment.' 
                : 'Check back later for new exams.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Current Exams Section */}
          {filteredCurrentExams.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary" />
                Current Exams
              </h3>
              {filteredCurrentExams.map((exam) => renderExamCard(exam, true))}
            </div>
          )}

          {/* Upcoming Exams Section */}
          {filteredUpcomingExams.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Upcoming Exams
              </h3>
              {filteredUpcomingExams.map((exam) => renderExamCard(exam, true))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
