# Dynamic Storage Monitoring - Quick Start Guide

## What Changed?

### Before
- ❌ Manual "Refresh Storage" button required
- ❌ Storage data could be outdated
- ❌ No capacity planning features
- ❌ No growth rate tracking
- ❌ Reactive approach to storage issues

### After
- ✅ **Automatic real-time updates** when users create/modify/delete content
- ✅ **Always current storage data** without manual refresh
- ✅ **Capacity Planning Dashboard** with forecasts
- ✅ **Growth rate calculation** for server planning
- ✅ **Proactive alerts** before storage is full

## How It Works

### Automatic Updates
When a user:
- Creates a question → Storage updates automatically
- Creates an exam → Storage updates automatically
- Submits exam answers → Storage updates automatically
- Deletes content → Storage updates automatically

**No admin action needed!**

### Capacity Planning
New dashboard at `/admin/capacity` shows:

1. **Current Status**
   - Storage utilization percentage
   - Available space remaining
   - Color-coded alerts (Green/Yellow/Red)

2. **Growth Rate**
   - Average daily storage consumption
   - Projected growth for 7/30/90 days

3. **Forecast**
   - Days until storage is full
   - Projected full date
   - Alerts when approaching limits

4. **History**
   - Storage trends over last 30 days
   - User count tracking

## Admin Quick Start

### Initial Setup (One-Time)
1. Login as admin
2. Go to **Admin Dashboard** → **Capacity Planning**
3. Click **"Configure"** button
4. Set your server capacity:
   - Maximum Storage: e.g., 100 GB
   - Warning Threshold: e.g., 80%
   - Critical Threshold: e.g., 90%
5. Click **"Save Changes"**
6. Click **"Refresh"** to capture first snapshot

### Daily Monitoring
1. Visit **Capacity Planning** page
2. Check **System Capacity Status** card:
   - Green badge = Healthy (< 80%)
   - Yellow badge = Warning (80-90%)
   - Red badge = Critical (> 90%)
3. Review **Capacity Forecast**:
   - If "Days Until Full" < 30, plan server upgrade
4. Monitor **Growth Rate** for trends

### When to Take Action
- **Warning Status**: Start planning server upgrade
- **Critical Status**: Upgrade server immediately
- **Days Until Full < 30**: Schedule upgrade soon
- **High Growth Rate**: Monitor more frequently

## Technical Details

### Database Triggers
Automatic triggers on these tables:
- `questions` → Updates creator's storage
- `exams` → Updates teacher's storage
- `exam_attempts` → Updates student's storage
- `exam_answers` → Updates student's storage
- `question_papers` → Updates creator's storage

### New API Methods
```typescript
// Get capacity status
await storageApi.getSystemCapacityStatus();

// Get growth rate
await storageApi.getStorageGrowthRate();

// Get history
await storageApi.getStorageHistory(30);

// Capture snapshot
await storageApi.captureStorageSnapshot();
```

### Navigation
- **Admin Dashboard** → **Capacity Planning** card
- Direct URL: `/admin/capacity`
- Also accessible from sidebar (if implemented)

## Benefits for Server Management

### 1. Cost Optimization
- Know exactly when to upgrade
- Avoid over-provisioning
- Right-size your server

### 2. Prevent Outages
- Get alerts before storage is full
- Plan upgrades proactively
- No surprise capacity issues

### 3. Data-Driven Decisions
- Historical trends show actual usage
- Growth rate predicts future needs
- Forecast helps budget planning

### 4. Real-Time Accuracy
- No stale data
- Always current metrics
- Automatic updates

## Example Scenarios

### Scenario 1: Healthy System
```
Status: Healthy (45% used)
Available: 55 GB / 100 GB
Growth Rate: 500 MB/day
Days Until Full: 110 days
Action: No action needed, monitor monthly
```

### Scenario 2: Warning Status
```
Status: Warning (85% used)
Available: 15 GB / 100 GB
Growth Rate: 1 GB/day
Days Until Full: 15 days
Action: Plan server upgrade within 2 weeks
```

### Scenario 3: Critical Status
```
Status: Critical (95% used)
Available: 5 GB / 100 GB
Growth Rate: 2 GB/day
Days Until Full: 2 days
Action: Upgrade server immediately!
```

## Troubleshooting

### Q: Storage not updating automatically?
A: Check database triggers are enabled. Contact developer if issue persists.

### Q: Growth rate shows "Insufficient data"?
A: Need at least 2 snapshots. Click "Refresh" to capture snapshots over time.

### Q: How often should I check?
A: 
- Healthy status: Weekly
- Warning status: Daily
- Critical status: Multiple times per day

### Q: Can I change capacity settings?
A: Yes, click "Configure" button on Capacity Planning page.

## Related Pages
- **Storage Monitoring** (`/admin/storage`): Per-user storage details
- **Capacity Planning** (`/admin/capacity`): System-wide capacity planning
- **Admin Dashboard** (`/admin`): Quick access to both features

## Documentation
- Full guide: `DYNAMIC_STORAGE_MONITORING.md`
- Bug fix details: `STORAGE_CALCULATION_FIX.md`
- Storage monitoring: `STORAGE_MONITORING_GUIDE.md`
