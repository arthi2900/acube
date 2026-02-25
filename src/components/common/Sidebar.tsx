import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileQuestion,
  ClipboardList,
  Award,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Building2,
  GraduationCap,
  FolderOpen,
  Monitor,
  BarChart3,
} from 'lucide-react';
import { useEffect } from 'react';

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
  const { profile } = useAuth();
  const location = useLocation();

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        onCollapsedChange(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onCollapsedChange]);

  const getRoleBasedLinks = (): Array<{ to: string; label: string; icon: any }> => {
    if (!profile) return [];

    const links: Array<{ to: string; label: string; icon: any }> = [];

    if (profile.role === 'admin') {
      links.push(
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/users', label: 'User Management', icon: Users },
        { to: '/admin/schools', label: 'School Management', icon: Building2 },
        { to: '/admin/questions', label: 'Question Bank', icon: FileQuestion }
      );
    }

    if (profile.role === 'principal') {
      links.push(
        { to: '/principal', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/principal/questions', label: 'Question Bank', icon: FileQuestion },
        { to: '/principal/exam-approvals', label: 'Exam Approvals', icon: ClipboardList },
        { to: '/principal/question-papers', label: 'Question Paper History', icon: FolderOpen },
        { to: '/principal/live-monitoring', label: 'Live Monitoring', icon: Monitor }
      );
    }

    if (profile.role === 'teacher') {
      links.push(
        { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/teacher/students', label: 'Students', icon: GraduationCap },
        { to: '/teacher/questions', label: 'Question Bank', icon: FileQuestion },
        { to: '/teacher/question-bank-analysis', label: 'Question Bank Analysis', icon: BarChart3 },
        { to: '/teacher/question-papers', label: 'Question Paper History', icon: FolderOpen },
        { to: '/teacher/exams', label: 'Manage Exams', icon: ClipboardList },
        { to: '/teacher/live-monitoring', label: 'Live Monitoring', icon: Monitor }
      );
    }

    if (profile.role === 'student') {
      links.push(
        { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/student/exams', label: 'Upcoming Exams', icon: ClipboardList },
        { to: '/student/results', label: 'Results', icon: Award }
      );
    }

    return links;
  };

  const links = getRoleBasedLinks();

  if (!profile || links.length === 0) {
    return null;
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sidebar-foreground" />
              <span className="font-semibold text-sm text-sidebar-foreground">Navigation</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent', collapsed && 'mx-auto')}
            onClick={() => onCollapsedChange(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <Link key={link.to} to={link.to}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 text-sidebar-foreground',
                    collapsed && 'justify-center px-2',
                    isActive && 'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent',
                    !isActive && 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="truncate">{link.label}</span>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {profile.full_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-sidebar-foreground">
                  {profile.full_name || profile.username}
                </p>
                {profile.school_name && (
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    {profile.school_name}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
