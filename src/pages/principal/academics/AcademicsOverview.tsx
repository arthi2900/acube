import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Users, GraduationCap, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { academicApi } from '@/db/api';

export default function AcademicsOverview() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalSections: 0,
    totalSubjects: 0,
    assignedStudents: 0,
  });

  useEffect(() => {
    loadStats();
  }, [profile?.school_id]);

  const loadStats = async () => {
    if (!profile?.school_id) {
      setLoading(false);
      return;
    }

    try {
      const classes = await academicApi.getClassesBySchoolId(profile.school_id);
      const subjects = await academicApi.getSubjectsBySchoolId(profile.school_id);
      
      let totalSections = 0;
      for (const cls of classes) {
        const sections = await academicApi.getSectionsByClassId(cls.id);
        totalSections += sections.length;
      }

      setStats({
        totalClasses: classes.length,
        totalSections,
        totalSubjects: subjects.length,
        assignedStudents: 0, // Will be calculated when we implement student assignment
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load academic statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const managementCards = [
    {
      title: 'Class Management',
      description: 'Create and manage classes/grades',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/principal/academics/classes',
      stat: stats.totalClasses,
      statLabel: 'Classes',
    },
    {
      title: 'Section Management',
      description: 'Create sections for each class',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      path: '/principal/academics/sections',
      stat: stats.totalSections,
      statLabel: 'Sections',
    },
    {
      title: 'Subject Management',
      description: 'Define subjects for each class',
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      path: '/principal/academics/subjects',
      stat: stats.totalSubjects,
      statLabel: 'Subjects',
    },
    {
      title: 'Student Assignment',
      description: 'Assign students to class and section',
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      path: '/principal/academics/student-assignment',
      stat: stats.assignedStudents,
      statLabel: 'Assigned',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading academic data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/principal')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Academic Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage classes, sections, subjects, and student assignments
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {managementCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.path}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(card.path)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${card.bgColor}`}>
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      {card.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {card.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{card.stat}</div>
                    <div className="text-sm text-muted-foreground">{card.statLabel}</div>
                  </div>
                  <Button variant="outline">Manage</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
          <CardDescription>Follow these steps to set up your academic structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-semibold">Create Classes</h3>
                <p className="text-sm text-muted-foreground">
                  Define the classes/grades in your school (e.g., Class 10, Class 11, Class 12)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-semibold">Create Sections</h3>
                <p className="text-sm text-muted-foreground">
                  Add sections for each class (e.g., Section A, Section B, Section C)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-semibold">Define Subjects</h3>
                <p className="text-sm text-muted-foreground">
                  Create subjects for each class (e.g., Mathematics, Science, English)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="font-semibold">Assign Students</h3>
                <p className="text-sm text-muted-foreground">
                  Assign each student to their respective class and section
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
