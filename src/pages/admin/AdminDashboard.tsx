import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, ClipboardList, FileQuestion, History, Activity, HardDrive, TrendingUp, AlertTriangle } from 'lucide-react';
import { profileApi, schoolApi } from '@/db/api';

interface UserStats {
  admins: number;
  principals: number;
  teachers: number;
  students: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSchools: 0,
    userStats: {
      admins: 0,
      principals: 0,
      teachers: 0,
      students: 0,
    } as UserStats,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      console.log('Admin Dashboard: Loading stats...');
      const [profiles, schools] = await Promise.all([
        profileApi.getAllProfiles(),
        schoolApi.getAllSchools(),
      ]);

      const userStats: UserStats = {
        admins: profiles.filter(p => p.role === 'admin').length,
        principals: profiles.filter(p => p.role === 'principal').length,
        teachers: profiles.filter(p => p.role === 'teacher').length,
        students: profiles.filter(p => p.role === 'student').length,
      };

      console.log('Admin Dashboard Stats:', {
        schools: schools.length,
        users: userStats,
      });

      setStats({
        totalSchools: schools.length,
        userStats,
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalUsers = stats.userStats.admins + stats.userStats.principals + 
                     stats.userStats.teachers + stats.userStats.students;

  const statCards = [
    {
      title: 'Total Schools',
      value: stats.totalSchools,
      icon: Building2,
      color: 'text-primary',
      description: 'Registered schools',
    },
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-secondary',
      description: `${stats.userStats.admins} Admins, ${stats.userStats.principals} Principals, ${stats.userStats.teachers} Teachers, ${stats.userStats.students} Students`,
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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          System overview and statistics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.title}
              className="gradient-card-blue rounded-lg shadow-lg"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">{stat.title}</CardTitle>
                <Icon className="w-5 h-5 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <p className="text-xs text-white/80 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}

        {/* Question Bank Card */}
        <Card
          className="gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/admin/questions')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Question Bank</CardTitle>
            <FileQuestion className="w-5 h-5 text-white" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/80 mt-1">
              Manage global and user question banks
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

        {/* Login History Card */}
        <Card
          className="gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/admin/login-history')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Login History</CardTitle>
            <History className="w-5 h-5 text-white" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/80 mt-1">
              Track all user login activities
            </p>
          </CardContent>
        </Card>

        {/* Active Users Card */}
        <Card
          className="gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/admin/active-users')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Users</CardTitle>
            <Activity className="w-5 h-5 text-white" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/80 mt-1">
              Monitor real-time logged-in users
            </p>
          </CardContent>
        </Card>

        {/* Storage Monitoring Card */}
        <Card
          className="gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/admin/storage')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Storage Monitoring</CardTitle>
            <HardDrive className="w-5 h-5 text-white" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/80 mt-1">
              Track file and database storage usage
            </p>
          </CardContent>
        </Card>

        {/* Capacity Planning Card */}
        <Card
          className="gradient-card-blue rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/admin/capacity')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Capacity Planning</CardTitle>
            <TrendingUp className="w-5 h-5 text-white" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/80 mt-1">
              Monitor server capacity and growth trends
            </p>
          </CardContent>
        </Card>

        {/* Error Logs Card */}
        <Card
          className="gradient-card-red rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => navigate('/admin/error-logs')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Error Logs</CardTitle>
            <AlertTriangle className="w-5 h-5 text-white" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/80 mt-1">
              Monitor and manage system errors
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
            Welcome to the admin section of the Online Exam Management System.
            Here you can manage users, assign roles, and control system settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
