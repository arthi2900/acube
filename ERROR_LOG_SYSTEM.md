# Error Log System Documentation

## Overview

The Error Log System is a comprehensive error monitoring and management solution integrated into the Online Exam Management System. It captures, stores, and displays errors from various sources throughout the application, providing administrators with visibility into system health and issues.

## Features

### 1. Error Tracking
- **Frontend Errors**: React component errors, JavaScript exceptions
- **API Errors**: Failed HTTP requests, network issues
- **Authentication Errors**: Login failures, permission issues
- **Database Errors**: Query failures, connection issues
- **User Action Errors**: Validation errors, form submission failures
- **System Errors**: Server issues, configuration problems

### 2. Error Details
Each error log captures:
- **Timestamp**: When the error occurred (12-hour format with AM/PM)
- **Error Type**: Category of the error
- **Severity Level**: Critical, High, Medium, or Low
- **Message**: Human-readable error description
- **Stack Trace**: Technical details for debugging
- **User Information**: Who encountered the error (if logged in)
- **Page URL**: Where the error occurred
- **User Agent**: Browser and device information
- **Status**: New, Acknowledged, or Resolved
- **Metadata**: Additional context-specific information

### 3. Admin Dashboard Integration
- Quick access card on Admin Dashboard
- Visual indicator with AlertTriangle icon
- Red gradient styling for immediate attention

### 4. Error Logs Page Features

#### Statistics Dashboard
- Total errors count
- Critical errors count (requires immediate attention)
- Errors today
- Errors this week
- New vs resolved errors breakdown

#### Advanced Filtering
- **Error Type**: Filter by frontend, API, auth, database, user action, or system
- **Severity**: Filter by critical, high, medium, or low
- **Status**: Filter by new, acknowledged, or resolved
- **Date Range**: Filter by start and end dates
- **Search**: Search error messages by keyword

#### Error Management
- **View Details**: See complete error information including stack trace
- **Mark as Acknowledged**: Indicate error has been reviewed
- **Mark as Resolved**: Mark error as fixed
- **Bulk Actions**: Update multiple errors at once
- **Export to CSV**: Download error logs for analysis

#### Auto-Refresh
- Toggle auto-refresh (every 30 seconds)
- Manual refresh button
- Last refresh timestamp display

#### Pagination
- 20 errors per page
- Previous/Next navigation
- Current page indicator

## Database Schema

