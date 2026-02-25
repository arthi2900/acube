# Login History and Active Users Monitoring - Implementation Guide

## Overview
This document describes the comprehensive login tracking and real-time user monitoring system implemented for the Online Exam Management System. This feature provides administrators with complete visibility into user authentication activities and real-time session monitoring.

## Features Implemented

### 1. Login History Tracking
- **Complete Audit Trail**: Records every user login with timestamp, role, and device information
- **Advanced Filtering**: Search and filter by username, role, date range
- **Export Capability**: Export login history to CSV for reporting
- **Detailed Information**: Captures user agent (browser/device), login time, user details

### 2. Real-time Active Users Monitoring
- **Live Session Tracking**: Monitor all currently logged-in users in real-time
- **Auto-refresh**: Automatic updates every 10 seconds (toggleable)
- **Activity Status**: Visual indicators for active, idle, and logged-out users
- **Session Statistics**: Dashboard showing counts of active, idle, and logged-out sessions
- **Last Activity Tracking**: Shows when each user was last active

## Database Schema

### login_history Table
```sql
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_login_history_user_id` on user_id
- `idx_login_history_login_time` on login_time (DESC)
- `idx_login_history_role` on role

### active_sessions Table
```sql
CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'logged_out')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Indexes:**
- `idx_active_sessions_user_id` on user_id
- `idx_active_sessions_status` on status
- `idx_active_sessions_last_activity` on last_activity (DESC)

## Security & Access Control

### Row Level Security (RLS)
Both tables have RLS enabled with the following policies:

**login_history:**
- Admin can view all login history
- System can insert login records (authenticated users)

**active_sessions:**
- Admin can view all active sessions
- Users can manage their own session records

### Data Protection
- All queries are protected by RLS policies
- Only admin role can access the monitoring pages
- User passwords are never logged or exposed

## API Functions

### loginHistoryApi
```typescript
// Create a new login history record
createLoginHistory(userId, username, fullName, role, schoolId, ipAddress?, userAgent?)

// Get all login history (admin only)
getAllLoginHistory()

// Get login history for specific user
getLoginHistoryByUser(userId)

// Get login history by role
getLoginHistoryByRole(role)

// Get login history within date range
getLoginHistoryByDateRange(startDate, endDate)
```

### activeSessionApi
```typescript
// Create or update active session
upsertActiveSession(userId, username, fullName, role, schoolId, ipAddress?, userAgent?)

// Update last activity timestamp
updateLastActivity(userId)

// Mark session as logged out
logoutSession(userId)

// Get all active sessions (admin only)
getAllActiveSessions()

// Get sessions by status
getActiveSessionsByStatus(status)

