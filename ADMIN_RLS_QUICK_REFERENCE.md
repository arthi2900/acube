# Admin RLS Bypass - Quick Reference

## Summary

✅ **All 20 database tables now have admin RLS bypass policies**

Admins can perform **ALL operations** (SELECT, INSERT, UPDATE, DELETE) on **ALL tables** without RLS restrictions.

## Tables with Admin Bypass (20 Total)

| # | Table Name | Total Policies | Admin Bypass | Other Policies |
|---|------------|----------------|--------------|----------------|
| 1 | active_sessions | 2 | ✅ | 1 (user own session) |
| 2 | error_logs | 2 | ✅ | 1 (insert) |
| 3 | exam_answers | 7 | ✅ | 6 (student/teacher/principal) |
| 4 | exam_attempts | 6 | ✅ | 5 (student/teacher/principal) |
| 5 | exam_student_allocations | 6 | ✅ | 5 (student/teacher/principal) |
| 6 | exams | 8 | ✅ | 7 (student/teacher/principal) |
| 7 | global_questions | 2 | ✅ | 1 (all users view) |
| 8 | lessons | 5 | ✅ | 4 (teacher/public view) |
| 9 | login_history | 3 | ✅ | 2 (user own/insert) |
| 10 | profiles | 5 | ✅ | 4 (user own/teacher/principal) |
| 11 | question_paper_questions | 7 | ✅ | 6 (teacher/student/principal) |
| 12 | question_paper_templates | 5 | ✅ | 4 (teacher own) |
| 13 | question_paper_versions | 5 | ✅ | 4 (teacher own) |
| 14 | question_papers | 6 | ✅ | 5 (teacher/principal) |
| 15 | questions | 5 | ✅ | 4 (teacher/student/principal) |
| 16 | schools | 2 | ✅ | 1 (public view) |
| 17 | storage_history | 1 | ✅ | 0 |
| 18 | storage_usage | 1 | ✅ | 0 |
| 19 | subjects | 4 | ✅ | 3 (teacher/student/principal) |
| 20 | system_capacity | 1 | ✅ | 0 |

## Policy Details

### Policy Name Pattern
```
"Admins bypass RLS for [table_name]"
```

### Policy Configuration
```sql
FOR ALL                          -- All operations (SELECT, INSERT, UPDATE, DELETE)
TO authenticated                 -- Only authenticated users
USING (is_admin(auth.uid()))     -- Check if user is admin
WITH CHECK (is_admin(auth.uid())) -- Check if user is admin
```

## How to Check if User is Admin

### SQL Function
```sql
SELECT is_admin(auth.uid());
-- Returns: true (if admin) or false (if not admin)
```

### Function Definition
```sql
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$function$
```

## Access Matrix

| Role | Access Level | RLS Applied? | Can View All Data? | Can Modify All Data? |
|------|--------------|--------------|-------------------|---------------------|
| **Admin** | Full | ❌ No (Bypassed) | ✅ Yes | ✅ Yes |
| **Principal** | School-wide | ✅ Yes | ❌ No (school only) | ⚠️ Limited (school only) |
| **Teacher** | Class/Subject | ✅ Yes | ❌ No (own classes) | ⚠️ Limited (own content) |
| **Student** | Personal | ✅ Yes | ❌ No (own data) | ⚠️ Limited (own answers) |

## Testing Commands

### 1. Verify Admin Bypass Policies Exist
```sql
SELECT tablename, policyname
FROM pg_policies 
WHERE schemaname = 'public'
  AND policyname LIKE '%Admins bypass RLS%'
ORDER BY tablename;
```
**Expected**: 20 rows (one per table)

### 2. Test Admin Function
```sql
-- Replace with actual admin user UUID
SELECT is_admin('your-admin-uuid-here');
```
**Expected**: `true`

### 3. Count Policies Per Table
```sql
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;
```

### 4. Test Admin Access (as admin user)
```sql
-- Should return ALL profiles
SELECT COUNT(*) FROM profiles;

-- Should succeed
INSERT INTO schools (name, address) VALUES ('Test School', '123 Main St');

-- Should succeed for ANY exam
UPDATE exams SET status = 'published' WHERE id = 'any-exam-id';

-- Should succeed for ANY question
DELETE FROM questions WHERE id = 'any-question-id';
```

