import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { examApi, profileApi } from '@/db/api';
import { ArrowLeft, Calendar, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';
import type { ExamWithDetails } from '@/types/types';
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

export default function ExamApprovals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exams, setExams] = useState<ExamWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  useEffect(() => {
    loadPendingExams();
  }, []);

  const loadPendingExams = async () => {
    try {
      const profile = await profileApi.getCurrentProfile();
      if (!profile || !profile.school_id) {
        throw new Error('School information not found');
      }

      const data = await examApi.getExamsBySchool(profile.school_id);
      const pending = data.filter(exam => exam.status === 'pending_approval');
      setExams(pending);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load pending exams',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedExam) return;

    try {
      const profile = await profileApi.getCurrentProfile();
      if (!profile) throw new Error('Profile not found');

      await examApi.approveExam(selectedExam, profile.id);
      await examApi.publishExam(selectedExam);

      toast({
        title: 'Success',
        description: 'Exam approved and published successfully',
      });

      loadPendingExams();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve exam',
        variant: 'destructive',
      });
    } finally {
      setApproveDialogOpen(false);
      setSelectedExam(null);
    }
  };

  const handleReject = async () => {
    if (!selectedExam) return;

    try {
      await examApi.updateExamStatus(selectedExam, 'draft');

      toast({
        title: 'Success',
        description: 'Exam rejected and returned to draft',
      });

      loadPendingExams();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject exam',
        variant: 'destructive',
      });
    } finally {
      setRejectDialogOpen(false);
      setSelectedExam(null);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pending exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/principal')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Exam Approvals</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve school-level exams
          </p>
        </div>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pending approvals</h3>
            <p className="text-muted-foreground text-center">
              All exams have been reviewed. New exam requests will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{exam.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{exam.class?.class_name}</span>
                      <span>•</span>
                      <span>{exam.subject?.subject_name}</span>
                      <span>•</span>
                      <span>Created by {exam.teacher?.full_name || exam.teacher?.username}</span>
                    </div>
                  </div>
                  <Badge variant="outline">Pending Approval</Badge>
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

                {exam.instructions && (
                  <div className="mb-4 p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-1">Instructions:</p>
                    <p className="text-sm text-muted-foreground">{exam.instructions}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedExam(exam.id);
                      setApproveDialogOpen(true);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Publish
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedExam(exam.id);
                      setRejectDialogOpen(true);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this exam? It will be published and made available to students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>Approve & Publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this exam? It will be returned to draft status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject}>Reject</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
