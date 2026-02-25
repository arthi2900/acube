# Login/Logout Tracking - Testing Guide

## 🧪 How to Test the System

### Prerequisites
- Application is running
- You have valid user credentials
- Access to database (for verification)

## Test Case 1: Login Tracking

### Steps:
1. **Open the application** in your browser
2. **Open Developer Console** (Press F12)
3. **Navigate to login page** (if not already there)
4. **Enter valid credentials**:
   - Username: `[your_username]`
   - Password: `[your_password]`
5. **Click "Sign In"**

### Expected Results:
✅ **Visual Confirmation**:
- Toast notification appears with message: **"Login successful"**
- User is redirected to their dashboard (admin/principal/teacher/student)

✅ **Console Check**:
- No error messages like "Error tracking login"
- No JavaScript errors

✅ **Database Verification**:
Run this query in your database:
```sql
SELECT 
  id,
  username,
  full_name,
  role,
  school_id,
  login_time,
  logout_time,
  user_agent,
  created_at
FROM login_history 
WHERE username = '[your_username]'
ORDER BY login_time DESC 
LIMIT 1;
```

**Expected Data**:
- ✅ `username`: Your username
- ✅ `full_name`: Your full name
- ✅ `role`: Your role (admin/principal/teacher/student)
- ✅ `school_id`: Your school ID (or NULL if not assigned)
- ✅ `login_time`: Current timestamp (e.g., 2025-12-11 10:30:00+00)
- ✅ `logout_time`: **NULL** (not logged out yet)
- ✅ `user_agent`: Browser info (e.g., "Mozilla/5.0...")
- ✅ `created_at`: Timestamp when record was created

### ❌ If Test Fails:

**Problem**: No toast message appears
- Check browser console for JavaScript errors
- Verify toast component is working (try other actions that show toasts)

**Problem**: Error in console: "Error tracking login"
- Check database connection
- Verify RLS policies on `login_history` table
- Check if user profile exists in `profiles` table

**Problem**: No record in database
- Verify authentication was successful
- Check RLS policies allow INSERT on `login_history` table
- Check database connection

---

## Test Case 2: Logout Tracking

### Steps:
1. **Ensure you are logged in** (complete Test Case 1 first)
2. **Keep Developer Console open** (F12)
3. **Note the current time** (for verification)
4. **Click on your profile** in the top-right corner
5. **Click "Logout"** from the dropdown menu