## Common Operations

### Check Current User Role
```sql
SELECT role FROM profiles WHERE id = auth.uid();
```

### Check if Current User is Admin
```sql
SELECT is_admin(auth.uid());
```

### List All Admin Users
```sql
SELECT id, username, full_name, email
FROM profiles
WHERE role = 'admin'::user_role;
```

### Grant Admin Role to User
```sql
-- As admin user
UPDATE profiles
SET role = 'admin'::user_role
WHERE id = 'user-uuid-here';
```

### Revoke Admin Role from User
```sql
-- As admin user
UPDATE profiles
SET role = 'teacher'::user_role  -- or 'principal', 'student'
WHERE id = 'user-uuid-here';
```

## Security Best Practices

### ✅ Do's
- ✅ Limit number of admin users
- ✅ Use strong passwords for admin accounts
- ✅ Regularly review admin user list
- ✅ Remove admin access when no longer needed
- ✅ Implement audit logging for admin actions
- ✅ Use 2FA for admin accounts (if available)

### ❌ Don'ts
- ❌ Don't share admin credentials
- ❌ Don't grant admin role unnecessarily
- ❌ Don't use admin accounts for regular operations
- ❌ Don't leave inactive admin accounts enabled
- ❌ Don't bypass security checks in application code

## Troubleshooting

### Issue: Admin can't access data
**Check:**
1. Is user's role set to 'admin' in profiles table?
   ```sql
   SELECT role FROM profiles WHERE id = auth.uid();
   ```
2. Is the is_admin() function working?
   ```sql
   SELECT is_admin(auth.uid());
   ```
3. Are the admin bypass policies in place?
   ```sql
   SELECT COUNT(*) FROM pg_policies 
   WHERE policyname LIKE '%Admins bypass RLS%';
   ```
   Expected: 20

### Issue: Non-admin can access admin data
**Check:**
1. Is RLS enabled on the table?
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'your_table';
   ```
2. Are there overly permissive policies?
   ```sql
   SELECT policyname, qual, with_check
   FROM pg_policies
   WHERE tablename = 'your_table';
   ```

### Issue: Policy changes not taking effect
**Solution:**
1. Reconnect to database
2. Clear Supabase client cache
3. Verify policy was created:
   ```sql
   SELECT * FROM pg_policies WHERE policyname = 'your_policy_name';
   ```

## Migration Info

**Migration Name**: `admin_bypass_rls_comprehensive`  
**Date Applied**: 2025-12-11  
**Tables Modified**: 20  
**Policies Created**: 20  
**Policies Removed**: 15+  

## Related Functions

### is_admin(uuid)
Checks if a user is an admin
```sql
SELECT is_admin('user-uuid');
```

### is_teacher(uuid)
Checks if a user is a teacher
```sql
SELECT is_teacher('user-uuid');
```

### is_principal(uuid)
Checks if a user is a principal
```sql
SELECT is_principal('user-uuid');
```

### get_user_role()
Gets the current user's role
```sql
SELECT get_user_role();
```

### get_user_school_id()
Gets the current user's school ID
```sql
SELECT get_user_school_id();
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│           ADMIN RLS BYPASS - QUICK REFERENCE            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✅ Admin Access: FULL (all tables, all operations)    │
│  ❌ RLS Applied to Admins: NO (bypassed)               │
│  📊 Tables with Bypass: 20/20                          │
│  🔐 Function Used: is_admin(auth.uid())                │
│                                                         │
│  Policy Name Pattern:                                   │
│  "Admins bypass RLS for [table_name]"                  │
│                                                         │
│  Check if Admin:                                        │
│  SELECT is_admin(auth.uid());                          │
│                                                         │
│  List Admin Users:                                      │
│  SELECT * FROM profiles WHERE role = 'admin';          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Status

✅ **Implementation Complete**  
✅ **All Tables Covered**  
✅ **Policies Verified**  
✅ **Function Working**  
✅ **Documentation Complete**

---

**Last Updated**: 2025-12-11  
**Version**: 1.0  
**Status**: Production Ready
