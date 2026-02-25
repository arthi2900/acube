import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Calendar, PlayCircle } from 'lucide-react';
import { useStudentData } from '@/contexts/StudentDataContext';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { examCounts, loading, loadData } = useStudentData();

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your learning portal
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className="gradient-card-green rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow" 
          onClick={() => navigate('/student/exams?filter=current')}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-white" />
                Current
              </span>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 min-w-[2rem] justify-center">
                {loading ? '...' : examCounts.current}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/80">
              {loading ? 'Loading...' : examCounts.current > 0 ? 'Take your ongoing exams now' : 'No ongoing exams'}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow" 
          onClick={() => navigate('/student/exams?filter=upcoming')}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-white" />
                Upcoming
              </span>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 min-w-[2rem] justify-center">
                {loading ? '...' : examCounts.upcoming}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/80">
              {loading ? 'Loading...' : examCounts.upcoming > 0 ? 'View and take your assigned exams' : 'No upcoming exams'}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow" 
          onClick={() => navigate('/student/results')}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <Award className="h-5 w-5 text-white" />
                My Results
              </span>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 min-w-[2rem] justify-center">
                {loading ? '...' : examCounts.completed}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/80">
              {loading ? 'Loading...' : examCounts.completed > 0 ? 'View your exam results and performance' : 'No completed exams'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Welcome to the student dashboard. Here you can access your exams and view your results.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
