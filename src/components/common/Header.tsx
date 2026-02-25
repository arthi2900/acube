import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, LayoutDashboard, Users, FileQuestion, Building2, ClipboardList, BarChart3, Box } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Header() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Success',
        description: 'Logged out successfully',
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to logout',
        variant: 'destructive',
      });
    }
  };

  const getRoleBasedLinks = (): Array<{ to: string; label: string; icon: any }> => {
    if (!profile) return [];

    const links: Array<{ to: string; label: string; icon: any }> = [];

    if (profile.role === 'admin') {
      links.push(
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/schools', label: 'Schools', icon: Building2 },
        { to: '/admin/questions', label: 'Question Bank', icon: FileQuestion },
        { to: '/teacher/exams', label: 'Manage Exams', icon: ClipboardList }
      );
    }

    if (profile.role === 'principal') {
      links.push(
        { to: '/principal', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/principal/teachers', label: 'Teachers', icon: Users },
        { to: '/principal/students', label: 'Students', icon: Users },
        { to: '/teacher/exams', label: 'Manage Exams', icon: ClipboardList }
      );
    }

    if (profile.role === 'teacher') {
      links.push(
        { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/teacher/questions', label: 'Question Bank', icon: FileQuestion }
      );
    }

    if (profile.role === 'student') {
      links.push(
        { to: '/student', label: 'Dashboard', icon: LayoutDashboard }
      );
    }

    return links;
  };

  const links = getRoleBasedLinks();

  // Get user-friendly role label
  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Admin',
      principal: 'Principal',
      teacher: 'Teacher',
      student: 'Student',
    };
    return roleMap[role] || role;
  };

  // Public navigation links
  const publicNavLinks = [
    { to: '/', label: 'Home' },
    { to: '/teacher/exams', label: 'Exams' },
    { to: '/teacher/questions', label: 'Question Bank' },
    { to: '/teacher/exam-results', label: 'Analytics' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full gradient-header shadow-md">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Box className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-white">
                A Cube
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/20">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline-block font-semibold">
                      {profile.full_name || profile.username}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {profile.full_name || profile.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getRoleLabel(profile.role)}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="md:hidden">
                    {links.map((link) => {
                      const Icon = link.icon;
                      return (
                        <DropdownMenuItem key={link.to} asChild>
                          <Link to={link.to} className="flex items-center">
                            <Icon className="w-4 h-4 mr-2" />
                            {link.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                  </div>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-white text-primary hover:bg-white/90">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
