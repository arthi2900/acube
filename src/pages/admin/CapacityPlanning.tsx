import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { storageApi } from '@/db/api';
import type { 
  SystemCapacityStatus, 
  StorageGrowthRate, 
  StorageHistoryPoint,
  SystemCapacity 
} from '@/types/storage';
import { 
  Database, 
  HardDrive, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  Settings,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function CapacityPlanning() {
  const [capacityStatus, setCapacityStatus] = useState<SystemCapacityStatus | null>(null);
  const [growthRate, setGrowthRate] = useState<StorageGrowthRate | null>(null);
  const [storageHistory, setStorageHistory] = useState<StorageHistoryPoint[]>([]);
  const [systemCapacity, setSystemCapacity] = useState<SystemCapacity | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [maxStorageGB, setMaxStorageGB] = useState('100');
  const [warningThreshold, setWarningThreshold] = useState('80');
  const [criticalThreshold, setCriticalThreshold] = useState('90');
  const { toast } = useToast();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const loadCapacityData = async () => {
    try {
      setLoading(true);
      const [status, growth, history, capacity] = await Promise.all([
        storageApi.getSystemCapacityStatus(),
        storageApi.getStorageGrowthRate(),
        storageApi.getStorageHistory(30),
        storageApi.getSystemCapacity(),
      ]);
      
      setCapacityStatus(status);
      setGrowthRate(growth);
      setStorageHistory(history);
      setSystemCapacity(capacity);

      if (capacity) {
        setMaxStorageGB((capacity.max_storage_bytes / (1024 ** 3)).toFixed(0));
        setWarningThreshold(capacity.warning_threshold_percent.toString());
        setCriticalThreshold(capacity.critical_threshold_percent.toString());
      }
    } catch (error) {
      console.error('Error loading capacity data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load capacity data. Please try again.',
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
        title: 'Refreshing Data',
        description: 'Capturing storage snapshot...',
      });

      await storageApi.captureStorageSnapshot();
      await loadCapacityData();

      toast({
        title: 'Success',
        description: 'Capacity data has been refreshed successfully.',
      });
    } catch (error) {
      console.error('Error refreshing capacity:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh capacity data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateCapacity = async () => {
    try {
      const maxBytes = Number.parseFloat(maxStorageGB) * (1024 ** 3);
      const warnThresh = Number.parseInt(warningThreshold);
      const critThresh = Number.parseInt(criticalThreshold);

      if (warnThresh >= critThresh) {
        toast({
          title: 'Invalid Configuration',
          description: 'Warning threshold must be less than critical threshold.',
          variant: 'destructive',
        });
        return;
      }

      await storageApi.updateSystemCapacity(maxBytes, warnThresh, critThresh);
      await loadCapacityData();

      toast({
        title: 'Success',
        description: 'System capacity configuration updated successfully.',
      });
      setConfigOpen(false);
    } catch (error) {
      console.error('Error updating capacity:', error);
      toast({
        title: 'Error',
        description: 'Failed to update capacity configuration.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadCapacityData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-muted';
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Capacity Planning</h1>
          <p className="text-muted-foreground mt-1">
            Monitor server capacity and plan for future storage requirements
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>System Capacity Configuration</DialogTitle>
                <DialogDescription>
                  Set maximum storage capacity and alert thresholds
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="maxStorage">Maximum Storage (GB)</Label>
                  <Input
                    id="maxStorage"
                    type="number"
                    value={maxStorageGB}
                    onChange={(e) => setMaxStorageGB(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warningThreshold">Warning Threshold (%)</Label>
                  <Input
                    id="warningThreshold"
                    type="number"
                    value={warningThreshold}
                    onChange={(e) => setWarningThreshold(e.target.value)}
                    placeholder="80"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="criticalThreshold">Critical Threshold (%)</Label>
                  <Input
                    id="criticalThreshold"
                    type="number"
                    value={criticalThreshold}
                    onChange={(e) => setCriticalThreshold(e.target.value)}
                    placeholder="90"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfigOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateCapacity}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full bg-muted" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 bg-muted" />
            <Skeleton className="h-32 bg-muted" />
            <Skeleton className="h-32 bg-muted" />
          </div>
        </div>
      ) : (
        <>
          {/* Capacity Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  <CardTitle>Storage Capacity Status</CardTitle>
                </div>
                {capacityStatus && (
                  <Badge variant={getStatusBadgeVariant(capacityStatus.status)}>
                    {getStatusIcon(capacityStatus.status)}
                    <span className="ml-1 capitalize">{capacityStatus.status}</span>
                  </Badge>
                )}
              </div>
              <CardDescription>Current storage utilization and available capacity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {capacityStatus ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Storage Used</span>
                      <span className="font-medium">
                        {formatBytes(capacityStatus.total_storage_bytes)} / {formatBytes(capacityStatus.max_storage_bytes)}
                      </span>
                    </div>
                    <Progress 
                      value={capacityStatus.used_percentage} 
                      className="h-3"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className="font-medium">{capacityStatus.used_percentage.toFixed(2)}%</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Available Space</p>
                      <p className="text-2xl font-bold">{formatBytes(capacityStatus.available_bytes)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Capacity</p>
                      <p className="text-2xl font-bold">{formatBytes(capacityStatus.max_storage_bytes)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Warning at {capacityStatus.warning_threshold_percent}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Critical at {capacityStatus.critical_threshold_percent}%</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground">No capacity data available</p>
              )}
            </CardContent>
          </Card>

          {/* Growth Rate and Projections */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <CardTitle>Storage Growth Rate</CardTitle>
                </div>
                <CardDescription>Average daily storage consumption</CardDescription>
              </CardHeader>
              <CardContent>
                {growthRate ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Growth Per Day</p>
                      <p className="text-3xl font-bold">
                        {formatBytes(growthRate.growth_rate_bytes_per_day)}
                      </p>
                    </div>
                    {growthRate.growth_rate_bytes_per_day > 0 && (
                      <div className="space-y-2 rounded-lg bg-muted p-4">
                        <p className="text-sm font-medium">Projected Growth</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            7 days: {formatBytes(growthRate.growth_rate_bytes_per_day * 7)}
                          </p>
                          <p className="text-muted-foreground">
                            30 days: {formatBytes(growthRate.growth_rate_bytes_per_day * 30)}
                          </p>
                          <p className="text-muted-foreground">
                            90 days: {formatBytes(growthRate.growth_rate_bytes_per_day * 90)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    Insufficient data for growth calculation
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <CardTitle>Capacity Forecast</CardTitle>
                </div>
                <CardDescription>Estimated time until storage is full</CardDescription>
              </CardHeader>
              <CardContent>
                {growthRate && growthRate.days_until_full ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Days Until Full</p>
                      <p className="text-3xl font-bold">
                        {Math.ceil(growthRate.days_until_full)} days
                      </p>
                    </div>
                    {growthRate.projected_full_date && (
                      <div className="space-y-2 rounded-lg bg-muted p-4">
                        <p className="text-sm font-medium">Projected Full Date</p>
                        <p className="text-lg font-semibold">
                          {formatDate(growthRate.projected_full_date)}
                        </p>
                        {growthRate.days_until_full < 30 && (
                          <div className="mt-2 flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-destructive">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p className="text-xs">
                              Storage capacity will be reached soon. Consider upgrading your server.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    {growthRate?.growth_rate_bytes_per_day === 0 
                      ? 'No growth detected. Storage is stable.'
                      : 'Insufficient data for forecast'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Storage History Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <CardTitle>Storage History (Last 30 Days)</CardTitle>
              </div>
              <CardDescription>Historical storage usage trends</CardDescription>
            </CardHeader>
            <CardContent>
              {storageHistory.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Data Points</p>
                      <p className="text-2xl font-bold">{storageHistory.length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">First Snapshot</p>
                      <p className="text-lg font-semibold">
                        {formatDate(storageHistory[0].snapshot_time)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Latest Snapshot</p>
                      <p className="text-lg font-semibold">
                        {formatDate(storageHistory[storageHistory.length - 1].snapshot_time)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Recent Snapshots</p>
                    <div className="space-y-2">
                      {storageHistory.slice(-5).reverse().map((point, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {formatDate(point.snapshot_time)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {point.total_users} users
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {formatBytes(point.total_storage_bytes)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              DB: {formatBytes(point.total_database_storage_bytes)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Database className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    No storage history available yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Click "Refresh" to capture the first snapshot
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
