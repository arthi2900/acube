# Login History Fix - All User Roles

## Problem Identified

When non-admin users (Principal, Teacher, Student) logged in, the system was recording **Admin's details** instead of their own details in the login_history table. This was caused by a timing issue in how the user profile was being fetched.

## Root Cause

The issue was in the `getCurrentProfile()` function in `/src/db/api.ts`:

```typescript
// OLD CODE - PROBLEMATIC
async getCurrentProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`...`)
    .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
    .maybeSingle();
```

**Problem**: When `supabase.auth.getUser()` was called inline immediately after authentication, there could be a race condition or timing issue where:
1. The auth session wasn't fully established yet
2. The function might return cached or incorrect user data
3. This resulted in fetching the wrong user's profile (often defaulting to Admin)

## Solution Implemented

### 1. Modified `getCurrentProfile()` to Accept User ID

**File**: `/src/db/api.ts`

```typescript
// NEW CODE - FIXED
async getCurrentProfile(userId?: string): Promise<Profile | null> {
  // If userId is provided, use it; otherwise get from auth
  let targetUserId = userId;
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    targetUserId = user?.id || '';
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select(`...`)
    .eq('id', targetUserId)
    .maybeSingle();
  // ... rest of the code
}
```

**Benefits**:
- ✅ Allows explicit user ID to be passed
- ✅ Eliminates timing issues
- ✅ Maintains backward compatibility (optional parameter)
- ✅ More reliable and predictable

### 2. Updated `signIn()` to Pass User ID Explicitly

**File**: `/src/hooks/useAuth.ts`

```typescript
const signIn = async (username: string, password: string) => {
  const email = `${username}@miaoda.com`;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  
  // Track login immediately after successful authentication
  if (data.user) {
    try {
      // Pass the authenticated user's ID explicitly to avoid timing issues
      const userProfile = await profileApi.getCurrentProfile(data.user.id);
      
      if (userProfile) {
        // Verify we're tracking the correct user
        console.log('Tracking login for user:', {
          userId: userProfile.id,
          username: userProfile.username,
          role: userProfile.role,
          authUserId: data.user.id
        });
        
        // Create login history record immediately
        await loginHistoryApi.createLoginHistory(
          userProfile.id,
          userProfile.username,
          userProfile.full_name,
          userProfile.role,
          userProfile.school_id,
          null,
          navigator.userAgent
        );
        
        // Create or update active session
        await activeSessionApi.upsertActiveSession(
          userProfile.id,
          userProfile.username,
          userProfile.full_name,
          userProfile.role,
          userProfile.school_id,
          null,
          navigator.userAgent
        );
      }
    } catch (trackError) {
      console.error('Error tracking login:', trackError);
    }
  }
  
  return data;
};
```

**Key Changes**:
- ✅ Pass `data.user.id` explicitly to `getCurrentProfile()`
- ✅ Use the user ID from the authentication response (guaranteed to be correct)
- ✅ Added console logging for verification
- ✅ Ensures correct user profile is fetched every time

### 3. Added UPDATE Policy for Login History

**Migration**: `add_update_policy_for_login_history.sql`

```sql
-- Add UPDATE policy for login_history to allow users to update their own logout times
CREATE POLICY "Users can update their own login history"
  ON login_history FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**Purpose**:
- ✅ Allows users to update their own logout times
- ✅ Ensures security (users can only update their own records)
- ✅ Required for the logout tracking to work for all user roles

## How It Works Now

### Login Flow for All User Roles

```
1. User enters credentials (Admin/Principal/Teacher/Student)
   ↓
2. Authentication with Supabase
   ↓
3. Get authenticated user ID from response: data.user.id
   ↓
4. Fetch profile using explicit user ID: getCurrentProfile(data.user.id)
   ↓
