import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { errorLogApi } from '@/db/api';
import type { ErrorLogWithUser, ErrorLogStats, ErrorType, ErrorSeverity, ErrorStatus } from '@/types/types';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Search,
  Filter,
  Eye,
  CheckCheck,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const getSeverityColor = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-500 hover:bg-red-600';
    case 'high':
      return 'bg-orange-500 hover:bg-orange-600';
    case 'medium':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'low':
      return 'bg-blue-500 hover:bg-blue-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

const getSeverityIcon = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'critical':
      return <XCircle className="h-4 w-4" />;
    case 'high':
      return <AlertTriangle className="h-4 w-4" />;
    case 'medium':
      return <AlertCircle className="h-4 w-4" />;
    case 'low':
      return <Activity className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getStatusColor = (status: ErrorStatus) => {
  switch (status) {
    case 'new':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'acknowledged':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'resolved':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getErrorTypeLabel = (type: ErrorType) => {
  switch (type) {
    case 'frontend':
      return 'Frontend';
    case 'api':
      return 'API';
    case 'auth':
      return 'Authentication';
    case 'database':
      return 'Database';
    case 'user_action':
      return 'User Action';
    case 'system':
      return 'System';
    default:
      return type;
  }
};

export default function ErrorLogs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [errorLogs, setErrorLogs] = useState<ErrorLogWithUser[]>([]);
  const [stats, setStats] = useState<ErrorLogStats | null>(null);
  const [selectedError, setSelectedError] = useState<ErrorLogWithUser | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Filters
  const [errorTypeFilter, setErrorTypeFilter] = useState<ErrorType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<ErrorSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ErrorStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

  useEffect(() => {
    loadData();
  }, [errorTypeFilter, severityFilter, statusFilter, searchTerm, startDate, endDate, currentPage]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadData();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, errorTypeFilter, severityFilter, statusFilter, searchTerm, startDate, endDate, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load stats - don't fail if this fails
      try {
        const statsData = await errorLogApi.getErrorLogStats();
        setStats(statsData);
      } catch (statsError) {
        console.error('Error loading stats:', statsError);
        // Set default stats
        setStats({
          total_errors: 0,
          critical_errors: 0,
          high_errors: 0,
          medium_errors: 0,
          low_errors: 0,
          new_errors: 0,
          resolved_errors: 0,
          errors_today: 0,
          errors_this_week: 0,
        });
      }

      // Load error logs with filters
      const filters: {
        errorType?: ErrorType;
        severity?: ErrorSeverity;
        status?: ErrorStatus;
        startDate?: string;
        endDate?: string;
        searchTerm?: string;
        limit: number;
        offset: number;
      } = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };

      if (errorTypeFilter !== 'all') filters.errorType = errorTypeFilter;
      if (severityFilter !== 'all') filters.severity = severityFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (searchTerm) filters.searchTerm = searchTerm;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const logsData = await errorLogApi.getErrorLogs(filters);
      setErrorLogs(logsData);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error loading error logs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load error logs';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (error: ErrorLogWithUser) => {
    setSelectedError(error);
    setShowDetailDialog(true);
  };

  const handleUpdateStatus = async (id: string, status: ErrorStatus) => {
    try {
      await errorLogApi.updateErrorLogStatus(id, status);
      toast({
        title: 'Success',
        description: `Error marked as ${status}`,
      });
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update error status',
        variant: 'destructive',
      });
    }
  };

  const handleBulkUpdateStatus = async (status: ErrorStatus) => {
    if (selectedIds.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please select at least one error',
        variant: 'destructive',
      });
      return;
    }

    try {
      await errorLogApi.bulkUpdateStatus(selectedIds, status);
      toast({
        title: 'Success',
        description: `${selectedIds.length} error(s) marked as ${status}`,
      });
      setSelectedIds([]);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update error status',
        variant: 'destructive',
      });
    }
  };

  const handleExportToCSV = () => {
    const headers = [
      'Timestamp',
      'Type',
      'Severity',
      'Status',
      'Message',
      'User',
      'Page URL',
    ];

    const rows = errorLogs.map((log) => [
      formatDateTime(log.timestamp),
      getErrorTypeLabel(log.error_type),
      log.severity,
      log.status,
      log.message,
      log.user?.username || 'N/A',
      log.page_url || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Error logs exported to CSV',
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(errorLogs.map((log) => log.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const clearFilters = () => {
    setErrorTypeFilter('all');
    setSeverityFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Error Logs</h1>
            <p className="text-muted-foreground">
              Monitor and manage system errors
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
            </Button>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_errors}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.new_errors} new, {stats.resolved_errors} resolved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.critical_errors}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.errors_today}</div>
                <p className="text-xs text-muted-foreground">
                  Errors logged today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.errors_this_week}</div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Error Type</Label>
                <Select
                  value={errorTypeFilter}
                  onValueChange={(value) => setErrorTypeFilter(value as ErrorType | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="frontend">Frontend</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="user_action">User Action</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={severityFilter}
                  onValueChange={(value) => setSeverityFilter(value as ErrorSeverity | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as ErrorStatus | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search error messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
              {selectedIds.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkUpdateStatus('acknowledged')}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Acknowledged ({selectedIds.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkUpdateStatus('resolved')}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark as Resolved ({selectedIds.length})
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Error Logs</CardTitle>
                <CardDescription>
                  Last updated: {lastRefreshTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-2">Loading error logs...</p>
              </div>
            ) : errorLogs.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p className="text-muted-foreground">No errors found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.length === errorLogs.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(log.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOne(log.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getErrorTypeLabel(log.error_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(log.severity)}>
                            <span className="flex items-center gap-1">
                              {getSeverityIcon(log.severity)}
                              {log.severity}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {log.message}
                        </TableCell>
                        <TableCell>
                          {log.user ? (
                            <div>
                              <p className="font-medium">{log.user.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {log.user.role}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(log.status)}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {log.status !== 'resolved' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateStatus(log.id, 'resolved')}
                              >
                                <CheckCheck className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {errorLogs.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, errorLogs.length)} of{' '}
                  {stats?.total_errors || 0} errors
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">Page {currentPage}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={errorLogs.length < itemsPerPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
            <DialogDescription>
              Detailed information about the error
            </DialogDescription>
          </DialogHeader>
          {selectedError && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Timestamp</Label>
                  <p className="font-medium">{formatDateTime(selectedError.timestamp)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Error Type</Label>
                  <p className="font-medium">{getErrorTypeLabel(selectedError.error_type)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Severity</Label>
                  <Badge className={getSeverityColor(selectedError.severity)}>
                    <span className="flex items-center gap-1">
                      {getSeverityIcon(selectedError.severity)}
                      {selectedError.severity}
                    </span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedError.status)}>
                    {selectedError.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Error Message</Label>
                <p className="font-medium mt-1">{selectedError.message}</p>
              </div>

              {selectedError.user && (
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <div className="mt-1">
                    <p className="font-medium">{selectedError.user.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      @{selectedError.user.username} • {selectedError.user.role}
                    </p>
                  </div>
                </div>
              )}

              {selectedError.page_url && (
                <div>
                  <Label className="text-muted-foreground">Page URL</Label>
                  <p className="font-mono text-sm mt-1 break-all">{selectedError.page_url}</p>
                </div>
              )}

              {selectedError.user_agent && (
                <div>
                  <Label className="text-muted-foreground">User Agent</Label>
                  <p className="font-mono text-sm mt-1 break-all">{selectedError.user_agent}</p>
                </div>
              )}

              {selectedError.stack_trace && (
                <div>
                  <Label className="text-muted-foreground">Stack Trace</Label>
                  <pre className="mt-1 p-4 bg-muted rounded-md text-xs overflow-x-auto">
                    {selectedError.stack_trace}
                  </pre>
                </div>
              )}

              {selectedError.metadata && Object.keys(selectedError.metadata).length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Additional Metadata</Label>
                  <pre className="mt-1 p-4 bg-muted rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedError.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedError.resolved_by && selectedError.resolver && (
                <div>
                  <Label className="text-muted-foreground">Resolved By</Label>
                  <div className="mt-1">
                    <p className="font-medium">{selectedError.resolver.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      @{selectedError.resolver.username} •{' '}
                      {selectedError.resolved_at && formatDateTime(selectedError.resolved_at)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4">
                {selectedError.status !== 'acknowledged' && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedError.id, 'acknowledged');
                      setShowDetailDialog(false);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Acknowledged
                  </Button>
                )}
                {selectedError.status !== 'resolved' && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedError.id, 'resolved');
                      setShowDetailDialog(false);
                    }}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
