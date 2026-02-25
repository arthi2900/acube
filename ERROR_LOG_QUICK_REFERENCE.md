# Error Log System - Quick Reference

## Quick Access
**URL**: `/admin/error-logs`  
**Dashboard Card**: Red gradient card with AlertTriangle icon  
**Permission**: Admin only

## Error Types
| Type | Description | Example |
|------|-------------|---------|
| `frontend` | React/JavaScript errors | Component crashes, undefined variables |
| `api` | HTTP request failures | Network errors, 500 responses |
| `auth` | Authentication issues | Login failures, permission denied |
| `database` | Database query errors | Table not found, query timeout |
| `user_action` | User input errors | Validation failures, invalid data |
| `system` | Server/system issues | Storage warnings, config errors |

## Severity Levels
| Level | Color | When to Use |
|-------|-------|-------------|
| `critical` | 🔴 Red | System crashes, data loss, security breaches |
| `high` | 🟠 Orange | API failures, auth failures, broken features |
| `medium` | 🟡 Yellow | Validation errors, minor bugs, warnings |
| `low` | 🔵 Blue | User errors, info messages, minor issues |

## Status Values
| Status | Badge Color | Meaning |
|--------|-------------|---------|
| `new` | Red | Error just occurred, needs review |
| `acknowledged` | Yellow | Error reviewed, being investigated |
| `resolved` | Green | Error fixed and verified |

## Quick Actions

### Log an Error
```typescript
import { logError } from '@/utils/errorLogger';

await logError(error, {
  type: 'api',
  severity: 'high',
  metadata: { endpoint: '/api/exams' }
});
```

### Log Specific Error Types
```typescript
import { logApiError, logAuthError, logDatabaseError } from '@/utils/errorLogger';

// API Error
await logApiError(error, '/api/exams/123', 'high');

// Auth Error
await logAuthError(error, 'login', 'high');

// Database Error
await logDatabaseError(error, 'SELECT * FROM exams', 'critical');
```

### Update Error Status
```typescript
// Single error
await errorLogApi.updateErrorLogStatus(errorId, 'resolved');

// Multiple errors
await errorLogApi.bulkUpdateStatus([id1, id2, id3], 'acknowledged');
```

## Page Features

### Statistics Cards
- **Total Errors**: All errors in system
- **Critical Errors**: Requires immediate attention
- **Today**: Errors logged today
- **This Week**: Last 7 days

### Filters
- Error Type dropdown
- Severity dropdown
- Status dropdown
- Date range (start/end)
- Search by message

### Actions
- ✅ Mark as Acknowledged
- ✅ Mark as Resolved
- 👁️ View Details
- 📥 Export to CSV
- 🔄 Refresh / Auto-Refresh

### Bulk Actions
1. Select errors using checkboxes
2. Click "Mark as Acknowledged" or "Mark as Resolved"
3. Selected errors updated together

## Keyboard Shortcuts
- **Ctrl/Cmd + R**: Refresh page
- **Escape**: Close detail dialog

## Common Tasks

### Review New Errors
1. Filter by Status: "New"
2. Sort by Severity (Critical first)
3. Review each error
4. Mark as "Acknowledged" when investigating

### Resolve Errors
1. Fix the underlying issue
2. Find error in Error Logs
3. Click eye icon to view details
4. Click "Mark as Resolved"

### Export for Analysis
1. Apply desired filters
2. Click "Export CSV" button
3. Open in Excel/Google Sheets
4. Analyze patterns and trends

### Monitor Critical Errors
1. Filter by Severity: "Critical"
2. Enable Auto-Refresh
3. Address each critical error immediately

## Error Detail Dialog

Shows complete information:
- Timestamp (12-hour format with AM/PM)
- Error type and severity
- Full error message
- User who encountered error
- Page URL where error occurred
- User agent (browser/device)
- Stack trace (for debugging)
- Additional metadata
- Resolution information (if resolved)