5. Create login history record with CORRECT user details:
   - user_id: [authenticated user's ID]
   - username: [authenticated user's username]
   - full_name: [authenticated user's full name]
   - role: [authenticated user's role - admin/principal/teacher/student]
   - school_id: [authenticated user's school ID]
   - login_time: [current timestamp]
   - user_agent: [browser information]
   ↓
6. Create/update active session
   ↓
7. Show "Login successful" message
   ↓
8. Redirect to role-specific dashboard
```

### Logout Flow for All User Roles

```
1. User clicks "Logout"
   ↓
2. Find most recent login record for THIS user (where logout_time is NULL)
   ↓
3. Update logout_time with current timestamp
   ↓
4. Update active session status to 'logged_out'
   ↓
5. Sign out from Supabase
   ↓
6. Show "Logged out successfully" message
   ↓
7. Redirect to login page
```

## Verification Steps

### For Admin:
1. Login as Admin
2. Check console log: Should show Admin's details
3. Check database:
   ```sql
   SELECT * FROM login_history 
   WHERE role = 'admin' 
   ORDER BY login_time DESC 
   LIMIT 1;
   ```
4. Verify: username, full_name, role should all be Admin's details

### For Principal:
1. Login as Principal
2. Check console log: Should show Principal's details (NOT Admin's)
3. Check database:
   ```sql
   SELECT * FROM login_history 
   WHERE role = 'principal' 
   ORDER BY login_time DESC 
   LIMIT 1;
   ```
4. Verify: username, full_name, role should all be Principal's details

### For Teacher:
1. Login as Teacher
2. Check console log: Should show Teacher's details (NOT Admin's)
3. Check database:
   ```sql
   SELECT * FROM login_history 
   WHERE role = 'teacher' 
   ORDER BY login_time DESC 
   LIMIT 1;
   ```
4. Verify: username, full_name, role should all be Teacher's details

### For Student:
1. Login as Student
2. Check console log: Should show Student's details (NOT Admin's)
3. Check database:
   ```sql
   SELECT * FROM login_history 
   WHERE role = 'student' 
   ORDER BY login_time DESC 
   LIMIT 1;
   ```
4. Verify: username, full_name, role should all be Student's details

## Console Logging

Added debug logging to help verify the fix:

```javascript
console.log('Tracking login for user:', {
  userId: userProfile.id,
  username: userProfile.username,
  role: userProfile.role,
  authUserId: data.user.id
});
```

**What to check**:
- ✅ `userId` should match `authUserId`
- ✅ `username` should be the logged-in user's username
- ✅ `role` should be the logged-in user's role (not always 'admin')

## Database Policies

### Current Policies on login_history:

1. **SELECT Policy** (Admin only):
   ```sql
   "Admin can view all login history"
   ```
   - Only admins can view all login history records
   - Other users cannot view login history (for privacy)

2. **INSERT Policy** (All authenticated users):
   ```sql
   "System can insert login history"
   ```
   - Any authenticated user can insert their login record
   - Required for login tracking to work

3. **UPDATE Policy** (Users can update their own):
   ```sql
   "Users can update their own login history"
   ```
   - Users can only update records where `user_id = auth.uid()`
   - Required for logout tracking to work
   - Ensures security (can't modify other users' records)

## Testing Checklist

- [ ] **Admin Login**: Records Admin's details correctly
- [ ] **Admin Logout**: Updates Admin's logout time correctly
- [ ] **Principal Login**: Records Principal's details (NOT Admin's)
- [ ] **Principal Logout**: Updates Principal's logout time
- [ ] **Teacher Login**: Records Teacher's details (NOT Admin's)
- [ ] **Teacher Logout**: Updates Teacher's logout time
- [ ] **Student Login**: Records Student's details (NOT Admin's)
- [ ] **Student Logout**: Updates Student's logout time
- [ ] **Console Logs**: Show correct user details for each role
- [ ] **Database Records**: Each role has their own records with correct details
- [ ] **No Errors**: No errors in browser console during login/logout

## Common Issues & Solutions

### Issue: Still seeing Admin's details for other users

**Solution**:
1. Clear browser cache and cookies
2. Logout completely and login again
3. Check console logs to verify correct user ID is being used
4. Verify the profile exists in the database:
   ```sql
   SELECT id, username, full_name, role FROM profiles WHERE username = 'your_username';
   ```

### Issue: Logout time not updating for non-admin users

**Solution**:
1. Verify the UPDATE policy was created:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'login_history' AND cmd = 'UPDATE';
   ```
2. Check if the login record exists:
   ```sql
   SELECT * FROM login_history WHERE user_id = 'your_user_id' AND logout_time IS NULL;
   ```

### Issue: No login record created for non-admin users

**Solution**:
1. Check browser console for errors
2. Verify INSERT policy allows all authenticated users:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'login_history' AND cmd = 'INSERT';
   ```
3. Check if user profile exists in profiles table

## Summary

The fix ensures that **ALL user roles** (Admin, Principal, Teacher, Student) have their **own details** correctly recorded in the login_history table:

✅ **Admin** → Admin's details recorded  
✅ **Principal** → Principal's details recorded (NOT Admin's)  
✅ **Teacher** → Teacher's details recorded (NOT Admin's)  
✅ **Student** → Student's details recorded (NOT Admin's)  

The solution eliminates timing issues by passing the authenticated user's ID explicitly from the authentication response, ensuring the correct profile is always fetched and recorded.
