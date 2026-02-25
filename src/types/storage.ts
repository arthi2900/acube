export interface UserStorageUsage {
  user_id: string;
  username: string;
  email: string;
  role: string;
  file_storage_bytes: number;
  database_storage_bytes: number;
  total_storage_bytes: number;
  last_calculated_at: string | null;
}

export interface StorageStats {
  total_users: number;
  total_file_storage: number;
  total_database_storage: number;
  total_storage: number;
  average_storage_per_user: number;
}

export interface StorageCalculationResult {
  user_id: string;
  username: string;
  file_storage_bytes: number;
}

export interface SystemCapacityStatus {
  total_storage_bytes: number;
  max_storage_bytes: number;
  used_percentage: number;
  available_bytes: number;
  status: 'healthy' | 'warning' | 'critical';
  warning_threshold_percent: number;
  critical_threshold_percent: number;
}

export interface StorageGrowthRate {
  growth_rate_bytes_per_day: number;
  days_until_full: number | null;
  projected_full_date: string | null;
}

export interface StorageHistoryPoint {
  snapshot_time: string;
  total_storage_bytes: number;
  total_file_storage_bytes: number;
  total_database_storage_bytes: number;
  total_users: number;
}

export interface SystemCapacity {
  id: string;
  max_storage_bytes: number;
  warning_threshold_percent: number;
  critical_threshold_percent: number;
  updated_at: string;
  updated_by: string | null;
}