## API Quick Reference

```typescript
// Get all errors with filters
const errors = await errorLogApi.getErrorLogs({
  errorType: 'api',
  severity: 'high',
  status: 'new',
  startDate: '2025-12-01',
  endDate: '2025-12-11',
  searchTerm: 'network',
  limit: 20,
  offset: 0
});

// Get single error
const error = await errorLogApi.getErrorLogById(errorId);

// Get statistics
const stats = await errorLogApi.getErrorLogStats();

// Create error log
await errorLogApi.createErrorLog({
  error_type: 'frontend',
  severity: 'medium',
  message: 'Component render failed',
  stack_trace: error.stack,
  page_url: window.location.href,
  user_agent: navigator.userAgent,
  metadata: { component: 'ExamResults' }
});
```

## Best Practices

### ✅ Do
- Log errors with appropriate severity
- Include helpful metadata
- Review critical errors immediately
- Mark errors as resolved when fixed
- Use filters to find patterns
- Export logs for analysis

### ❌ Don't
- Ignore critical errors
- Log sensitive user data
- Mark errors as resolved without fixing
- Use generic error messages
- Forget to include context
- Leave errors in "new" status indefinitely

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No errors showing | Check filters, verify admin role |
| Can't update status | Verify admin permissions |
| Auto-refresh not working | Check browser console, toggle off/on |
| Export not working | Check browser popup blocker |
| Missing stack trace | Error may not have stack (normal for some types) |

## Color Coding

### Severity Badges
- 🔴 **Critical**: Red background
- 🟠 **High**: Orange background
- 🟡 **Medium**: Yellow background
- 🔵 **Low**: Blue background

### Status Badges
- 🔴 **New**: Red background
- 🟡 **Acknowledged**: Yellow background
- 🟢 **Resolved**: Green background

## Statistics Interpretation

### Total Errors
- High number: System may have issues
- Increasing trend: New problems emerging
- Decreasing trend: System improving

### Critical Errors
- Any critical error: Immediate action required
- Multiple critical: System in trouble
- Zero critical: Good system health

### Errors Today
- Spike: Recent issue introduced
- Steady: Normal operation
- Zero: Excellent (or no activity)

### Errors This Week
- Trend analysis: Compare to previous weeks
- Pattern detection: Recurring issues
- Health indicator: Overall system stability

## Integration Points

### Automatic Error Logging
- **ErrorBoundary**: Catches all React errors
- **API Interceptors**: Can be added for automatic API error logging
- **Global Error Handler**: Can be added for window.onerror

### Manual Error Logging
- Use in try-catch blocks
- Use in error callbacks
- Use in validation functions
- Use in API error handlers

## Sample Queries

### Find All Critical Errors Today
```typescript
const criticalToday = await errorLogApi.getErrorLogs({
  severity: 'critical',
  startDate: new Date().toISOString().split('T')[0],
  status: 'new'
});
```

### Find All Unresolved API Errors
```typescript
const apiErrors = await errorLogApi.getErrorLogs({
  errorType: 'api',
  status: 'new'
});
```

### Get Error Statistics
```typescript
const stats = await errorLogApi.getErrorLogStats();
console.log(`Critical: ${stats.critical_errors}`);
console.log(`New: ${stats.new_errors}`);
console.log(`Today: ${stats.errors_today}`);
```

## Monitoring Checklist

### Daily
- [ ] Check for new critical errors
- [ ] Review high severity errors
- [ ] Acknowledge errors being investigated
- [ ] Resolve fixed errors

### Weekly
- [ ] Review error trends
- [ ] Export logs for analysis
- [ ] Identify recurring patterns
- [ ] Update error handling based on patterns

### Monthly
- [ ] Analyze error statistics
- [ ] Review resolved errors
- [ ] Update documentation
- [ ] Improve error handling

---

**Quick Help**: For detailed documentation, see `ERROR_LOG_SYSTEM.md`
