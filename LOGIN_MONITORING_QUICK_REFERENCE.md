# Login Monitoring - Quick Reference Guide

## For Administrators

### Accessing Login History
1. Login as admin
2. Go to Admin Dashboard
3. Click **"Login History"** card
4. View complete login audit trail

### Monitoring Active Users
1. Login as admin
2. Go to Admin Dashboard
3. Click **"Active Users"** card
4. See real-time logged-in users

---

## Login History Features

### Search & Filter
- **Search Box**: Type username, name, or school
- **Role Filter**: Select admin, principal, teacher, or student
- **Date Filter**: Choose today, last 7 days, last 30 days, or all time
- **Clear Filters**: Reset all filters at once

### Export Data
- Click **"Export CSV"** button
- Downloads: `login-history-YYYY-MM-DD.csv`
- Includes: username, name, role, school, login time, device

### Information Displayed
| Column | Description |
|--------|-------------|
| User | Username and full name |
| Role | User's role with color badge |
| School | School name (if applicable) |
| Login Time | Date and time of login |
| Device | Browser/device information |

---

## Active Users Features

### Real-time Monitoring
- **Auto-refresh**: Updates every 10 seconds
- **Toggle**: Turn auto-refresh on/off
- **Manual Refresh**: Click refresh button anytime

### Statistics Dashboard
- **Active Users**: Currently online (green indicator)
- **Idle Users**: Inactive for a while (yellow indicator)
- **Logged Out**: Recently logged out (gray indicator)

### Activity Status
- 🟢 **Active**: Last activity < 5 minutes ago
- 🟡 **Idle**: Last activity 5-30 minutes ago
- ⚫ **Logged Out**: User has logged out

### Search & Filter
- **Search Box**: Type username, name, or school
- **Role Filter**: Select admin, principal, teacher, or student
- **Status Filter**: Choose active, idle, or logged out
- **Clear Filters**: Reset all filters at once

### Information Displayed
| Column | Description |
|--------|-------------|
| User | Username and full name |
| Role | User's role with color badge |
| School | School name (if applicable) |
| Status | Current session status |
| Login Time | When user logged in |
| Last Activity | Time since last activity |

---

## Tips & Best Practices

### Login History
✅ **Regular Audits**: Review login history weekly for security
✅ **Export Reports**: Download monthly reports for records
✅ **Check Patterns**: Look for unusual login times or locations
✅ **Role Monitoring**: Track admin and principal logins closely

### Active Users
✅ **Peak Times**: Monitor during exam periods
✅ **Session Management**: Check for stuck sessions
✅ **User Support**: Help users with login issues
✅ **Capacity Planning**: Track concurrent user counts

---

## Common Use Cases

### Security Audit
1. Go to Login History
2. Filter by date range
3. Export to CSV
4. Review for suspicious activity

### Check Who's Online
1. Go to Active Users
2. View active count
3. Filter by role if needed
4. Monitor real-time activity

### Track User Activity
1. Go to Login History
2. Search for specific username
3. View all login records
4. Check login patterns

### Monitor Exam Sessions
1. Go to Active Users
2. Filter by role: "Student"
3. Enable auto-refresh
4. Watch real-time participation

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus Search | Click search box |
| Clear Search | Clear button in search |
| Refresh Data | Click refresh icon |
| Export CSV | Click export button |

---

## Troubleshooting

### Login History Not Showing
- ✓ Verify you're logged in as admin
- ✓ Check if any filters are active
- ✓ Try clearing all filters
- ✓ Refresh the page

### Active Users Not Updating
- ✓ Check auto-refresh is enabled
- ✓ Verify internet connection
- ✓ Click manual refresh button
- ✓ Reload the page

### Export Not Working
- ✓ Check browser allows downloads
- ✓ Disable popup blockers
- ✓ Try different browser
- ✓ Verify data exists to export

---

## Access Control

### Who Can Access?
- ✅ **Admin**: Full access to both features
- ❌ **Principal**: No access
- ❌ **Teacher**: No access
- ❌ **Student**: No access

### What's Tracked?
- ✅ Login time and date
- ✅ User role and details
- ✅ Browser/device information
- ✅ Session activity
- ❌ Passwords (never logged)
- ❌ Personal browsing data

---

## Privacy & Security

### Data Protection
- All data encrypted in transit and at rest
- Only admin users can view login data
- No sensitive information exposed
- Automatic cleanup of old sessions

### Compliance
- Audit trail for security compliance
- User activity monitoring
- Session management
- Data retention policies

---

## Support

Need help? Check:
1. This quick reference guide
2. LOGIN_MONITORING_GUIDE.md (detailed documentation)
3. System administrator
4. Technical support team

---

## Feature Updates

**Version:** 1.0  
**Date:** 2025-12-11  
**Status:** Active

### Recent Changes
- ✅ Initial implementation
- ✅ Login history tracking
- ✅ Active users monitoring
- ✅ Real-time updates
- ✅ Export functionality

### Coming Soon
- 📅 IP address tracking
- 📅 Geolocation support
- 📅 Advanced analytics
- 📅 Email alerts
- 📅 Failed login tracking