### error_logs Table

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_type TEXT NOT NULL CHECK (error_type IN ('frontend', 'api', 'auth', 'database', 'user_action', 'system')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved')),
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes
- `idx_error_logs_timestamp`: Fast timestamp-based queries
- `idx_error_logs_error_type`: Filter by error type
- `idx_error_logs_severity`: Filter by severity
- `idx_error_logs_status`: Filter by status
- `idx_error_logs_user_id`: Filter by user

### Row Level Security (RLS)
- **View**: Only admins can view error logs
- **Update**: Only admins can update error status
- **Insert**: All authenticated users can log errors

## API Functions

### errorLogApi

Located in `src/db/api.ts`:

#### getErrorLogs(filters?)
Retrieve error logs with optional filtering.

**Parameters:**
```typescript
{
  errorType?: ErrorType;
  severity?: ErrorSeverity;
  status?: ErrorStatus;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}
```

**Returns:** `ErrorLogWithUser[]`

#### getErrorLogById(id)
Get a single error log by ID with user details.

**Returns:** `ErrorLogWithUser | null`

#### getErrorLogStats()
Get error log statistics.

**Returns:** `ErrorLogStats | null`

#### createErrorLog(errorLog)
Create a new error log entry.

**Parameters:**
```typescript
{
  error_type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack_trace?: string;
  page_url?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}
```

**Returns:** `ErrorLog | null`

#### updateErrorLogStatus(id, status)
Update the status of an error log.

**Returns:** `ErrorLog | null`

#### bulkUpdateStatus(ids, status)
Update the status of multiple error logs.

**Returns:** `void`

## Utility Functions

### Error Logger (`src/utils/errorLogger.ts`)

#### logError(error, options?)
General-purpose error logging function.

```typescript
await logError(error, {
  type: 'frontend',
  severity: 'medium',
  metadata: { component: 'ExamResults' }
});
```

#### logApiError(error, endpoint?, severity?)
Log API-related errors.

```typescript
await logApiError(error, '/api/exams/123', 'high');
```

#### logAuthError(error, action?, severity?)
Log authentication errors.

```typescript
await logAuthError(error, 'login', 'high');
```

#### logDatabaseError(error, query?, severity?)
Log database errors.

```typescript
await logDatabaseError(error, 'SELECT * FROM exams', 'critical');
```

#### logUserActionError(error, action?, severity?)
Log user action errors.

```typescript
await logUserActionError(error, 'submit_exam', 'low');
```

#### logSystemError(error, component?, severity?)
Log system errors.

```typescript
await logSystemError(error, 'ErrorBoundary', 'critical');
```

## Error Boundary Component

### ErrorBoundary (`src/components/common/ErrorBoundary.tsx`)

React Error Boundary that catches unhandled errors in component tree.

**Features:**
- Catches React component errors
- Displays user-friendly error message
- Logs errors to database automatically
- Shows stack trace in development mode
- Provides "Try Again" and "Go to Home" buttons

**Usage:**
```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Integrated in App.tsx:**
The entire application is wrapped in ErrorBoundary to catch all React errors.

## Usage Examples

### 1. Manual Error Logging

```typescript
import { logApiError } from '@/utils/errorLogger';

try {
  const data = await fetchExamData(examId);
} catch (error) {
  await logApiError(error, `/api/exams/${examId}`, 'high');
  toast({
    title: 'Error',
    description: 'Failed to load exam data',
    variant: 'destructive',
  });
}
```

### 2. Logging with Metadata

```typescript
import { logError } from '@/utils/errorLogger';

try {
  await submitExam(examId, answers);
} catch (error) {
  await logError(error, {
    type: 'user_action',
    severity: 'medium',
    metadata: {
      action: 'submit_exam',
      exam_id: examId,
      answer_count: answers.length,
    },
  });
}
```

### 3. Automatic Error Catching

Errors in React components are automatically caught by ErrorBoundary:

```tsx
function MyComponent() {
  // This error will be caught and logged automatically
  throw new Error('Something went wrong!');
}
```

## Severity Guidelines

### Critical
- System crashes
- Database connection failures
- Security breaches
- Data corruption

### High
- API failures
- Authentication failures
- Failed database queries
- Payment processing errors

### Medium
- Validation errors
- Form submission failures
- Component render errors
- Non-critical API timeouts

### Low
- User action errors
- Warning messages
- Storage warnings
- Minor UI glitches

## Best Practices

### 1. Error Logging
- Always log errors with appropriate severity
- Include relevant metadata for debugging
- Use specific error types (not generic 'system')
- Provide clear, actionable error messages

### 2. Error Handling
- Catch errors at appropriate levels
- Show user-friendly messages to users
- Log technical details for admins
- Don't expose sensitive information in error messages

### 3. Error Resolution
- Review critical errors immediately
- Acknowledge errors when investigating
- Mark as resolved only when fixed
- Use error patterns to identify systemic issues

### 4. Monitoring
- Check error logs daily
- Set up alerts for critical errors
- Track error trends over time
- Use filters to identify problem areas

## Access Control

### Admin Only
- View error logs
- Update error status
- Export error logs
- View error statistics

### All Users
- Can trigger error logging (automatic)
- Cannot view error logs
- Cannot access error log page

## Navigation

### Access Error Logs Page
1. Login as Admin
2. Go to Admin Dashboard
3. Click "Error Logs" card (red gradient with AlertTriangle icon)
4. Or navigate directly to `/admin/error-logs`

## Sample Data

The system includes 8 sample error logs demonstrating different error types and severities:

1. **Frontend Critical**: TypeError in ExamResults component
2. **API High**: Network request failed
3. **Auth High**: Invalid credentials
4. **Database Critical**: Table does not exist
5. **User Action Medium**: Validation error
6. **System Low**: Storage warning
7. **Frontend Medium**: Invalid date format
8. **API Medium**: Request timeout

## Future Enhancements

### Planned Features
1. **Email Notifications**: Alert admins of critical errors
2. **Error Trends**: Visualize error patterns over time
3. **Error Grouping**: Group similar errors together
4. **Auto-Resolution**: Mark errors as resolved when fixed
5. **Error Analytics**: Detailed analysis and insights
6. **Integration**: Connect with external monitoring tools
7. **Custom Alerts**: Configure alert rules
8. **Error Reports**: Scheduled error summary reports

## Troubleshooting

### Error Logs Not Appearing
1. Check RLS policies are enabled
2. Verify user has admin role
3. Check database connection
4. Review browser console for errors

### Cannot Update Error Status
1. Verify admin permissions
2. Check network connection
3. Review error log in browser console

### Auto-Refresh Not Working
1. Check if auto-refresh is enabled
2. Verify no browser console errors
3. Check network connectivity

## Technical Details

### Files Created/Modified

#### New Files
1. `src/pages/admin/ErrorLogs.tsx` - Error logs page component
2. `src/utils/errorLogger.ts` - Error logging utilities
3. `src/components/common/ErrorBoundary.tsx` - React error boundary

#### Modified Files
1. `src/types/types.ts` - Added error log types
2. `src/db/api.ts` - Added error log API functions
3. `src/routes.tsx` - Added error logs route
4. `src/pages/admin/AdminDashboard.tsx` - Added error logs card
5. `src/App.tsx` - Wrapped app in ErrorBoundary

#### Database
1. Migration: `create_error_logs_table` - Created error_logs table with indexes and RLS policies
2. Function: `get_error_log_stats()` - Statistics function
3. Sample data: 8 demonstration error logs

### Dependencies
- All existing dependencies (no new packages required)
- Uses shadcn/ui components
- Uses Supabase for database operations

## Support

For issues or questions about the Error Log System:
1. Check this documentation
2. Review sample error logs
3. Check browser console for errors
4. Contact system administrator

---

**Last Updated**: 2025-12-11  
**Version**: 1.0.0  
**Status**: Production Ready ✅
