import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Filter, Download, Calendar, User, Clock, Monitor, Activity, RefreshCw } from 'lucide-react';
import { loginHistoryApi } from '@/db/api';
import type { LoginHistoryWithSchool } from '@/types/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function LoginHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loginHistory, setLoginHistory] = useState<LoginHistoryWithSchool[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<LoginHistoryWithSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadLoginHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [loginHistory, searchTerm, roleFilter, dateFilter, statusFilter]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadLoginHistory(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadLoginHistory = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await loginHistoryApi.getAllLoginHistory();
      setLoginHistory(data);
    } catch (error) {
      console.error('Error loading login history:', error);
      if (!silent) {
        toast({
          title: 'Error',
          description: 'Failed to load login history',
          variant: 'destructive',
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...loginHistory];

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

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter((item) => new Date(item.login_time) >= filterDate);
    }

    // Status filter (logged in / logged out)
    if (statusFilter === 'logged_in') {
      filtered = filtered.filter((item) => !item.logout_time);
    } else if (statusFilter === 'logged_out') {
      filtered = filtered.filter((item) => item.logout_time);
    }

    setFilteredHistory(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setDateFilter('all');
    setStatusFilter('all');
  };

  const exportToCSV = () => {
    const headers = ['Serial No', 'Username', 'Full Name', 'Role', 'School', 'Login Time', 'User Agent'];
    const rows = filteredHistory.map((item, index) => [
      filteredHistory.length - index,
      item.username,
      item.full_name || 'N/A',
      item.role,
      item.school_name || 'N/A',
      format(new Date(item.login_time), 'yyyy-MM-dd HH:mm:ss'),
      item.user_agent || 'N/A',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `login-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Login history exported successfully',
    });
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

  const activeFiltersCount = [
    searchTerm !== '',
    roleFilter !== 'all',
    dateFilter !== 'all',
    statusFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="container mx-auto p-4 xl:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl xl:text-3xl font-bold">Login History</h1>
            <p className="text-sm text-muted-foreground">
              Track all user login activities and access patterns
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
          <Button variant="outline" size="icon" onClick={() => loadLoginHistory()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={exportToCSV} disabled={filteredHistory.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
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
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
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
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="logged_in">Currently Logged In</SelectItem>
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
          Showing {filteredHistory.length} of {loginHistory.length} login records
        </p>
        {autoRefresh && (
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
            Auto-refreshing every 10 seconds
          </p>
        )}
      </div>

      {/* Login History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Login Records</CardTitle>
          <CardDescription>
            Complete history of all user login activities. Currently logged-in users are shown in green.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading login history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {loginHistory.length === 0
                  ? 'No login history found'
                  : 'No records match your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">S.No</th>
                    <th className="text-left p-3 font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        User
                      </div>
                    </th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">School</th>
                    <th className="text-left p-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Login Time
                      </div>
                    </th>
                    <th className="text-left p-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Device
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item, index) => {
                    const isCurrentlyLoggedIn = !item.logout_time;
                    const serialNo = filteredHistory.length - index;
                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <p className="text-sm font-medium">{serialNo}</p>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className={`font-medium ${isCurrentlyLoggedIn ? 'text-green-600 dark:text-green-400' : ''}`}>
                              {item.username}
                            </p>
                            {item.full_name && (
                              <p className={`text-sm ${isCurrentlyLoggedIn ? 'text-green-600/80 dark:text-green-400/80' : 'text-muted-foreground'}`}>
                                {item.full_name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getRoleBadgeColor(item.role)}>{item.role}</Badge>
                        </td>
                        <td className="p-3">
                          <p className="text-sm">{item.school_name || 'N/A'}</p>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-sm">
                              {format(new Date(item.login_time), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.login_time), 'hh:mm:ss a')}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-xs text-muted-foreground max-w-xs truncate">
                            {item.user_agent || 'N/A'}
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
