# Dynamic Storage Monitoring System

## Overview
The system now features **automatic, real-time storage calculation** that updates dynamically whenever users create, modify, or delete content. This eliminates the need for manual refresh and provides accurate, up-to-date storage metrics for capacity planning.

## Key Features

### 1. Automatic Storage Updates
**Database Triggers** automatically recalculate storage when:
- Questions are created/updated/deleted
- Exams are created/updated/deleted
- Exam attempts are submitted
- Exam answers are recorded
- Question papers are created/updated/deleted

**No manual intervention required** - storage data updates in real-time as users interact with the system.

### 2. Capacity Planning Dashboard
New **Capacity Planning** page (`/admin/capacity`) provides:

#### System Capacity Status
- **Real-time utilization percentage** with color-coded status:
  - 🟢 Healthy: < 80% (default)
  - 🟡 Warning: 80-90%
  - 🔴 Critical: > 90%
- **Available space** vs **total capacity**
- **Configurable thresholds** for warning and critical alerts

#### Storage Growth Rate
- **Average daily growth** calculation
- **Projected growth** for 7, 30, and 90 days
- Based on historical data trends

#### Capacity Forecast
- **Days until storage is full** estimation
- **Projected full date** calculation
- **Automatic alerts** when capacity is approaching limits
- Helps plan server upgrades proactively

#### Storage History
- **Historical snapshots** of storage usage
- **Trend visualization** over last 30 days
- **User count tracking** alongside storage growth
- **Recent snapshots** display with detailed breakdown

### 3. Configurable Capacity Settings
Admins can configure:
- **Maximum storage capacity** (in GB)
- **Warning threshold** (default: 80%)
- **Critical threshold** (default: 90%)

Settings are stored in the `system_capacity` table and can be updated via the UI.

## Database Architecture

### New Tables

#### `storage_history`
Tracks system-wide storage snapshots over time:
```sql
- id: UUID (primary key)
- snapshot_time: TIMESTAMPTZ (when snapshot was taken)
- total_users: INTEGER (number of users at snapshot time)
- total_file_storage_bytes: BIGINT (total file storage)
- total_database_storage_bytes: BIGINT (total database storage)
- total_storage_bytes: BIGINT (combined total)
- created_at: TIMESTAMPTZ
```

#### `system_capacity`
Stores capacity configuration:
```sql
- id: UUID (primary key)
- max_storage_bytes: BIGINT (maximum allowed storage)
- warning_threshold_percent: INTEGER (warning alert threshold)
- critical_threshold_percent: INTEGER (critical alert threshold)
- updated_at: TIMESTAMPTZ
- updated_by: UUID (admin who last updated)
```

### Automatic Triggers

#### `auto_update_user_storage()`
Trigger function that automatically updates `storage_usage` table when:
- INSERT/UPDATE/DELETE on `questions` table
- INSERT/UPDATE/DELETE on `exams` table
- INSERT/UPDATE/DELETE on `exam_attempts` table
- INSERT/UPDATE/DELETE on `exam_answers` table
- INSERT/UPDATE/DELETE on `question_papers` table

**How it works:**
1. Detects which table triggered the event
2. Identifies the affected user_id
3. Recalculates database size for that user
4. Updates `storage_usage` table automatically

### New RPC Functions

#### `capture_storage_snapshot()`
Captures a system-wide storage snapshot:
- Counts total users
- Sums all file and database storage
- Inserts record into `storage_history` table
- Can be called manually or scheduled

#### `get_system_capacity_status()`
Returns current capacity status:
- Total storage used
- Maximum capacity
- Utilization percentage
- Available space
- Status (healthy/warning/critical)
- Threshold values

#### `get_storage_growth_rate()`
Calculates storage growth metrics:
- Average bytes per day growth rate
- Days until storage is full
- Projected full date
- Based on oldest and latest snapshots

#### `get_storage_history(days_back)`
Retrieves historical storage data:
- Returns snapshots for specified number of days
- Ordered by snapshot time
- Includes all storage metrics per snapshot

## Usage Guide

### For Admins

#### Initial Setup
1. Login as admin
2. Navigate to **Admin Dashboard** → **Capacity Planning**
3. Click **"Configure"** to set:
   - Maximum storage capacity (e.g., 100 GB)
   - Warning threshold (e.g., 80%)
   - Critical threshold (e.g., 90%)
