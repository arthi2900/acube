# Force Delete Exam - Quick Reference

## Overview
Enhanced delete functionality allowing Principal/Admin to permanently delete exams with student attempts.

## Access Control

| Role | Normal Delete | Force Delete |
|------|--------------|--------------|
| Teacher | ✅ (no attempts only) | ❌ Not available |
| Principal | ✅ (no attempts only) | ✅ Available |
| Admin | ✅ (no attempts only) | ✅ Available |

## How to Use

### For Teachers
1. Click **Delete** button on exam card
2. System checks for attempts
3. If attempts exist → Error message
4. If no attempts → Confirm and delete

### For Principal/Admin
1. Click **Delete** button (dropdown appears)
2. Choose option:
   - **Normal Delete** - Same as teacher (blocked if attempts exist)
   - **Force Delete** - Delete even with attempts
3. For Force Delete:
   - Review warning and exam details
   - Type **DELETE** (exact, uppercase)
   - Click **Force Delete** button
4. Success message appears

## Force Delete Confirmation

### Required Steps
1. ⚠️ Read warning message
2. 📋 Review exam details and attempt count
3. ⌨️ Type "DELETE" exactly (case-sensitive)
4. ✅ Click "Force Delete" button

### What Gets Deleted
- ❌ Exam record
- ❌ All student attempts
- ❌ All student answers
- ❌ All result data

**⚠️ This action cannot be undone!**

## UI Differences

### Teacher View
```
[View Results] [Delete]
```

### Principal/Admin View
```
[View Results] [Delete ▼]
                ├─ Normal Delete
                └─ Force Delete
```

## Error Messages

### Normal Delete with Attempts
```
Cannot Delete Exam
X student(s) have already attempted this exam.
```

### Unauthorized Access
```
Error
Unauthorized: Only Principals and Admins can force delete exams
```

### Success
```
Success
Exam and all associated data deleted successfully
```

## Best Practices

### ✅ Do
- Try Normal Delete first
- Review attempt count before Force Delete
- Inform affected students
- Export data if needed
- Use Force Delete sparingly

### ❌ Don't
- Force delete without checking attempts
- Use for routine cleanup (use Normal Delete)
- Delete without informing stakeholders
- Bypass confirmation dialog

## When to Use Each Option

### Normal Delete
- Draft exams
- Unused exams
- No student attempts
- Standard cleanup

### Force Delete
- Exam needs recreation
- Data correction required
- System maintenance
- Removing test exams
- Compliance requirements

## Security Features

1. **Role Validation** - Database-level check
2. **Text Confirmation** - Must type "DELETE"
3. **Visual Warnings** - Red alerts and icons
4. **Attempt Count Display** - Shows impact
5. **Disabled States** - Prevents accidental clicks

## Technical Details

### Database Function
- **Name**: `force_delete_exam(exam_id uuid)`
- **Security**: DEFINER (bypasses RLS for authorized users)
- **Returns**: JSON with success status and message

### Cascade Deletion
```
exams → exam_attempts → exam_answers
  ↓         ↓              ↓
DELETE   DELETE        DELETE
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Force Delete not visible | Check user role (must be Principal/Admin) |
| Button stays disabled | Type exactly "DELETE" in capitals |
| Unauthorized error | Verify role in profiles table |
| Deletion fails | Check browser console, verify RPC exists |

## Files Modified

1. **Database**: `supabase/migrations/add_force_delete_exam_function.sql`
2. **API**: `src/db/api.ts` - Added `forceDeleteExam()` method
3. **Component**: `src/components/ui/force-delete-dialog.tsx` - New dialog
4. **Page**: `src/pages/teacher/ManageExams.tsx` - Updated UI

## Testing Checklist

- [ ] Teacher cannot see Force Delete option
- [ ] Principal can see dropdown menu
- [ ] Normal Delete blocks when attempts exist
- [ ] Force Delete requires typing "DELETE"
- [ ] Force Delete removes all data
- [ ] Success message appears
- [ ] Exam list refreshes automatically
- [ ] Unauthorized access prevented

## Quick Commands

### Check User Role (SQL)
```sql
SELECT role FROM profiles WHERE id = auth.uid();
```

### Check Exam Attempts (SQL)
```sql
SELECT COUNT(*) FROM exam_attempts WHERE exam_id = '<exam-id>';
```

### Verify Force Delete Function (SQL)
```sql
SELECT force_delete_exam('<exam-id>');
```

## Support

For issues or questions:
1. Check browser console for errors
2. Verify user role in database
3. Ensure RPC function exists
4. Review full documentation: `FORCE_DELETE_EXAM_FEATURE.md`

---

**⚠️ Remember**: Force Delete is permanent and cannot be undone. Always verify before confirming!
