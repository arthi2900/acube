# Login/Logout Tracking - Quick Reference

## 📊 System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LOGIN PROCESS                                │
└─────────────────────────────────────────────────────────────────────┘

1. User enters credentials
   └─> Login.tsx (handleSubmit)
        │
        ▼
2. Authentication
   └─> useAuth.signIn(username, password)
        │
        ├─> Supabase Auth ✓ Success
        │
        ▼
3. IMMEDIATE LOGIN TRACKING
   └─> profileApi.getCurrentProfile()
        │
        ├─> loginHistoryApi.createLoginHistory()
        │    │
        │    └─> INSERT INTO login_history
        │         ├─ user_id
        │         ├─ username
        │         ├─ full_name
        │         ├─ role
        │         ├─ school_id
        │         ├─ login_time (NOW)
        │         ├─ logout_time (NULL)
        │         ├─ ip_address (NULL)
        │         └─ user_agent (browser info)
        │
        └─> activeSessionApi.upsertActiveSession()
             │
             └─> UPSERT INTO active_sessions
                  └─ status = 'active'
        │
        ▼
4. Success Message
   └─> Toast: "Login successful" ✓
        │
        ▼
5. Redirect to Dashboard


┌─────────────────────────────────────────────────────────────────────┐
│                        LOGOUT PROCESS                                │
└─────────────────────────────────────────────────────────────────────┘

1. User clicks Logout
   └─> Header.tsx (handleSignOut)
        │
        ▼
2. IMMEDIATE LOGOUT TRACKING
   └─> useAuth.signOut()
        │
        ├─> loginHistoryApi.updateLogoutTime(user_id)
        │    │
        │    └─> UPDATE login_history
        │         SET logout_time = NOW()
        │         WHERE user_id = ? 
        │         AND logout_time IS NULL
        │         ORDER BY login_time DESC
        │         LIMIT 1
        │
        └─> activeSessionApi.logoutSession(user_id)
             │
             └─> UPDATE active_sessions
                  SET status = 'logged_out'
                  WHERE user_id = ?
        │
        ▼
3. Sign Out
   └─> Supabase Auth SignOut
        │
        ▼
4. Success Message
   └─> Toast: "Logged out successfully" ✓
        │
        ▼
5. Redirect to Login Page
```

## 🎯 Key Points

### ✅ What Happens on Login:
1. **Immediate** record creation in `login_history` table
2. User details captured: username, full_name, role, school_id
3. Timestamp auto-generated: `login_time`
4. Browser info captured: `user_agent`
5. Toast message: **"Login successful"**

### ✅ What Happens on Logout:
1. **Immediate** update of most recent login record
2. `logout_time` field updated with current timestamp
3. Active session marked as 'logged_out'
4. Toast message: **"Logged out successfully"**

### ⚡ Important Notes:
- **No delays**: Everything happens immediately
- **No duplicate checks**: Every login creates a new record
- **Error safe**: Tracking errors don't block login/logout
- **One record per login**: Each login session gets its own record

## 📋 Database Records Example

### After Login:
```sql
id: 123e4567-e89b-12d3-a456-426614174000
user_id: 789e4567-e89b-12d3-a456-426614174111
username: john_teacher
full_name: John Smith
role: teacher
school_id: 456e4567-e89b-12d3-a456-426614174222
login_time: 2025-12-11 10:30:00+00
logout_time: NULL  ← Will be updated on logout
ip_address: NULL
user_agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)...
created_at: 2025-12-11 10:30:00+00
```

### After Logout:
```sql
id: 123e4567-e89b-12d3-a456-426614174000
user_id: 789e4567-e89b-12d3-a456-426614174111
username: john_teacher
full_name: John Smith
role: teacher
school_id: 456e4567-e89b-12d3-a456-426614174222
login_time: 2025-12-11 10:30:00+00
logout_time: 2025-12-11 12:45:00+00  ← Updated!
ip_address: NULL
user_agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)...
created_at: 2025-12-11 10:30:00+00
```

## 🔍 How to Verify

### Check Login Tracking:
```sql
-- View most recent login
SELECT * FROM login_history 
ORDER BY login_time DESC 
LIMIT 1;

-- View all logins for a user
SELECT * FROM login_history 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY login_time DESC;
```

### Check Logout Tracking:
```sql
-- View completed sessions (with logout time)
SELECT * FROM login_history 
WHERE logout_time IS NOT NULL
ORDER BY logout_time DESC;

-- View active sessions (no logout time yet)
SELECT * FROM login_history 
WHERE logout_time IS NULL
ORDER BY login_time DESC;
```

### Check Active Sessions:
```sql
-- View currently active users
SELECT * FROM active_sessions 
WHERE status = 'active'
ORDER BY last_activity DESC;

-- View all sessions
SELECT * FROM active_sessions 
ORDER BY login_time DESC;
```

## 📁 File Locations

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Login Page | `/src/pages/Login.tsx` | User login interface |
| Auth Hook | `/src/hooks/useAuth.ts` | Authentication & tracking logic |
| Header | `/src/components/common/Header.tsx` | Logout button & handler |
| API Functions | `/src/db/api.ts` | Database operations |
| Login History Page | `/src/pages/admin/LoginHistory.tsx` | Admin view of all logins |

## 🛠️ Code References

### Login Tracking Code:
```typescript
// File: /src/hooks/useAuth.ts
// Lines: 49-91

const signIn = async (username: string, password: string) => {
  // ... authentication code ...
  
  // Track login immediately after successful authentication
  if (data.user) {
    const userProfile = await profileApi.getCurrentProfile();
    if (userProfile) {
      // Create login history record immediately
      await loginHistoryApi.createLoginHistory(
        userProfile.id,
        userProfile.username,
        userProfile.full_name,
        userProfile.role,
        userProfile.school_id,
        null, // IP address
        navigator.userAgent
      );
      
      // Create or update active session
      await activeSessionApi.upsertActiveSession(/* ... */);
    }
  }
};
```

### Logout Tracking Code:
```typescript
// File: /src/hooks/useAuth.ts
// Lines: 123-136

const signOut = async () => {
  // Update session status and logout time before signing out
  if (user?.id) {
    await activeSessionApi.logoutSession(user.id);
    await loginHistoryApi.updateLogoutTime(user.id);
  }
  
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
```

## ✨ Summary

The system is designed to be **simple and reliable**:

1. ✅ **Login** → Immediate record creation → "Login successful" message
2. ✅ **Logout** → Immediate record update → "Logged out successfully" message
3. ✅ **No special maintenance** required
4. ✅ **No duplicate prevention** - every login creates a new record
5. ✅ **Error-safe** - tracking failures don't block authentication

All tracking happens **automatically** when users login and logout. No manual intervention needed!
