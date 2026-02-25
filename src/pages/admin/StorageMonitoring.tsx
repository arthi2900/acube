import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { storageApi } from '@/db/api';
import type { UserStorageUsage } from '@/types/storage';
import { Database, HardDrive, RefreshCw, Search, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StorageMonitoring() {
  const [storageData, setStorageData] = useState<UserStorageUsage[]>([]);
  const [filteredData, setFilteredData] = useState<UserStorageUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const loadStorageData = async () => {
    try {
      setLoading(true);
      const data = await storageApi.getAllUsersStorage();
      setStorageData(data);
      setFilteredData(data);
    } catch (error) {
      console.error('Error loading storage data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load storage data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      toast({
        title: 'Calculating Storage',
        description: 'This may take a few moments...',
      });

      // Calculate file storage first
      try {
        await storageApi.calculateFileStorage();
      } catch (fileError) {
        console.error('Error calculating file storage:', fileError);
        // Continue even if file storage calculation fails
      }
      
      // Then recalculate database storage
      try {
        await storageApi.recalculateAllStorage();
      } catch (dbError) {
        console.error('Error recalculating database storage:', dbError);
        // Continue even if database recalculation fails
      }

      // Reload data
      await loadStorageData();

      toast({
        title: 'Success',
        description: 'Storage data has been refreshed successfully.',
      });
    } catch (error) {
      console.error('Error refreshing storage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh storage data. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStorageData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(storageData);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = storageData.filter(
      (user) =>
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
    );
    setFilteredData(filtered);
  }, [searchQuery, storageData]);

  const totalStats = {
    totalUsers: storageData.length,
    totalFileStorage: storageData.reduce((sum, user) => sum + user.file_storage_bytes, 0),
    totalDatabaseStorage: storageData.reduce((sum, user) => sum + user.database_storage_bytes, 0),
    totalStorage: storageData.reduce((sum, user) => sum + user.total_storage_bytes, 0),
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'principal':
        return 'secondary';
      case 'teacher':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 xl:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Storage Monitoring</h1>
            <p className="text-sm xl:text-base text-muted-foreground mt-1">
              Monitor file and database storage usage for all users
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full xl:w-auto"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Storage'}
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 grid-cols-1 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20 bg-muted" />
              ) : (
                <div className="text-2xl font-bold">{totalStats.totalUsers}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total File Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24 bg-muted" />
              ) : (
                <div className="text-2xl font-bold">{formatBytes(totalStats.totalFileStorage)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Database Storage</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24 bg-muted" />
              ) : (
                <div className="text-2xl font-bold">{formatBytes(totalStats.totalDatabaseStorage)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24 bg-muted" />
              ) : (
                <div className="text-2xl font-bold text-primary">{formatBytes(totalStats.totalStorage)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Storage Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Storage Details</CardTitle>
            <CardDescription>
              View file and database storage usage for each user
            </CardDescription>
            <div className="flex items-center gap-2 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by username, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-muted" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">File Storage</TableHead>
                      <TableHead className="text-right">Database Storage</TableHead>
                      <TableHead className="text-right">Total Storage</TableHead>
                      <TableHead>Last Calculated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          {searchQuery ? 'No users found matching your search.' : 'No storage data available.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatBytes(user.file_storage_bytes)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatBytes(user.database_storage_bytes)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatBytes(user.total_storage_bytes)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {user.last_calculated_at
                              ? new Date(user.last_calculated_at).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })
                              : 'Never'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
