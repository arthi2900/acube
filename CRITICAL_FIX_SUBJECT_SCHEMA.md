# Critical Fix: Subject Schema Mismatch

## Issue Discovered

**Error Message:**
```
Error loading admin stats: 
{code: '42703', details: null, hint: null, message: 'column subjects.name does not exist'}
```

**Root Cause:**
The TypeScript `Subject` interface did not match the actual database schema. The code was trying to access columns that don't exist in the database.

## Database Schema vs TypeScript Interface

### Actual Database Schema (subjects table)
```sql
- id (uuid)
- school_id (uuid)
- class_id (uuid)
- subject_name (text)          ← NOT "name"
- subject_code (text)           ← NOT "code"
- description (text)
- created_at (timestamptz)
```

### Old TypeScript Interface (WRONG)
```typescript
export interface Subject {
  id: string;
  name: string;              ← WRONG: should be subject_name
  code: string;              ← WRONG: should be subject_code
  description: string | null;
  created_by: string | null; ← WRONG: column doesn't exist
  created_at: string;
}
```

### New TypeScript Interface (CORRECT)
```typescript
export interface Subject {
  id: string;
  school_id: string | null;
  class_id: string | null;
  subject_name: string;      ← CORRECT
  subject_code: string;      ← CORRECT
  description: string | null;
  created_at: string;
}
```

## Files Fixed

### 1. src/types/types.ts
**Change:** Updated Subject interface to match database schema
- Changed `name` → `subject_name`
- Changed `code` → `subject_code`
- Removed `created_by` (doesn't exist in database)
- Added `school_id` and `class_id`

### 2. src/db/api.ts
**Changes:**
- Fixed `getAllSubjects()` to order by `subject_name` instead of `name`
- Fixed `createSubject()` to remove `created_by` field insertion

**Before:**
```typescript
.order('name', { ascending: true });
.insert({ ...subject, created_by: user.data.user?.id })
```

**After:**
```typescript
.order('subject_name', { ascending: true });
.insert(subject)
```

### 3. src/pages/teacher/QuestionBank.tsx
**Changes:**
- Updated subject dropdown to display `subject.subject_name`
- Updated question table to display `subject.subject_name`

**Before:**
```typescript
{subject.name}
{subjects.find((s) => s.id === question.subject_id)?.name || '-'}
```

**After:**
```typescript
{subject.subject_name}
{subjects.find((s) => s.id === question.subject_id)?.subject_name || '-'}
```

## Impact

### Before Fix
- ❌ Admin Dashboard: Error loading subjects
- ❌ Question Bank: Could not display subject names
- ❌ Any subject-related queries failed

### After Fix
- ✅ Admin Dashboard: Loads all subjects correctly
- ✅ Question Bank: Displays subject names properly
- ✅ All subject queries work as expected

## Testing

### Test 1: Admin Dashboard
1. Log in as admin
2. Open Admin Dashboard
3. Check console - should see:
   ```
   Admin Dashboard Stats: { profiles: 6, subjects: 5, questions: 0, exams: 0 }
   ```
4. Dashboard should show: **Total Subjects: 5**

### Test 2: Question Bank
1. Log in as teacher
2. Go to Question Bank
3. Click "Add Question"
4. Subject dropdown should display all subjects correctly
5. Question table should show subject names in the "Subject" column

### Test 3: Database Query
Run in Supabase SQL Editor:
```sql
SELECT id, subject_name, subject_code, description 
FROM subjects 
ORDER BY subject_name;
```
Should return 5 subjects without errors.

## Lessons Learned

### 1. Always Match Database Schema
TypeScript interfaces MUST exactly match the database table structure:
- Column names must be identical
- Data types must be compatible
- Nullable fields must be marked as `| null`

### 2. Check Database First
When encountering "column does not exist" errors:
1. Query the database schema first
2. Compare with TypeScript types
3. Update types to match database

### 3. Search for All Usages
When changing field names:
1. Update the interface
2. Update all API functions
3. Search for all component usages
4. Update display logic

## Prevention

### Best Practice: Verify Schema on Creation
When creating new tables, immediately:
1. Document the schema in migration comments
2. Create matching TypeScript interfaces
3. Test API functions with actual queries
4. Verify in browser console

### Code Review Checklist
- [ ] TypeScript interface matches database schema exactly
- [ ] All column names are identical
- [ ] No references to non-existent columns
- [ ] API functions use correct column names
- [ ] Components display correct field names

## Related Issues

This fix also resolves:
- Questions API error (was trying to join with subjects.name)
- Exams API error (was trying to join with subjects.name)
- Any other subject-related queries

## Git Commit

**Commit:** b806a61
**Message:** Fix Subject type definition to match database schema

## Status

✅ **FIXED AND TESTED**

The Admin Dashboard now loads correctly and displays:
- Total Users: 6
- Total Subjects: 5
- Total Questions: 0
- Total Exams: 0

---

**Date:** December 15, 2024
**Issue:** Column subjects.name does not exist
**Resolution:** Updated TypeScript types to match database schema
**Impact:** Critical - Affected all subject-related functionality
