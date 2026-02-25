# Storage Calculation Bug Fix - Quick Reference

## Issue
User "chozan" with 31 questions in the question bank showed:
- File Storage: 0 Bytes
- Database Storage: 0 Bytes
- Total Storage: 0 Bytes

## Root Cause
1. **Incorrect Column References**: The `calculate_user_database_size` function used wrong column names
   - Used `exams.created_by` but the actual column is `exams.teacher_id`
   - Referenced non-existent tables `student_answers` and `exam_results`

2. **No Initial Data**: The `storage_usage` table was empty - no calculation had been run

## Fix Applied

### Migration: fix_storage_calculation_function
Updated the `calculate_user_database_size` function to:

**Corrected Column References**:
- ✅ Changed `exams.created_by` → `exams.teacher_id`
- ✅ Removed references to non-existent tables

**Added Missing Tables**:
- ✅ question_papers (created_by = user_id)
- ✅ login_history (user_id)
- ✅ active_sessions (user_id)
- ✅ exam_attempts (student_id = user_id)
- ✅ exam_answers (via exam_attempts.student_id)

**Complete List of Tables in Calculation**:
1. `profiles` - User profile data
2. `questions` - Questions created by user (created_by)
3. `exams` - Exams created by teacher (teacher_id)
4. `exam_attempts` - Student exam attempts (student_id)
5. `exam_answers` - Student answers (via attempt_id → student_id)
6. `question_papers` - Question papers created (created_by)
7. `login_history` - User login records (user_id)
8. `active_sessions` - Active user sessions (user_id)

## Verification

### Before Fix
```sql
-- User chozan storage data
username: chozan
file_storage_bytes: NULL
database_storage_bytes: NULL
total_storage_bytes: NULL
```

### After Fix
```sql
-- User chozan storage data
username: chozan
file_storage_bytes: 0
database_storage_bytes: 9021 (9 KB)
total_storage_bytes: 9021 (9 KB)
```

### Test Query
```sql
-- Test the function for any user
SELECT calculate_user_database_size('USER_ID_HERE'::uuid) as database_size;

-- Verify storage data
SELECT 
  p.username,
  su.file_storage_bytes,
  su.database_storage_bytes,
  su.file_storage_bytes + su.database_storage_bytes as total_storage_bytes
FROM storage_usage su
JOIN profiles p ON su.user_id = p.id
WHERE p.username = 'chozan';
```

## How to Populate Storage Data for All Users

### Option 1: Via Admin UI (Recommended)
1. Login as admin
2. Navigate to Admin Dashboard → Storage Monitoring
3. Click "Refresh Storage" button
4. Wait for calculation to complete
5. All users will now show correct storage data

### Option 2: Via SQL (For Testing)
```sql
-- Manually populate for a specific user
INSERT INTO storage_usage (user_id, file_storage_bytes, database_storage_bytes, last_calculated_at, updated_at)
VALUES (
  'USER_ID_HERE'::uuid,
  0,
  calculate_user_database_size('USER_ID_HERE'::uuid),
  NOW(),
  NOW()
)
ON CONFLICT (user_id)
DO UPDATE SET
  database_storage_bytes = calculate_user_database_size(EXCLUDED.user_id),
  last_calculated_at = NOW(),
  updated_at = NOW();
```

## Impact
- ✅ Storage monitoring now works correctly
- ✅ User "chozan" shows 9 KB database storage (31 questions)
- ✅ Function can calculate storage for all user types (admin, principal, teacher, student)
- ✅ All user-related tables are included in calculation
- ✅ No breaking changes to existing functionality

## Notes
- File storage calculation still requires the edge function to be triggered
- Database storage is calculated using PostgreSQL's `pg_column_size()` function
- Storage values are stored in bytes and formatted on display
- Admin must click "Refresh Storage" to populate data for all users
- The `recalculate_all_storage()` function requires admin authentication (security feature)

## Related Files
- Migration: `supabase/migrations/*_fix_storage_calculation_function.sql`
- Function: `calculate_user_database_size(uuid)`
- UI Page: `src/pages/admin/StorageMonitoring.tsx`
- API: `src/db/api.ts` (storageApi)
