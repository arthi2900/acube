# Dashboard Troubleshooting Guide

## Issue: Dashboard Cards Showing 0 Values

Both Admin and Principal dashboards are displaying 0 values in their stat cards, even though data exists in the database.

## Current Database State

### Profiles (Users)
```
Total Users: 6
- 1 Admin (karunanithi)
- 1 Principal (Amutha G - ghsirulakurichi2011@gmail.com)
- 1 Teacher (Sundharachozan S)
- 3 Students (Amuthan Sivakumar, Murugan A, AJIS C)
```

### School Data
```
School ID: c8e300c5-1e14-45df-bb71-69c4d604a047
School Name: GHS IRULAKURICHI
School Code: SCH-667678

Teachers in this school: 1
Students in this school: 2 (Note: 1 student has NULL school_id)
```

### Other Data
```
Total Subjects: 5
Total Questions: 0
Total Exams: 0
```

## Expected Dashboard Values

### Admin Dashboard (karunanithi)
- **Total Users**: 6
- **Total Subjects**: 5
- **Total Questions**: 0
- **Total Exams**: 0

### Principal Dashboard (Amutha G)
- **Teachers**: 1
- **Students**: 2
- **Exams**: 0

## Root Cause Analysis

### 1. Row Level Security (RLS) Policies
All main tables have RLS enabled:
- ✅ profiles (RLS enabled)
- ✅ exams (RLS enabled)
- ✅ questions (RLS enabled)
- ✅ schools (RLS enabled)
- ❌ subjects (RLS disabled - should work)

### 2. Admin Access Verification
The `is_admin()` function works correctly:
```sql
SELECT is_admin('f25ff38b-d0e3-4900-8e81-9e322d8e04eb'::uuid);
-- Returns: true
```

### 3. RLS Policies for Admin
All tables with RLS have "Admins have full access" policies:
- ✅ profiles: "Admins have full access"
- ✅ questions: "Admins have full access to questions"
- ✅ exams: "Admins have full access to exams"

### 4. RLS Policies for Principal
Principal has limited access:
- ✅ profiles: "Principals can view teachers and students" (filtered by school_id)
- ✅ exams: "Principals can view and approve exams"

## Possible Causes

### Cause 1: Authentication State Not Loaded
**Symptom**: Dashboard loads before user authentication completes

**Solution**: The code already has proper loading states and useEffect dependencies

### Cause 2: Supabase Client Not Authenticated
**Symptom**: API calls execute without authentication context

**Check**: 
1. Open browser DevTools
2. Go to Application > Local Storage
3. Look for `supabase.auth.token`
4. Verify token exists and is valid

### Cause 3: API Functions Throwing Errors Silently
**Symptom**: Errors are caught but stats remain at 0

**Solution**: Check browser console for error messages:
- Admin Dashboard: "Error loading admin stats:"
- Principal Dashboard: "Error loading stats:"

### Cause 4: RLS Policies Blocking Access
**Symptom**: Queries return empty arrays due to RLS restrictions

**Test**: Run queries directly in Supabase SQL Editor while authenticated

## Debugging Steps

### Step 1: Check Browser Console
1. Open the dashboard (Admin or Principal)
2. Open DevTools (F12)
3. Go to Console tab
4. Look for these messages:

**Admin Dashboard:**
```
Admin Dashboard: Loading stats...
Admin Dashboard Stats: { profiles: 6, subjects: 5, questions: 0, exams: 0 }
```

**Principal Dashboard:**
```
Loading stats for school_id: c8e300c5-1e14-45df-bb71-69c4d604a047
Teachers: 1 Students: 2 Exams: 0
```

### Step 2: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "supabase"
4. Look for API calls to:
   - `/rest/v1/profiles`
   - `/rest/v1/subjects`
   - `/rest/v1/questions`
   - `/rest/v1/exams`

5. Check response data:
   - Status should be 200
   - Response should contain data arrays
   - If empty arrays, check RLS policies

### Step 3: Verify Authentication
1. Check if user is logged in:
   ```javascript
   // In browser console
   const { data } = await supabase.auth.getUser();
   console.log('Current user:', data.user);
   ```

2. Verify user role:
   ```javascript
   // In browser console
   const { data } = await supabase
     .from('profiles')
     .select('*')
     .eq('id', (await supabase.auth.getUser()).data.user?.id)
     .single();
   console.log('User profile:', data);
   ```

### Step 4: Test API Functions Directly
Open browser console and test:

**Test Admin APIs:**
```javascript
import { profileApi, subjectApi, questionApi, examApi } from '@/db/api';

// Test each API
const profiles = await profileApi.getAllProfiles();
console.log('Profiles:', profiles.length, profiles);

const subjects = await subjectApi.getAllSubjects();
console.log('Subjects:', subjects.length, subjects);

const questions = await questionApi.getAllQuestions();
console.log('Questions:', questions.length, questions);

const exams = await examApi.getAllExams();
console.log('Exams:', exams.length, exams);
```

**Test Principal APIs:**
```javascript
import { profileApi } from '@/db/api';

const schoolId = 'c8e300c5-1e14-45df-bb71-69c4d604a047';

const teachers = await profileApi.getTeachersBySchoolId(schoolId);
console.log('Teachers:', teachers.length, teachers);

const students = await profileApi.getStudentsBySchoolId(schoolId);
console.log('Students:', students.length, students);
```

### Step 5: Check RLS Policies
Run these queries in Supabase SQL Editor:

