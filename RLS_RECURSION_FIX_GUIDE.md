# RLS Policy Recursion Fix Guide

## Problem Summary

### Error Encountered
```
Failed to load resource: the server responded with a status of 500 ()
Error: infinite recursion detected in policy for relation "profiles"
```

### Root Cause
The RLS (Row Level Security) policies on the `profiles` table were creating infinite recursion by querying the same table they were protecting.

**Example of problematic policy:**
```sql
CREATE POLICY "Principals can view teachers and students"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p  -- ❌ Querying profiles while checking profiles!
    WHERE p.id = auth.uid()
    AND p.role = 'principal'
    ...
  )
);
```

When a user tried to query the `profiles` table:
1. PostgreSQL checks the RLS policy
2. The policy queries the `profiles` table
3. PostgreSQL checks the RLS policy again (recursion!)
4. This continues infinitely until PostgreSQL detects it and throws an error

---

## Solution Implemented

### 1. Security Definer Functions

Created helper functions that use `SECURITY DEFINER` to bypass RLS during permission checks:

```sql
-- Function to get current user's role (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER  -- ✅ Bypasses RLS
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Function to get current user's school_id (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER  -- ✅ Bypasses RLS
STABLE
AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid();
$$;
```

**Key Points:**
- `SECURITY DEFINER` makes the function run with the privileges of the function owner (bypassing RLS)
- `STABLE` indicates the function doesn't modify data and can be cached
- These functions break the recursion chain by executing outside RLS context

### 2. Updated RLS Policies

Rewrote policies to use the security definer functions instead of subqueries:

**Before (Recursive):**
```sql
CREATE POLICY "Principals can view teachers and students"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p  -- ❌ Causes recursion
    WHERE p.id = auth.uid()
    AND p.role = 'principal'
    ...
  )
);
```

**After (Non-Recursive):**
```sql
CREATE POLICY "Principals can view teachers and students"
ON profiles FOR SELECT
USING (
  get_user_role() = 'principal'  -- ✅ No recursion
  AND school_id IS NOT NULL
  AND school_id = get_user_school_id()  -- ✅ No recursion
  AND role IN ('teacher', 'student')
);
```

### 3. Cleaned Up Duplicate Policies

Removed all duplicate and conflicting policies to ensure clean, predictable behavior.

**Final Policy Set:**
1. **Admins have full access** - ALL operations on all profiles
2. **Users can view own profile** - SELECT own profile
3. **Principals can view teachers and students** - SELECT teachers/students from their school
4. **Teachers can view students** - SELECT students from their school
5. **Users can update own profile** - UPDATE own profile (except role/school_id)

---

## Technical Details

### Why SECURITY DEFINER Works

```
Normal Query Flow (with recursion):
User Query → RLS Check → Subquery → RLS Check → Subquery → ... (infinite)

With SECURITY DEFINER:
User Query → RLS Check → Function Call (bypasses RLS) → Returns result → Policy evaluates
```

The function executes with elevated privileges, so it doesn't trigger RLS checks on the `profiles` table.

### Security Considerations

**Q: Is SECURITY DEFINER safe?**  
A: Yes, when used correctly:
- Functions are read-only (no INSERT/UPDATE/DELETE)
- Functions only return minimal information (role, school_id)
- Functions only access current user's data (auth.uid())
- Functions cannot be exploited to access other users' data

**Q: Can users bypass security with these functions?**  
A: No:
- Functions are hardcoded to use `auth.uid()` (current user)
- Users cannot pass arbitrary user IDs
- Functions only return data about the current user
- RLS policies still enforce all access rules

---

## Migrations Applied

### Migration 1: `20240112000008_fix_rls_recursion.sql`
- Created `get_user_role()` with SECURITY DEFINER
- Updated `get_user_school_id()` to use SECURITY DEFINER
- Dropped old recursive policies
- Created new non-recursive policies

### Migration 2: `20240112000009_cleanup_duplicate_policies.sql`
- Dropped all duplicate policies
- Created clean, non-overlapping policy set
- Added policy descriptions

---

## Verification Steps

### 1. Check Functions Use SECURITY DEFINER
```sql
SELECT 
  proname,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname IN ('get_user_role', 'get_user_school_id');
```

**Expected Result:**
```
proname              | is_security_definer
---------------------|--------------------
get_user_role        | true
get_user_school_id   | true
```

### 2. Check Policies Are Clean
```sql
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
```

**Expected Result:**
```
policyname                              | cmd
----------------------------------------|--------
Admins have full access                 | ALL
Principals can view teachers and students | SELECT
Teachers can view students              | SELECT
Users can update own profile            | UPDATE
Users can view own profile              | SELECT
```

### 3. Test Login
- Try logging in with any user
- Should succeed without 500 error
- Should load profile correctly
- Should see appropriate users based on role

---

## Troubleshooting

### Issue: Still Getting 500 Error

**Check 1: Verify migrations applied**
```sql
SELECT * FROM supabase_migrations.schema_migrations 
WHERE version LIKE '202401120000%'
ORDER BY version;
```

Should see:
- `20240112000006_add_school_isolation`
- `20240112000007_refine_school_isolation_by_role`
- `20240112000008_fix_rls_recursion`
- `20240112000009_cleanup_duplicate_policies`

**Check 2: Verify no duplicate policies**
```sql
SELECT policyname, COUNT(*) 
FROM pg_policies 
WHERE tablename = 'profiles'
GROUP BY policyname
HAVING COUNT(*) > 1;
```

Should return no rows (no duplicates).

**Check 3: Check for other recursive policies**
```sql
-- Look for policies that might query profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  qual
FROM pg_policies 
WHERE qual LIKE '%profiles%'
AND tablename = 'profiles';
```

Should only show policies using functions, not subqueries.

### Issue: Users Can't See Expected Data

**Check role and school assignment:**
```sql
SELECT 
  id,
  username,
  role,
  school_id,
  approved
FROM profiles
WHERE username = 'your_username';
```

Verify:
- User has correct role
- User has school_id assigned (if not admin)
- User is approved

**Test policy manually:**
```sql
-- Set session to specific user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid-here"}';

-- Try to query profiles
SELECT * FROM profiles;
```

---

## Best Practices for RLS Policies

### ✅ DO:
1. Use SECURITY DEFINER functions for permission checks
2. Keep policies simple and non-overlapping
3. Test policies with different user roles
4. Document policy intent clearly
5. Use helper functions to avoid code duplication

### ❌ DON'T:
1. Query the same table in its own RLS policy
2. Create duplicate policies for the same operation
3. Use complex subqueries in policies
4. Forget to test with non-admin users
5. Mix different access patterns in one policy

---

## Related Documentation

- **ROLE_BASED_ACCESS_IMPLEMENTATION.md** - Complete access control guide
- **SCHOOL_ISOLATION_GUIDE.md** - School isolation details
- **ACCESS_CONTROL_VISUAL_GUIDE.md** - Visual reference

---

## Summary

✅ **Problem:** Infinite recursion in RLS policies  
✅ **Cause:** Policies querying profiles table while checking profiles table  
✅ **Solution:** SECURITY DEFINER functions to break recursion  
✅ **Result:** Login works, no 500 errors, clean policy set  

**Status:** ✅ Fixed and Tested  
**Migrations Applied:** 2  
**Date:** 2025-01-12
