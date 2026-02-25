import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion, BookOpen, GraduationCap, FileText, FolderOpen, ClipboardList, BarChart3 } from 'lucide-react';
import { questionApi, academicApi, profileApi, examApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalSubjects: 0,
    totalClasses: 0,
    totalExams: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get current user profile
      const profile = await profileApi.getCurrentProfile();
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Get teacher assignments for current academic year
      const assignments = await academicApi.getTeacherAssignments(profile.id, '2024-2025');
      
      // Extract assigned subject IDs
      const assignedSubjectIds = assignments.map(a => a.subject_id);
      
      // Get unique class count
      const uniqueClasses = Array.from(
        new Map(assignments.map(a => [a.class_id, a.class])).values()
      );

      // Load all questions and filter by assigned subjects
      const questions = await questionApi.getAllQuestions();
      
      // Filter questions based on teacher's assigned subjects
      // This ensures the dashboard count matches the Question Bank page
      const filteredQuestions = questions.filter(q => 
        assignedSubjectIds.includes(q.subject_id)
      );

      // Load exams created by this teacher
      const exams = await examApi.getExamsByTeacher(profile.id);

      setStats({
        totalQuestions: filteredQuestions.length,
        totalSubjects: assignedSubjectIds.length,
        totalClasses: uniqueClasses.length,
        totalExams: exams.length,
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'My Questions',
      value: stats.totalQuestions,
      icon: FileQuestion,
      color: 'text-primary',
      description: 'Questions from your assigned subjects',
    },
    {
      title: 'Assigned Subjects',
      value: stats.totalSubjects,
      icon: BookOpen,
      color: 'text-secondary',
      description: 'Subjects you are teaching',
    },
    {
      title: 'Assigned Classes',
      value: stats.totalClasses,
      icon: GraduationCap,
      color: 'text-accent',
      description: 'Classes you are assigned to',
    },
    {
      title: 'Online Exams',
      value: stats.totalExams,
      icon: ClipboardList,
      color: 'text-primary',
      description: 'Total exams you have created',
      onClick: () => navigate('/teacher/exams'),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your assigned classes, subjects, and question bank
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.title}
              className={stat.onClick ? 'gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow' : 'gradient-card-blue rounded-lg shadow-lg'}
              onClick={stat.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">{stat.title}</CardTitle>
                <Icon className="w-5 h-5 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <p className="text-xs text-white/80 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}

        {/* Students Card */}
        <Card
          className="gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/teacher/students')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Students</CardTitle>
            <GraduationCap className="w-5 h-5 text-white" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/80 mt-1">
              Click to view details
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button
            onClick={() => navigate('/teacher/questions')}
            className="h-24 flex flex-col items-center justify-center gap-2"
            variant="outline"
          >
            <FileQuestion className="h-8 w-8" />
            <span>Manage Question Bank</span>
          </Button>
          <Button
            onClick={() => navigate('/teacher/question-paper')}
            className="h-24 flex flex-col items-center justify-center gap-2"
            variant="outline"
          >
            <FileText className="h-8 w-8" />
            <span>Create Question Paper</span>
          </Button>
          <Button
            onClick={() => navigate('/teacher/question-papers')}
            className="h-24 flex flex-col items-center justify-center gap-2"
            variant="outline"
          >
            <FolderOpen className="h-8 w-8" />
            <span>Question Paper History</span>
          </Button>
          <Button
            onClick={() => navigate('/teacher/exams')}
            className="h-24 flex flex-col items-center justify-center gap-2"
            variant="outline"
          >
            <ClipboardList className="h-8 w-8" />
            <span>Manage Exams</span>
          </Button>
          <Button
            onClick={() => navigate('/teacher/lessons')}
            className="h-24 flex flex-col items-center justify-center gap-2"
            variant="outline"
          >
            <BookOpen className="h-8 w-8" />
            <span>Lessons</span>
          </Button>
          <Button
            onClick={() => navigate('/teacher/analyses')}
            className="h-24 flex flex-col items-center justify-center gap-2"
            variant="outline"
          >
            <BarChart3 className="h-8 w-8" />
            <span>Analyses</span>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Welcome to the teacher dashboard. Here you can view statistics about your assigned classes and subjects, and manage questions for your question bank. The question count shown above reflects only the questions from your assigned subjects.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