### Expected Results:
✅ **Visual Confirmation**:
- Toast notification appears with message: **"Logged out successfully"**
- User is redirected to login page
- Session is cleared (can't access protected pages)

✅ **Console Check**:
- No error messages like "Error updating session status"
- No JavaScript errors

✅ **Database Verification**:
Run this query in your database:
```sql
SELECT 
  id,
  username,
  full_name,
  role,
  login_time,
  logout_time,
  EXTRACT(EPOCH FROM (logout_time - login_time)) / 60 as session_duration_minutes
FROM login_history 
WHERE username = '[your_username]'
ORDER BY login_time DESC 
LIMIT 1;
```

**Expected Data**:
- ✅ `username`: Your username
- ✅ `full_name`: Your full name
- ✅ `role`: Your role
- ✅ `login_time`: Timestamp from Test Case 1
- ✅ `logout_time`: **Current timestamp** (should be after login_time)
- ✅ `session_duration_minutes`: Positive number (time between login and logout)

### ❌ If Test Fails:

**Problem**: No toast message appears
- Check browser console for JavaScript errors
- Verify logout handler is being called

**Problem**: Error in console: "Error updating session status"
- Check database connection
- Verify RLS policies on `login_history` table
- Check if login record exists with NULL logout_time

**Problem**: `logout_time` still NULL in database
- Verify the UPDATE query is being executed
- Check RLS policies allow UPDATE on `login_history` table
- Verify user_id matches the logged-in user

---

## Test Case 3: Multiple Login Sessions

### Steps:
1. **Login** (Test Case 1)
2. **Logout** (Test Case 2)
3. **Login again** with same credentials
4. **Logout again**
5. **Repeat 2-3 more times**

### Expected Results:
✅ **Database Verification**:
Run this query:
```sql
SELECT 
  id,
  username,
  login_time,
  logout_time,
  CASE 
    WHEN logout_time IS NULL THEN 'Active'
    ELSE 'Completed'
  END as session_status
FROM login_history 
WHERE username = '[your_username]'
ORDER BY login_time DESC 
LIMIT 5;
```

**Expected Data**:
- ✅ Multiple records (one for each login)
- ✅ Each record has unique `id`
- ✅ Each record has different `login_time`
- ✅ Completed sessions have `logout_time` populated
- ✅ Most recent session might be 'Active' if you're still logged in

### Key Verification:
- ✅ **Every login creates a NEW record** (no duplicate prevention)
- ✅ **Each logout updates the corresponding record**
- ✅ **No records are overwritten or deleted**

---

## Test Case 4: Active Sessions

### Steps:
1. **Login** with your credentials
2. **Check active sessions table**

### Database Verification:
```sql
SELECT 
  user_id,
  username,
  full_name,
  role,
  login_time,
  last_activity,
  status
FROM active_sessions 
WHERE username = '[your_username]';
```

**Expected Data**:
- ✅ One record for your user
- ✅ `status`: 'active'
- ✅ `login_time`: Current session start time
- ✅ `last_activity`: Recent timestamp

### After Logout:
```sql
SELECT 
  user_id,
  username,
  status
FROM active_sessions 
WHERE username = '[your_username]';
```

**Expected Data**:
- ✅ `status`: 'logged_out'

---

## Test Case 5: Admin View

### Steps:
1. **Login as admin**
2. **Navigate to**: `/admin/login-history`
3. **View the login history page**

### Expected Results:
✅ **Page Display**:
- Table showing all login records
- Columns: Username, Full Name, Role, School, Login Time, Logout Time, Status
- Filter options: Role, Date Range, School
- Search functionality

✅ **Data Verification**:
- Your recent login records are visible
- Logout times are displayed correctly
- Session duration is calculated
- Status shows "Active" or "Completed"

---

## 🔍 Quick Verification Queries

### View All Recent Logins:
```sql
SELECT 
  username,
  full_name,
  role,
  login_time,
  logout_time,
  CASE 
    WHEN logout_time IS NULL THEN 'Active'
    ELSE 'Completed'
  END as status
FROM login_history 
ORDER BY login_time DESC 
LIMIT 20;
```

### View Active Sessions:
```sql
SELECT 
  username,
  full_name,
  role,
  login_time,
  status
FROM active_sessions 
WHERE status = 'active'
ORDER BY login_time DESC;
```

### View Completed Sessions Today:
```sql
SELECT 
  username,
  full_name,
  role,
  login_time,
  logout_time,
  EXTRACT(EPOCH FROM (logout_time - login_time)) / 60 as duration_minutes
FROM login_history 
WHERE DATE(login_time) = CURRENT_DATE
  AND logout_time IS NOT NULL
ORDER BY login_time DESC;
```

### Count Logins by Role:
```sql
SELECT 
  role,
  COUNT(*) as total_logins,
  COUNT(CASE WHEN logout_time IS NULL THEN 1 END) as active_sessions
FROM login_history 
WHERE DATE(login_time) = CURRENT_DATE
GROUP BY role
ORDER BY total_logins DESC;
```

---

## 📊 Test Results Checklist

Use this checklist to verify all tests pass:

- [ ] **Test Case 1**: Login tracking works
  - [ ] Toast message appears
  - [ ] Record created in database
  - [ ] All fields populated correctly
  - [ ] `logout_time` is NULL

- [ ] **Test Case 2**: Logout tracking works
  - [ ] Toast message appears
  - [ ] `logout_time` updated in database
  - [ ] Timestamp is correct
  - [ ] Session duration is positive

- [ ] **Test Case 3**: Multiple sessions work
  - [ ] Each login creates new record
  - [ ] Each logout updates correct record
  - [ ] No records overwritten

- [ ] **Test Case 4**: Active sessions work
  - [ ] Session created on login
  - [ ] Status updated on logout
  - [ ] Only one session per user

- [ ] **Test Case 5**: Admin view works
  - [ ] Page loads correctly
  - [ ] Data displays accurately
  - [ ] Filters work
  - [ ] Search works

---

## 🐛 Common Issues & Solutions

### Issue: "Login successful" message appears but no database record

**Solution**:
1. Check RLS policies:
```sql
-- Check if INSERT policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'login_history' 
AND cmd = 'INSERT';
```

2. Verify user has permission to insert:
```sql
-- Test INSERT permission
INSERT INTO login_history (
  user_id, username, full_name, role, school_id, user_agent
) VALUES (
  auth.uid(), 'test', 'Test User', 'student', NULL, 'Test Agent'
);
```

### Issue: Logout time not updating

**Solution**:
1. Check if login record exists:
```sql
SELECT * FROM login_history 
WHERE user_id = '[your_user_id]' 
AND logout_time IS NULL
ORDER BY login_time DESC 
LIMIT 1;
```

2. Check UPDATE policy:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'login_history' 
AND cmd = 'UPDATE';
```

### Issue: Browser info not captured

**Solution**:
- Check if `navigator.userAgent` is available in browser
- Open console and type: `console.log(navigator.userAgent)`
- Should return browser information string

---

## ✅ Success Criteria

Your implementation is working correctly if:

1. ✅ Every login shows "Login successful" message
2. ✅ Every login creates a new database record
3. ✅ All user details are captured (username, full_name, role, etc.)
4. ✅ Browser information is captured
5. ✅ Every logout shows "Logged out successfully" message
6. ✅ Every logout updates the logout_time field
7. ✅ No errors in browser console
8. ✅ Admin can view all login history
9. ✅ Multiple logins create multiple records
10. ✅ Active sessions are tracked correctly

---

## 📞 Need Help?

If tests fail:
1. Check browser console for errors
2. Verify database connection
3. Check RLS policies
4. Review the implementation files:
   - `/src/hooks/useAuth.ts`
   - `/src/pages/Login.tsx`
   - `/src/components/common/Header.tsx`
   - `/src/db/api.ts`

Refer to:
- **LOGIN_TRACKING_DOCUMENTATION.md** for detailed technical info
- **LOGIN_TRACKING_QUICK_REFERENCE.md** for quick reference
- **LOGIN_TRACKING_IMPLEMENTATION_SUMMARY.md** for overview