**Test as Admin:**
```sql
-- Set role context (simulates authenticated admin)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "f25ff38b-d0e3-4900-8e81-9e322d8e04eb"}';

-- Test queries
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM subjects;
SELECT COUNT(*) FROM questions;
SELECT COUNT(*) FROM exams;
```

**Test as Principal:**
```sql
-- Set role context (simulates authenticated principal)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "4b30b8a8-71f3-43fd-a108-b09ae973c765"}';

-- Test queries
SELECT COUNT(*) FROM profiles 
WHERE role = 'teacher' 
AND school_id = 'c8e300c5-1e14-45df-bb71-69c4d604a047';

SELECT COUNT(*) FROM profiles 
WHERE role = 'student' 
AND school_id = 'c8e300c5-1e14-45df-bb71-69c4d604a047';
```

## Solutions

### Solution 1: Clear Browser Cache and Reload
Sometimes stale data or cached authentication tokens cause issues.

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Log in again

### Solution 2: Re-authenticate
If authentication token is expired or invalid:

1. Log out completely
2. Clear browser local storage
3. Log in again
4. Check if dashboard loads correctly

### Solution 3: Verify RLS Policies
If RLS policies are blocking access, you may need to update them.

**Check current policies:**
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Solution 4: Add Fallback for Missing school_id
For the Principal Dashboard, if school_id is NULL:

```typescript
// In PrincipalDashboard.tsx
useEffect(() => {
  loadStats();
}, [profile?.school_id]);

const loadStats = async () => {
  if (!profile?.school_id) {
    console.warn('Principal has no school_id assigned');
    setLoading(false);
    return;
  }
  // ... rest of the code
};
```

### Solution 5: Check for JavaScript Errors
Look for any JavaScript errors in the console that might prevent the dashboard from loading:

1. Open DevTools Console
2. Look for red error messages
3. Check if any imports are failing
4. Verify all components render correctly

## Testing Checklist

### Admin Dashboard
- [ ] User is logged in as admin (karunanithi)
- [ ] Console shows "Admin Dashboard: Loading stats..."
- [ ] Console shows stat values: profiles: 6, subjects: 5, etc.
- [ ] Network tab shows successful API calls
- [ ] Dashboard cards display correct values
- [ ] No errors in console

### Principal Dashboard
- [ ] User is logged in as principal (Amutha G)
- [ ] Console shows "Loading stats for school_id: ..."
- [ ] Console shows stat values: Teachers: 1, Students: 2, etc.
- [ ] Network tab shows successful API calls
- [ ] Dashboard cards display correct values
- [ ] No errors in console

## Quick Fixes Applied

### Fix 1: Principal Dashboard (Commits: 9ba9b6a, 330ba44)
- Changed from `getAllProfiles()` to school-specific API calls
- Added school_id validation
- Improved loading state management
- Added console.log debugging

### Fix 2: Admin Dashboard (Commit: 7305f02)
- Added console.log debugging
- Improved loading state management
- Better error tracking

## Next Steps

1. **Test in Browser**: Open both dashboards and check browser console
2. **Verify Authentication**: Ensure users are properly logged in
3. **Check Network Calls**: Verify API calls return data
4. **Review Console Logs**: Look for debug messages and errors
5. **Test RLS Policies**: Verify policies allow proper access

## Common Issues and Solutions

### Issue: "Loading..." never disappears
**Cause**: API calls are hanging or failing silently
**Solution**: Check network tab for failed requests, verify Supabase URL and keys

### Issue: Console shows errors about "relation does not exist"
**Cause**: Database tables not created or migrations not applied
**Solution**: Run migrations in Supabase

### Issue: Console shows "is_admin is not a function"
**Cause**: Helper functions not created in database
**Solution**: Run the migration that creates helper functions

### Issue: Network calls return empty arrays
**Cause**: RLS policies blocking access
**Solution**: Verify RLS policies allow access for the user's role

### Issue: school_id is NULL for principal
**Cause**: Principal profile not properly set up
**Solution**: Update principal profile with correct school_id:
```sql
UPDATE profiles 
SET school_id = 'c8e300c5-1e14-45df-bb71-69c4d604a047'
WHERE id = '4b30b8a8-71f3-43fd-a108-b09ae973c765';
```

## Database Verification Queries

### Check All Users
```sql
SELECT id, full_name, email, role, school_id 
FROM profiles 
ORDER BY role, full_name;
```

### Check School Assignment
```sql
SELECT 
  p.full_name,
  p.role,
  s.school_name,
  s.school_code
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.id
WHERE p.role IN ('principal', 'teacher', 'student')
ORDER BY p.role, p.full_name;
```

### Check Counts by School
```sql
SELECT 
  s.school_name,
  COUNT(CASE WHEN p.role = 'teacher' THEN 1 END) as teachers,
  COUNT(CASE WHEN p.role = 'student' THEN 1 END) as students
FROM schools s
LEFT JOIN profiles p ON s.id = p.school_id
GROUP BY s.id, s.school_name;
```

## Status

**Current Status**: ✅ Code fixes applied, debugging added

**Next Action**: Test in browser with actual user login

**Expected Outcome**: 
- Admin Dashboard shows: 6 users, 5 subjects, 0 questions, 0 exams
- Principal Dashboard shows: 1 teacher, 2 students, 0 exams

---

**Last Updated**: December 15, 2024
**Issue Reported By**: User
**Fixed By**: AI Assistant
**Status**: Awaiting browser testing
