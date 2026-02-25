import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, UserCheck, GraduationCap, ClipboardCheck, FileText, ClipboardList, BarChart3 } from 'lucide-react';
import { profileApi } from '@/db/api';
import { useAuth } from '@/hooks/useAuth';
import SchoolProfile from '@/components/principal/SchoolProfile';
import type { Profile } from '@/types/types';

export default function PrincipalDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile?.school_id]);

  // Load data function - stores teachers and students separately
  const loadData = async () => {
    if (!profile?.school_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Loading data for school_id:', profile.school_id);
      
      // Fetch teachers and students in parallel
      const [teachersData, studentsData] = await Promise.all([
        profileApi.getTeachersBySchoolId(profile.school_id),
        profileApi.getStudentsBySchoolId(profile.school_id),
      ]);

      console.log('Teachers:', teachersData.length, 'Students:', studentsData.length);

      setTeachers(teachersData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setTeachers([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Academic Management',
      value: 'Setup',
      icon: BookOpen,
      color: 'text-blue-600',
      onClick: () => navigate('/principal/academics'),
      clickable: true,
      description: 'Manage classes, sections & subjects',
    },
    {
      title: 'Lessons',
      value: 'Manage',
      icon: FileText,
      color: 'text-green-600',
      onClick: () => navigate('/principal/lessons'),
      clickable: true,
      description: 'Add and organize lessons',
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
        <h1 className="text-3xl font-bold">Principal Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          System overview and school management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={stat.clickable ? 'gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow' : 'gradient-card-blue rounded-lg shadow-lg'}
              onClick={stat.clickable ? stat.onClick : undefined}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">{stat.title}</CardTitle>
                <Icon className="w-5 h-5 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                {stat.clickable && (
                  <p className="text-xs text-white/80 mt-1">
                    {(stat as any).description || 'Click to view details'}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* New Teachers Card */}
        <Card
          className="gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/principal/teachers')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Teachers</CardTitle>
            <UserCheck className="w-5 h-5 text-white" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/80 mt-1">
              Click to view details
            </p>
          </CardContent>
        </Card>

        {/* New Students Card */}
        <Card
          className="gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/principal/students')}
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

        {/* Question Bank Card */}
        <Card
          className="gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/teacher/questions')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Question Bank</CardTitle>
            <FileText className="w-5 h-5 text-white" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/80 mt-1">
              Manage exam questions
            </p>
          </CardContent>
        </Card>

        {/* Exam Approvals Card */}
        <Card
          className="gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/principal/exam-approvals')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Exam Approvals</CardTitle>
            <ClipboardCheck className="w-5 h-5 text-white" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/80 mt-1">
              Review and approve exams
            </p>
          </CardContent>
        </Card>

        {/* Manage Exams Card */}
        <Card
          className="gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/teacher/exams')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Manage Exams</CardTitle>
            <ClipboardList className="w-5 h-5 text-white" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/80 mt-1">
              View and manage all exams
            </p>
          </CardContent>
        </Card>

        {/* Analyses Card */}
        <Card
          className="gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/principal/analyses')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Analyses</CardTitle>
            <BarChart3 className="w-5 h-5 text-white" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/80 mt-1">
              Exam and student analytics
            </p>
          </CardContent>
        </Card>
      </div>

      {profile && <SchoolProfile principalId={profile.id} />}

      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Welcome to the principal section. Here you can manage teachers, students, and academic settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