4. Click **"Refresh"** to capture first snapshot

#### Monitoring
- **Storage automatically updates** as users create content
- Visit **Capacity Planning** page to view:
  - Current utilization percentage
  - Available space remaining
  - Growth rate trends
  - Projected full date
- **No manual refresh needed** for user storage data
- Click **"Refresh"** only to capture new system snapshot

#### Capacity Planning
1. Monitor **Growth Rate** section:
   - Check daily growth rate
   - Review projected growth for 7/30/90 days
2. Check **Capacity Forecast**:
   - Days until storage is full
   - Projected full date
3. Plan server upgrades when:
   - Status shows "Warning" or "Critical"
   - Days until full < 30
   - Growth rate is accelerating

### For Developers

#### API Methods

```typescript
// Get current capacity status
const status = await storageApi.getSystemCapacityStatus();

// Get growth rate and forecast
const growth = await storageApi.getStorageGrowthRate();

// Get historical data
const history = await storageApi.getStorageHistory(30); // last 30 days

// Capture new snapshot
await storageApi.captureStorageSnapshot();

// Update capacity configuration
await storageApi.updateSystemCapacity(
  107374182400, // 100 GB in bytes
  80,           // warning threshold %
  90            // critical threshold %
);
```

## Benefits

### 1. Real-Time Accuracy
- Storage data updates automatically
- No stale data or manual refresh needed
- Accurate metrics for decision-making

### 2. Proactive Planning
- Growth rate calculation helps predict future needs
- Projected full date enables timely upgrades
- Avoid unexpected storage outages

### 3. Cost Optimization
- Monitor actual usage vs capacity
- Right-size server resources
- Plan upgrades based on data, not guesswork

### 4. Performance
- Triggers update only affected users
- Efficient incremental calculations
- No full system recalculation needed

### 5. Alerting
- Color-coded status indicators
- Threshold-based warnings
- Critical alerts for immediate action

## Comparison: Before vs After

### Before (Static)
- ❌ Manual "Refresh Storage" button required
- ❌ Data could be outdated
- ❌ No growth rate calculation
- ❌ No capacity forecasting
- ❌ No historical trends
- ❌ Reactive approach to capacity issues

### After (Dynamic)
- ✅ Automatic real-time updates
- ✅ Always current data
- ✅ Growth rate calculation
- ✅ Capacity forecasting with projected dates
- ✅ Historical trend tracking
- ✅ Proactive capacity planning

## Technical Details

### Trigger Performance
- Triggers fire only on affected rows
- Calculations are user-specific, not system-wide
- Minimal performance impact
- Asynchronous execution

### Data Retention
- Storage history retained indefinitely
- Can be pruned manually if needed
- Indexed by snapshot_time for fast queries

### Scalability
- Handles thousands of users efficiently
- Incremental updates scale linearly
- Historical queries optimized with indexes

## Troubleshooting

### Storage Not Updating
1. Check if triggers are enabled:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_auto_update%';
   ```
2. Verify `calculate_user_database_size` function exists
3. Check for errors in database logs

### Growth Rate Shows NULL
- Requires at least 2 snapshots with different timestamps
- Capture initial snapshot, wait, then capture another
- Growth rate calculated from oldest to latest snapshot

### Capacity Status Not Showing
1. Ensure `system_capacity` table has data
2. Run configuration setup via UI
3. Check RLS policies allow admin access

## Future Enhancements

### Potential Additions
1. **Email Alerts**: Notify admins when thresholds are reached
2. **Scheduled Snapshots**: Automatic daily/hourly snapshots via cron
3. **Per-User Quotas**: Set storage limits per user or role
4. **Storage Analytics**: Detailed breakdown by content type
5. **Export Reports**: PDF/CSV export of capacity reports
6. **Predictive ML**: Machine learning for more accurate forecasts

## Related Files
- Migration: `supabase/migrations/*_dynamic_storage_monitoring_system.sql`
- Frontend: `src/pages/admin/CapacityPlanning.tsx`
- API: `src/db/api.ts` (storageApi)
- Types: `src/types/storage.ts`
- Routes: `src/routes.tsx`
- Dashboard: `src/pages/admin/AdminDashboard.tsx`
