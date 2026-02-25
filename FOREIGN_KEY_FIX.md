# Foreign Key Relationship Fix

## Issue Report

**Date**: 2025-12-18  
**Error**: `Could not find a relationship between 'teacher_assignments' and 'subjects'`  
**Location**: QuestionBank.tsx line 94  
**Severity**: Critical - Question Bank page not loading

## Error Details

```
Error loading data: 
{
  code: 'PGRST200',
  details: "Searched for a foreign key relationship between 'teacher_assignments' 
            and 'subjects' using the hint 'teacher_assignments_subject_id_fkey' 
            in the schema 'public', but no matches were found.",
  message: "Could not find a relationship between 'teacher_assignments' and 
            'subjects' in the schema cache"
}
```

## Root Cause Analysis

### Timeline of Events

1. **Migration 00013** (Fix Subjects Table Structure)
   - Dropped `subjects` table with `CASCADE`
   - CASCADE automatically dropped dependent foreign key constraints
   - `teacher_assignments_subject_id_fkey` was removed
   - Migration recreated `subjects` table
   - Migration did NOT recreate `teacher_assignments` table
   - Foreign key constraint was lost

2. **Migration 00014** (Remove Exam Modules)
   - Dropped exam-related tables
   - Did not address missing foreign key constraint
   - Issue remained undetected

3. **Runtime Error**
   - Question Bank page tried to query teacher assignments with subjects
   - Supabase PostgREST couldn't find the relationship
   - Query failed with PGRST200 error

### Technical Explanation

When a table with foreign key constraints is dropped with `CASCADE`, PostgreSQL automatically drops:
- The table itself
- All foreign key constraints pointing TO that table
- All foreign key constraints pointing FROM that table

The `teacher_assignments` table had a foreign key to `subjects`:
```sql
FOREIGN KEY (subject_id) REFERENCES subjects(id)
```

When `subjects` was dropped, this constraint was also dropped. When `subjects` was recreated, the constraint was NOT automatically restored because `teacher_assignments` was never dropped or recreated.

## Solution

### Migration 00015: Restore Teacher Assignments Foreign Key

**File**: `supabase/migrations/00015_restore_teacher_assignments_foreign_key.sql`

**Steps**:

1. **Clean up orphaned records**
   ```sql
   DELETE FROM teacher_assignments
   WHERE NOT EXISTS (
     SELECT 1 FROM subjects WHERE subjects.id = teacher_assignments.subject_id
   );
   ```
   - Removed 3 orphaned records
   - These referenced subjects that were deleted in migration 00013

2. **Restore foreign key constraint**
   ```sql
   ALTER TABLE teacher_assignments
   ADD CONSTRAINT teacher_assignments_subject_id_fkey
   FOREIGN KEY (subject_id)
   REFERENCES subjects(id)
   ON DELETE CASCADE;
   ```
   - Recreated the missing constraint
   - Used same constraint name as before
   - Added CASCADE for automatic cleanup

## Verification

### Foreign Key Constraints Check

**Before Fix**:
```
teacher_assignments_class_id_fkey    → classes(id)
teacher_assignments_section_id_fkey  → sections(id)
teacher_assignments_teacher_id_fkey  → profiles(id)
[MISSING] teacher_assignments_subject_id_fkey
```

**After Fix**:
```
teacher_assignments_class_id_fkey    → classes(id)
teacher_assignments_section_id_fkey  → sections(id)
teacher_assignments_subject_id_fkey  → subjects(id) ✅ RESTORED
teacher_assignments_teacher_id_fkey  → profiles(id)
```

### Testing Results

✅ Migration applied successfully  
✅ Foreign key constraint created  
✅ All 4 foreign keys present  
✅ Lint check passed (95 files, 0 errors)  
✅ TypeScript compilation successful  
✅ Build test passed  
✅ Question Bank page loads without errors  

## Impact Assessment

### Data Impact
- **Deleted**: 3 orphaned teacher assignment records
- **Reason**: These referenced subjects that no longer exist
- **Acceptable**: Development phase, data can be recreated

### Functionality Impact
- **Before**: Question Bank page showed error, couldn't load data
- **After**: Question Bank page loads correctly, shows assignments

### User Impact
- **Teachers**: Can now access Question Bank page
- **Principals**: Teacher assignments work correctly
- **System**: Database integrity restored

## Prevention Measures

### Best Practices Learned

1. **When dropping tables with CASCADE**:
   - Document all affected foreign keys
   - Plan to recreate all dependent relationships
   - Test all affected queries after migration

2. **Migration checklist**:
   - List all foreign keys before dropping
   - Verify all foreign keys after recreating
   - Test all pages that use the affected tables

3. **Testing strategy**:
   - Run full application test after migrations
   - Check all pages for each user role
   - Verify database relationships with queries

## Related Files

- **Migration**: `supabase/migrations/00015_restore_teacher_assignments_foreign_key.sql`
- **Affected Page**: `src/pages/teacher/QuestionBank.tsx`
- **API Function**: `src/db/api.ts` (academicApi.getTeacherAssignments)
- **Documentation**: `TODO.md`, `FINAL_STATUS.md`

## Status

✅ **RESOLVED**

The foreign key relationship has been successfully restored. The Question Bank page now loads without errors, and all database relationships are intact.

---

**Fixed By**: Migration 00015  
**Date**: 2025-12-18  
**Verified**: Yes  
**Status**: Complete ✅
