import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { examApi, profileApi, examAttemptApi } from '@/db/api';
import { ArrowLeft, Plus, Calendar, Clock, Users, FileText, Trash2, ShieldAlert, CalendarClock } from 'lucide-react';
import type { ExamWithDetails, Profile } from '@/types/types';
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
import { ForceDeleteDialog } from '@/components/ui/force-delete-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function ManageExams() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exams, setExams] = useState<ExamWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [forceDeleteDialogOpen, setForceDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<ExamWithDetails | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [checkingAttempts, setCheckingAttempts] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [examToReschedule, setExamToReschedule] = useState<ExamWithDetails | null>(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const profile = await profileApi.getCurrentProfile();
      if (!profile) throw new Error('Profile not found');

      setCurrentProfile(profile);
      
      // Principal and Admin see all exams in their school
      // Teachers see only their own exams
      let data: ExamWithDetails[];
      if (profile.role === 'principal' || profile.role === 'admin') {
        if (!profile.school_id) throw new Error('School ID not found');
        data = await examApi.getExamsBySchool(profile.school_id);
      } else {
        data = await examApi.getExamsByTeacher(profile.id);
      }
      
      setExams(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load exams',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const canForceDelete = currentProfile?.role === 'principal' || currentProfile?.role === 'admin';
  
  // Helper function to check if user can delete an exam
  const canDeleteExam = (exam: ExamWithDetails): boolean => {
    if (!currentProfile) return false;
    
    // Principal and Admin can delete any exam in their school
    if (currentProfile.role === 'principal' || currentProfile.role === 'admin') {
      return true;
    }
    
    // Teachers can only delete their own exams
    return exam.teacher_id === currentProfile.id;
  };

  const handleDeleteClick = async (exam: ExamWithDetails) => {
    setCheckingAttempts(true);
    setExamToDelete(exam);
    
    try {
      // Check if any students have attempted this exam
      const attempts = await examAttemptApi.getAttemptsByExam(exam.id);
      const validAttempts = Array.isArray(attempts) ? attempts : [];
      setAttemptCount(validAttempts.length);
      
      if (validAttempts.length > 0) {
        // Show error toast if students have attempted
        toast({
          title: 'Cannot Delete Exam',
          description: `${validAttempts.length} student(s) have already attempted this exam.`,
          variant: 'destructive',
        });
        setExamToDelete(null);
      } else {
        // Open confirmation dialog if no attempts
        setDeleteDialogOpen(true);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check exam attempts',
        variant: 'destructive',
      });
      setExamToDelete(null);
    } finally {
      setCheckingAttempts(false);
    }
  };

  const handleDelete = async () => {
    if (!examToDelete) return;

    setIsDeleting(true);
    try {
      await examApi.deleteExam(examToDelete.id);
      toast({
        title: 'Success',
        description: 'Exam deleted successfully',
      });
      loadExams();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete exam',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setExamToDelete(null);
      setAttemptCount(0);
      setIsDeleting(false);
    }
  };

  const handleForceDeleteClick = async (exam: ExamWithDetails) => {
    setCheckingAttempts(true);
    setExamToDelete(exam);
    
    try {
      const attempts = await examAttemptApi.getAttemptsByExam(exam.id);
      const validAttempts = Array.isArray(attempts) ? attempts : [];
      setAttemptCount(validAttempts.length);
      setForceDeleteDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check exam attempts',
        variant: 'destructive',
      });
      setExamToDelete(null);
    } finally {
      setCheckingAttempts(false);
    }
  };

  const handleForceDelete = async () => {
    if (!examToDelete) return;

    setIsDeleting(true);
    try {
      const result = await examApi.forceDeleteExam(examToDelete.id);
      toast({
        title: 'Success',
        description: result.message || 'Exam and all associated data deleted successfully',
      });
      loadExams();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to force delete exam',
        variant: 'destructive',
      });
    } finally {
      setForceDeleteDialogOpen(false);
      setExamToDelete(null);
      setAttemptCount(0);
      setIsDeleting(false);
    }
  };

  const handleRescheduleClick = (exam: ExamWithDetails) => {
    setExamToReschedule(exam);
    // Convert UTC to local datetime-local format
    const startDate = new Date(exam.start_time);
    const endDate = new Date(exam.end_time);
    
    // Format: YYYY-MM-DDTHH:mm
    const formatDateTimeLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setNewStartTime(formatDateTimeLocal(startDate));
    setNewEndTime(formatDateTimeLocal(endDate));
    setRescheduleDialogOpen(true);
  };

  const handleReschedule = async () => {
    if (!examToReschedule) return;

    // Validation
    if (!newStartTime || !newEndTime) {
      toast({
        title: 'Error',
        description: 'Please select both start and end times',
        variant: 'destructive',
      });
      return;
    }

    const startDate = new Date(newStartTime);
    const endDate = new Date(newEndTime);
    const now = new Date();

    if (startDate <= now) {
      toast({
        title: 'Error',
        description: 'Start time must be in the future',
        variant: 'destructive',
      });
      return;
    }

    if (endDate <= startDate) {
      toast({
        title: 'Error',
        description: 'End time must be after start time',
        variant: 'destructive',
      });
      return;
    }

    setIsRescheduling(true);
    try {
      await examApi.updateExam(examToReschedule.id, {
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
      });
      
      toast({
        title: 'Success',
        description: 'Exam rescheduled successfully',
      });
      
      setRescheduleDialogOpen(false);
      setExamToReschedule(null);
      setNewStartTime('');
      setNewEndTime('');
      loadExams();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reschedule exam',
        variant: 'destructive',
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      pending_approval: { variant: 'outline', label: 'Pending Approval' },
      approved: { variant: 'default', label: 'Approved' },
      published: { variant: 'default', label: 'Published' },
      completed: { variant: 'secondary', label: 'Completed' },
    };
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Categorize exams into Completed, Current, and Upcoming
  type ExamCategory = 'completed' | 'current' | 'upcoming';
  
  const categorizeExam = (exam: ExamWithDetails): ExamCategory => {
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);

    // Completed: exam end time has passed
    if (now > endTime) {
      return 'completed';
    }
    
    // Current: exam is ongoing (between start and end time)
    if (now >= startTime && now <= endTime) {
      return 'current';
    }
    
    // Upcoming: exam hasn't started yet
    return 'upcoming';
  };

  const getCategoryColor = (category: ExamCategory) => {
    switch (category) {
      case 'completed':
        return 'border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20';
      case 'current':
        return 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'upcoming':
        return 'border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20';
    }
  };

  const getCategoryBadge = (category: ExamCategory) => {
    switch (category) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">✓ Completed</Badge>;
      case 'current':
        return <Badge className="bg-blue-500 hover:bg-blue-600">● Current</Badge>;
      case 'upcoming':
        return <Badge className="bg-orange-500 hover:bg-orange-600">◷ Upcoming</Badge>;
    }
  };

  // Group exams by category
  const categorizedExams = {
    current: exams.filter(exam => categorizeExam(exam) === 'current'),
    upcoming: exams.filter(exam => categorizeExam(exam) === 'upcoming'),
    completed: exams.filter(exam => categorizeExam(exam) === 'completed'),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/teacher')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Manage Exams</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all your exams
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/teacher/exams/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Exam
        </Button>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No exams found</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't created any exams yet. Create your first exam to get started.
            </p>
            <Button onClick={() => navigate('/teacher/exams/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Current Exams Section */}
          {categorizedExams.current.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
                <h2 className="text-2xl font-bold">Current Exams</h2>
                <Badge variant="secondary">{categorizedExams.current.length}</Badge>
              </div>
              <div className="grid gap-4">
                {categorizedExams.current.map((exam) => {
                  const category = categorizeExam(exam);
                  return (
                    <Card key={exam.id} className={getCategoryColor(category)}>
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
                          <div className="flex gap-2">
                            {getCategoryBadge(category)}
                            {getStatusBadge(exam.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm">
                              <p className="text-muted-foreground">Start</p>
                              <p className="font-medium">{formatDateTime(exam.start_time)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm">
                              <p className="text-muted-foreground">End</p>
                              <p className="font-medium">{formatDateTime(exam.end_time)}</p>
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

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/teacher/exams/${exam.id}/results?from=manage`)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Results
                          </Button>
                          {exam.status !== 'completed' && canDeleteExam(exam) && (
                            <>
                              {canForceDelete ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={checkingAttempts}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      {checkingAttempts ? 'Checking...' : 'Delete'}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDeleteClick(exam)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Exam
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleForceDeleteClick(exam)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <ShieldAlert className="h-4 w-4 mr-2" />
                                      Force Delete Exam
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteClick(exam)}
                                  disabled={checkingAttempts}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {checkingAttempts ? 'Checking...' : 'Delete'}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Exams Section */}
          {categorizedExams.upcoming.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-orange-500 rounded-full"></div>
                <h2 className="text-2xl font-bold">Upcoming Exams</h2>
                <Badge variant="secondary">{categorizedExams.upcoming.length}</Badge>
              </div>
              <div className="grid gap-4">
                {categorizedExams.upcoming.map((exam) => {
                  const category = categorizeExam(exam);
                  return (
                    <Card key={exam.id} className={getCategoryColor(category)}>
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
                          <div className="flex gap-2">
                            {getCategoryBadge(category)}
                            {getStatusBadge(exam.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm">
                              <p className="text-muted-foreground">Start</p>
                              <p className="font-medium">{formatDateTime(exam.start_time)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm">
                              <p className="text-muted-foreground">End</p>
                              <p className="font-medium">{formatDateTime(exam.end_time)}</p>
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

                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleRescheduleClick(exam)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <CalendarClock className="h-4 w-4 mr-2" />
                            Re-Schedule
                          </Button>
                          {exam.status !== 'completed' && canDeleteExam(exam) && (
                            <>
                              {canForceDelete ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={checkingAttempts}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      {checkingAttempts ? 'Checking...' : 'Delete'}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDeleteClick(exam)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Exam
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleForceDeleteClick(exam)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <ShieldAlert className="h-4 w-4 mr-2" />
                                      Force Delete Exam
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteClick(exam)}
                                  disabled={checkingAttempts}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {checkingAttempts ? 'Checking...' : 'Delete'}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Exams Section */}
          {categorizedExams.completed.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-green-500 rounded-full"></div>
                <h2 className="text-2xl font-bold">Completed Exams</h2>
                <Badge variant="secondary">{categorizedExams.completed.length}</Badge>
              </div>
              <div className="grid gap-4">
                {categorizedExams.completed.map((exam) => {
                  const category = categorizeExam(exam);
                  return (
                    <Card key={exam.id} className={getCategoryColor(category)}>
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
                          <div className="flex gap-2">
                            {getCategoryBadge(category)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm">
                              <p className="text-muted-foreground">Start</p>
                              <p className="font-medium">{formatDateTime(exam.start_time)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm">
                              <p className="text-muted-foreground">End</p>
                              <p className="font-medium">{formatDateTime(exam.end_time)}</p>
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

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/teacher/exams/${exam.id}/results?from=manage`)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Results
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Are you sure you want to delete '{examToDelete?.title}'? This action cannot be undone.
                </p>
                {examToDelete && (
                  <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                    <p className="font-semibold">Exam Details:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Class: {examToDelete.class?.class_name}</li>
                      <li>• Subject: {examToDelete.subject?.subject_name}</li>
                      <li>• Created: {formatDateTime(examToDelete.created_at)}</li>
                      <li>• Status: {examToDelete.status}</li>
                      <li>• Student Attempts: {attemptCount}</li>
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Exam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ForceDeleteDialog
        open={forceDeleteDialogOpen}
        onOpenChange={setForceDeleteDialogOpen}
        onConfirm={handleForceDelete}
        title="Force Delete Exam"
        itemName={examToDelete?.title || ''}
        isDeleting={isDeleting}
        details={
          examToDelete && (
            <>
              <p className="font-semibold">Exam Details:</p>
              <ul className="space-y-1 ml-4">
                <li>• Class: {examToDelete.class?.class_name}</li>
                <li>• Subject: {examToDelete.subject?.subject_name}</li>
                <li>• Created: {formatDateTime(examToDelete.created_at)}</li>
                <li>• Status: {examToDelete.status}</li>
                <li>• Student Attempts: <span className="font-bold text-destructive">{attemptCount}</span></li>
              </ul>
              {attemptCount > 0 && (
                <p className="text-sm text-destructive font-medium mt-2">
                  ⚠️ This will delete {attemptCount} student attempt{attemptCount > 1 ? 's' : ''} and all associated answers and results.
                </p>
              )}
            </>
          )
        }
      />

      {/* Re-Schedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Re-Schedule Exam</DialogTitle>
            <DialogDescription>
              Update the start and end times for '{examToReschedule?.title}'
            </DialogDescription>
          </DialogHeader>
          
          {examToReschedule && (
            <div className="space-y-4">
              {/* Current Schedule Info */}
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <p className="font-semibold">Current Schedule:</p>
                <div className="space-y-1 ml-2">
                  <p>• Start: {formatDateTime(examToReschedule.start_time)}</p>
                  <p>• End: {formatDateTime(examToReschedule.end_time)}</p>
                </div>
              </div>

              {/* New Schedule Inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-start-time">New Start Time</Label>
                  <Input
                    id="new-start-time"
                    type="datetime-local"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    disabled={isRescheduling}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-end-time">New End Time</Label>
                  <Input
                    id="new-end-time"
                    type="datetime-local"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    disabled={isRescheduling}
                  />
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ Students will see the updated schedule immediately. Make sure to inform them about the change.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRescheduleDialogOpen(false);
                setExamToReschedule(null);
                setNewStartTime('');
                setNewEndTime('');
              }}
              disabled={isRescheduling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={isRescheduling}
            >
              {isRescheduling ? 'Rescheduling...' : 'Confirm Re-Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