// Clean up stale sessions (24+ hours inactive)
cleanupStaleSessions()
```

## Authentication Integration

### Automatic Login Tracking
The `useAuth` hook has been enhanced to automatically track logins:

```typescript
const signIn = async (username: string, password: string) => {
  // 1. Authenticate user
  const { data, error } = await supabase.auth.signInWithPassword({...});
  
  // 2. Track login (non-blocking)
  if (data.user) {
    const userProfile = await profileApi.getCurrentProfile();
    if (userProfile) {
      await trackLogin(userProfile);
    }
  }
  
  return data;
};
```

### Logout Tracking
```typescript
const signOut = async () => {
  // Update session status before signing out
  if (user?.id) {
    await activeSessionApi.logoutSession(user.id);
  }
  
  await supabase.auth.signOut();
};
```

## Admin Pages

### Login History Page
**Route:** `/admin/login-history`

**Features:**
- Search by username, full name, or school
- Filter by role (admin, principal, teacher, student)
- Filter by date (today, last 7 days, last 30 days, all time)
- Export to CSV
- Displays: username, full name, role, school, login time, device info
- Active filters indicator
- Results count display

**Usage:**
1. Navigate to Admin Dashboard
2. Click "Login History" card
3. Use filters to narrow down results
4. Click "Export CSV" to download data

### Active Users Page
**Route:** `/admin/active-users`

**Features:**
- Real-time monitoring with auto-refresh (10-second intervals)
- Statistics cards showing active, idle, and logged-out counts
- Search by username, full name, or school
- Filter by role and status
- Visual status indicators (green = active, yellow = idle, gray = logged out)
- Shows login time and last activity
- Toggle auto-refresh on/off
- Manual refresh button

**Activity Status Logic:**
- **Active**: Last activity < 5 minutes ago
- **Idle**: Last activity 5-30 minutes ago
- **Inactive**: Last activity > 30 minutes ago

**Usage:**
1. Navigate to Admin Dashboard
2. Click "Active Users" card
3. Monitor real-time user sessions
4. Use filters to find specific users
5. Toggle auto-refresh as needed

## User Interface

### Design Elements
- **Color-coded badges** for roles (admin=red, principal=blue, teacher=gray, student=accent)
- **Status indicators** with animated pulse for active users
- **Responsive tables** with horizontal scroll on mobile
- **Filter cards** with active filter count badges
- **Statistics cards** with visual indicators
- **Export button** with download icon
- **Auto-refresh toggle** with activity icon

### Responsive Design
- Desktop: Full table layout with all columns
- Mobile: Horizontal scroll for tables, stacked filters
- Breakpoint: xl (1280px)

## Data Captured

### Login History
- User ID and username
- Full name
- Role (admin, principal, teacher, student)
- School ID and name
- Login timestamp
- User agent (browser/device information)
- IP address (placeholder for future implementation)

### Active Sessions
- All login history fields plus:
- Last activity timestamp
- Session status (active, idle, logged_out)
- Session creation and update timestamps

## Performance Considerations

### Database Indexes
- Indexes on frequently queried columns (user_id, login_time, role, status)
- Descending order on timestamp columns for recent-first queries

### Query Optimization
- Uses `.maybeSingle()` instead of `.single()` for safer queries
- Includes `.order()` with all queries
- Efficient filtering at database level

### Auto-refresh
- 10-second polling interval (configurable)
- Silent refresh (no loading indicators)
- Toggleable to reduce server load

### Session Cleanup
- Automatic cleanup function for stale sessions
- Runs periodically to mark inactive sessions as logged_out
- Prevents database bloat

## Future Enhancements

### Potential Improvements
1. **Real IP Address Capture**: Implement backend service to capture actual IP addresses
2. **Geolocation**: Add location tracking based on IP address
3. **Session Duration**: Calculate and display total session duration
4. **Login Alerts**: Email notifications for suspicious login activities
5. **Failed Login Attempts**: Track and alert on multiple failed login attempts
6. **Device Fingerprinting**: More detailed device identification
7. **Session Management**: Allow admin to force logout specific users
8. **Analytics Dashboard**: Visualizations of login patterns and trends
9. **Export Formats**: Add PDF and Excel export options
10. **Advanced Filters**: Date range picker, multiple role selection

## Testing Checklist

### Login History
- [ ] Login creates history record
- [ ] All user details captured correctly
- [ ] Search functionality works
- [ ] Role filter works
- [ ] Date filter works
- [ ] Export CSV generates correct data
- [ ] Only admin can access page
- [ ] Pagination works for large datasets

### Active Users
- [ ] Login creates/updates active session
- [ ] Logout updates session status
- [ ] Auto-refresh updates data
- [ ] Manual refresh works
- [ ] Status indicators display correctly
- [ ] Activity status calculation accurate
- [ ] Statistics cards show correct counts
- [ ] Only admin can access page

### Security
- [ ] RLS policies prevent unauthorized access
- [ ] Non-admin users redirected
- [ ] Login tracking doesn't block authentication
- [ ] Error handling doesn't expose sensitive data

## Troubleshooting

### Common Issues

**Issue:** Login history not recording
- **Check:** RLS policies allow insert
- **Check:** useAuth hook properly integrated
- **Check:** No errors in browser console

**Issue:** Active users not updating
- **Check:** Auto-refresh is enabled
- **Check:** Network connectivity
- **Check:** Supabase connection active

**Issue:** Export CSV not working
- **Check:** Browser allows downloads
- **Check:** Data exists to export
- **Check:** No popup blockers

**Issue:** Stale sessions not cleaning up
- **Check:** cleanup_stale_sessions function exists
- **Check:** Function has proper permissions
- **Check:** Run manually: `SELECT cleanup_stale_sessions();`

## Migration Information

**Migration Name:** `add_login_history_and_active_sessions`

**Applied:** 2025-12-11

**Rollback:** To rollback this feature:
```sql
DROP TABLE IF EXISTS active_sessions CASCADE;
DROP TABLE IF EXISTS login_history CASCADE;
DROP FUNCTION IF EXISTS update_session_activity CASCADE;
DROP FUNCTION IF EXISTS cleanup_stale_sessions CASCADE;
```

## Support

For issues or questions about this feature:
1. Check this documentation
2. Review TODO.md for implementation details
3. Check browser console for errors
4. Verify Supabase connection and policies
5. Test with admin user account

## Conclusion

This login history and active users monitoring system provides comprehensive visibility into user authentication and session management. It's designed to be secure, performant, and user-friendly, with room for future enhancements based on organizational needs.
