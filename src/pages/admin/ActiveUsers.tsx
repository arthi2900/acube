import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Filter, RefreshCw, Users, Clock, Activity } from 'lucide-react';
import { activeSessionApi } from '@/db/api';
import type { ActiveSessionWithSchool } from '@/types/types';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';

export default function ActiveUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSessions, setActiveSessions] = useState<ActiveSessionWithSchool[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ActiveSessionWithSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadActiveSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activeSessions, searchTerm, roleFilter, statusFilter]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadActiveSessions(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadActiveSessions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await activeSessionApi.getAllActiveSessions();
      setActiveSessions(data);
    } catch (error) {
      console.error('Error loading active sessions:', error);
      if (!silent) {
        toast({
          title: 'Error',
          description: 'Failed to load active sessions',
          variant: 'destructive',
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...activeSessions];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.username.toLowerCase().includes(search) ||
          item.full_name?.toLowerCase().includes(search) ||
          item.school_name?.toLowerCase().includes(search)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((item) => item.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    setFilteredSessions(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('active');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive text-destructive-foreground';
      case 'principal':
        return 'bg-primary text-primary-foreground';
      case 'teacher':
        return 'bg-secondary text-secondary-foreground';
      case 'student':
        return 'bg-accent text-accent-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'idle':
        return 'bg-yellow-500 text-white';
      case 'logged_out':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getActivityStatus = (lastActivity: string) => {
    const lastActivityDate = new Date(lastActivity);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60);

    if (diffMinutes < 5) return 'active';
    if (diffMinutes < 30) return 'idle';
    return 'inactive';
  };

  const activeFiltersCount = [
    searchTerm !== '',
    roleFilter !== 'all',
    statusFilter !== 'active',
  ].filter(Boolean).length;

  const activeCount = activeSessions.filter((s) => s.status === 'active').length;
  const idleCount = activeSessions.filter((s) => s.status === 'idle').length;
  const loggedOutCount = activeSessions.filter((s) => s.status === 'logged_out').length;

  return (
    <div className="container mx-auto p-4 xl:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl xl:text-3xl font-bold">Active Users</h1>
            <p className="text-sm text-muted-foreground">
              Real-time monitoring of logged-in users and their activities
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="icon" onClick={() => loadActiveSessions()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently online</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Idle Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <p className="text-2xl font-bold">{idleCount}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Inactive for a while</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Logged Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-muted" />
              <p className="text-2xl font-bold">{loggedOutCount}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recently logged out</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search username, name, school..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="principal">Principal</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="logged_out">Logged Out</SelectItem>
              </SelectContent>
            </Select>
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredSessions.length} of {activeSessions.length} sessions
        </p>
        {autoRefresh && (
          <p className="text-xs text-muted-foreground">Auto-refreshing every 10 seconds</p>
        )}
      </div>

      {/* Active Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Sessions
          </CardTitle>
          <CardDescription>Real-time view of all user sessions and activities</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading active sessions...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {activeSessions.length === 0
                  ? 'No active sessions found'
                  : 'No sessions match your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">School</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Login Time
                      </div>
                    </th>
                    <th className="text-left p-3 font-medium">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => {
                    const activityStatus = getActivityStatus(session.last_activity);
                    return (
                      <tr key={session.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{session.username}</p>
                            {session.full_name && (
                              <p className="text-sm text-muted-foreground">{session.full_name}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getRoleBadgeColor(session.role)}>{session.role}</Badge>
                        </td>
                        <td className="p-3">
                          <p className="text-sm">{session.school_name || 'N/A'}</p>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusBadgeColor(session.status)}>
                              {session.status}
                            </Badge>
                            {activityStatus === 'active' && session.status === 'active' && (
                              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-sm">
                              {format(new Date(session.login_time), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(session.login_time), 'hh:mm a')}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-sm">
                            {formatDistanceToNow(new Date(session.last_activity), {
                              addSuffix: true,
                            })}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
