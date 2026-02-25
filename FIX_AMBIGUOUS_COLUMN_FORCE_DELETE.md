# Fix: Ambiguous Column Reference in force_delete_exam Function

## 🐛 Error Description

**Error Message:**
```
column reference "exam_id" is ambiguous
POST https://[supabase-url]/rest/v1/rpc/force_delete_exam 400 (Bad Request)
```

**Location:** `force_delete_exam` RPC function

**Impact:** Principals and Admins could not force delete exams with student attempts

---

## 🔍 Root Cause

The error occurred because the function parameter was named `exam_id`, which is the same name as columns in multiple tables (`exam_attempts.exam_id`, `exams.id`). When the function referenced `exam_id` without table qualification, PostgreSQL couldn't determine which column was intended.

**Problematic Code:**
```sql
-- Line 70 in original function
SELECT COUNT(*) INTO attempts_count
FROM exam_attempts
WHERE exam_id = force_delete_exam.exam_id;  -- ❌ Ambiguous!
```

The database couldn't tell if `exam_id` referred to:
- The function parameter `force_delete_exam.exam_id`
- The table column `exam_attempts.exam_id`

---

## ✅ Solution

### 1. Renamed Function Parameter
Changed parameter name from `exam_id` to `p_exam_id` to avoid naming conflicts:

**Before:**
```sql
CREATE OR REPLACE FUNCTION force_delete_exam(exam_id uuid)
```

**After:**
```sql
CREATE OR REPLACE FUNCTION force_delete_exam(p_exam_id uuid)
```

### 2. Explicitly Qualified All Column References

Added table name prefixes to all column references:

**Before:**
```sql
-- Ambiguous references
SELECT EXISTS(SELECT 1 FROM exams WHERE id = exam_id) INTO exam_exists;
SELECT COUNT(*) FROM exam_attempts WHERE exam_id = force_delete_exam.exam_id;
DELETE FROM exams WHERE id = exam_id;
```

**After:**
```sql
-- Explicit table qualifications
SELECT EXISTS(SELECT 1 FROM exams WHERE exams.id = p_exam_id) INTO exam_exists;
SELECT COUNT(*) FROM exam_attempts WHERE exam_attempts.exam_id = p_exam_id;
DELETE FROM exams WHERE exams.id = p_exam_id;
```

---

## 📝 Complete Fixed Function

```sql
CREATE OR REPLACE FUNCTION force_delete_exam(p_exam_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role user_role;
  exam_exists boolean;
  attempts_count integer;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();

  -- Check if user is Principal or Admin
  IF current_user_role NOT IN ('principal'::user_role, 'admin'::user_role) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Unauthorized: Only Principals and Admins can force delete exams'
    );
  END IF;

  -- Check if exam exists (explicitly qualify column)
  SELECT EXISTS(SELECT 1 FROM exams WHERE exams.id = p_exam_id) INTO exam_exists;
  
  IF NOT exam_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Exam not found'
    );
  END IF;

  -- Get attempt count for logging (explicitly qualify column)
  SELECT COUNT(*) INTO attempts_count
  FROM exam_attempts
  WHERE exam_attempts.exam_id = p_exam_id;

  -- Delete the exam (CASCADE will handle related records)
  DELETE FROM exams WHERE exams.id = p_exam_id;

  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Exam and all associated data deleted successfully',
    'attempts_deleted', attempts_count
  );
END;
$$;
```

---

## 🔧 Changes Made

### Migration File
**File:** `supabase/migrations/00032_fix_force_delete_exam_ambiguous_column.sql`

**Changes:**
1. ✅ Renamed parameter from `exam_id` to `p_exam_id`
2. ✅ Added `exams.id` qualification in EXISTS check
3. ✅ Added `exam_attempts.exam_id` qualification in COUNT query
4. ✅ Added `exams.id` qualification in DELETE statement
5. ✅ Updated function comment to reflect fix

---

## 🧪 Testing

### Test Case 1: Force Delete Exam Without Attempts
```sql
-- Should succeed
SELECT force_delete_exam('exam-uuid-here');

-- Expected Result:
{
  "success": true,
  "message": "Exam and all associated data deleted successfully",
  "attempts_deleted": 0
}
```

### Test Case 2: Force Delete Exam With Attempts
```sql
-- Should succeed and delete all attempts
SELECT force_delete_exam('exam-uuid-with-attempts');

-- Expected Result:
{
  "success": true,
  "message": "Exam and all associated data deleted successfully",
  "attempts_deleted": 5
}
```

### Test Case 3: Unauthorized User
```sql
-- Should fail for teachers
SELECT force_delete_exam('exam-uuid-here');

-- Expected Result:
{
  "success": false,
  "message": "Unauthorized: Only Principals and Admins can force delete exams"
}
```

### Test Case 4: Non-Existent Exam
```sql
-- Should fail gracefully
SELECT force_delete_exam('00000000-0000-0000-0000-000000000000');

-- Expected Result:
{
  "success": false,
  "message": "Exam not found"
}
```

---

## ✅ Verification Steps

1. **Login as Principal or Admin**
2. **Navigate to Manage Exams page**
3. **Find an exam with student attempts**
4. **Click the Delete dropdown**
5. **Select "Force Delete Exam"**
6. **Type "DELETE" in the confirmation dialog**
7. **Click Confirm**
8. **Verify:**
   - ✅ No error appears
   - ✅ Success toast notification shows
   - ✅ Exam is removed from the list
   - ✅ All student attempts are deleted
   - ✅ All related data is removed

---

## 📊 Impact

### Before Fix
- ❌ Force delete failed with "ambiguous column" error
- ❌ Principals/Admins couldn't delete exams with attempts
- ❌ Error appeared in console and UI

### After Fix
- ✅ Force delete works correctly
- ✅ Principals/Admins can delete any exam
- ✅ All related data is properly cascade deleted
- ✅ No errors in console or UI

---

## 🎯 Key Learnings

### Best Practices for SQL Functions

1. **Use Prefixed Parameter Names**
   ```sql
   -- ✅ Good: Clear prefix
   CREATE FUNCTION my_function(p_user_id uuid, p_name text)
   
   -- ❌ Bad: Conflicts with column names
   CREATE FUNCTION my_function(user_id uuid, name text)
   ```

2. **Always Qualify Column References**
   ```sql
   -- ✅ Good: Explicit table name
   WHERE users.id = p_user_id
   
   -- ❌ Bad: Ambiguous
   WHERE id = user_id
   ```

3. **Use Descriptive Variable Names**
   ```sql
   -- ✅ Good: Clear purpose
   DECLARE
     v_user_count integer;
     v_is_admin boolean;
   
   -- ❌ Bad: Generic names
   DECLARE
     count integer;
     flag boolean;
   ```

---

## 📚 Related Documentation

- **Force Delete Feature:** `FORCE_DELETE_EXAM_FEATURE.md`
- **Role-Based Delete:** `ROLE_BASED_DELETE_UPDATE.md`
- **Manage Exams Access:** `ENABLE_MANAGE_EXAMS_FOR_PRINCIPAL_ADMIN.md`

---

## 🎉 Resolution Complete

The ambiguous column reference error has been fixed. The `force_delete_exam` function now works correctly for Principals and Admins.

**Status:** ✅ FIXED AND DEPLOYED

**Migration Applied:** `00032_fix_force_delete_exam_ambiguous_column.sql`

**Date:** December 25, 2024

---

**The force delete functionality is now fully operational!**
