# Principal-School Assignment Synchronization Fix

## Problem Description

### Issue
When a principal clicks the "Total Teachers" card on the Principal Dashboard, they receive an error message:

```
Error: You are not assigned to any school
```

### Root Cause

The system has a **bidirectional relationship** between schools and principals:

1. **schools.principal_id** → Points to the principal's profile
2. **profiles.school_id** → Points to the school

**The Problem:**
- When a school is created or updated with a principal (schools.principal_id is set)
- The principal's profile (profiles.school_id) was **not automatically updated**
- This caused the principal to not have a school_id in their profile
- The Teachers List page checks for profile.school_id to fetch teachers
- Without school_id, the error "You are not assigned to any school" is shown

### Example

**Before Fix:**
```
schools table:
{ id: 'school-1', school_name: 'GHS IRULAKURICHI', principal_id: 'user-1' }

profiles table:
{ id: 'user-1', username: 'hm_amutha', role: 'principal', school_id: null }
                                                                      ^^^^
                                                                    PROBLEM!
```

**After Fix:**
```
schools table:
{ id: 'school-1', school_name: 'GHS IRULAKURICHI', principal_id: 'user-1' }

profiles table:
{ id: 'user-1', username: 'hm_amutha', role: 'principal', school_id: 'school-1' }
                                                                      ^^^^^^^^^^^
                                                                      FIXED!
```

---

## Solution Implemented

### 1. Automatic Synchronization Triggers

Created database triggers that automatically sync the school_id to the principal's profile whenever:
- A school is created with a principal assigned
- A school's principal is changed

### 2. Data Fix for Existing Records

Updated all existing principals to have the correct school_id based on their school assignment.

---

## Technical Implementation

### Migration File

**File:** `supabase/migrations/20240112000010_sync_principal_school_assignment.sql`

### Function Created

**Function:** `sync_principal_school_assignment()`

**Type:** SECURITY DEFINER (runs with elevated privileges)

**Purpose:** Automatically syncs school_id to principal's profile when principal is assigned

**Logic:**
```sql
1. When principal_id is set (not null):
   - Update profiles.school_id = schools.id WHERE profiles.id = principal_id

2. When principal_id is changed (from one principal to another):
   - Clear old principal's school_id (set to NULL)
   - Set new principal's school_id to the school's id
```

### Triggers Created

#### 1. trigger_sync_principal_school_on_insert

**Fires:** AFTER INSERT on schools table  
**Condition:** When NEW.principal_id IS NOT NULL  
**Action:** Updates the principal's profile with the school_id

**Example:**
```sql
-- Admin creates a school with a principal
INSERT INTO schools (school_name, principal_id, ...) 
VALUES ('GHS IRULAKURICHI', 'user-1', ...);

-- Trigger automatically executes:
UPDATE profiles SET school_id = 'school-1' WHERE id = 'user-1';
```

#### 2. trigger_sync_principal_school_on_update

**Fires:** AFTER UPDATE on schools table  
**Condition:** When OLD.principal_id IS DISTINCT FROM NEW.principal_id  
**Action:** Updates new principal's school_id and clears old principal's school_id

**Example:**
```sql
-- Admin changes the principal of a school
UPDATE schools 
SET principal_id = 'user-2' 
WHERE id = 'school-1';

-- Trigger automatically executes:
-- 1. Clear old principal's school_id
UPDATE profiles SET school_id = NULL WHERE id = 'user-1';

-- 2. Set new principal's school_id
UPDATE profiles SET school_id = 'school-1' WHERE id = 'user-2';
```

### Data Fix Query

**Purpose:** Fix existing data where principals are assigned but don't have school_id

```sql
UPDATE profiles p
SET school_id = s.id
FROM schools s
WHERE s.principal_id = p.id
  AND (p.school_id IS NULL OR p.school_id != s.id);
```

**What it does:**
- Finds all schools that have a principal assigned
- Updates the principal's profile to have the correct school_id
- Only updates if school_id is missing or incorrect

---

## Verification

### Check Principal's School Assignment

```sql
SELECT 
  p.username,
  p.full_name,
  p.role,
  p.school_id,
  s.school_name,
  s.principal_id
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.id
WHERE p.role = 'principal';
```

**Expected Result:**
```
username    | full_name | role      | school_id  | school_name       | principal_id
------------|-----------|-----------|------------|-------------------|-------------
hm_amutha   | Amutha G  | principal | school-1   | GHS IRULAKURICHI  | user-1
```

**Key Points:**
- ✅ school_id is NOT NULL
- ✅ school_name matches the assigned school
- ✅ principal_id matches the user's id

### Check Teachers in the Same School

```sql
SELECT 
  p.username,
  p.full_name,
  p.role,
  p.school_id,
  s.school_name
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.id
WHERE p.school_id = 'school-1'
  AND p.role = 'teacher';
```

**Expected Result:**
```
username | full_name          | role    | school_id | school_name
---------|--------------------|---------|-----------|-----------------
chozan   | Sundharachozan S   | teacher | school-1  | GHS IRULAKURICHI
```

**Key Points:**
- ✅ Teachers have the same school_id as the principal
- ✅ Principal can now view these teachers

---

## How It Works Now

### Scenario 1: Admin Creates School with Principal

**Step 1:** Admin creates a school and assigns a principal
```
Admin → School Management → Create School
- School Name: "GHS IRULAKURICHI"
- Principal: "Amutha G"
- Click "Create"
```

**Step 2:** Database operations
```sql
-- 1. School is inserted
INSERT INTO schools (school_name, principal_id, ...) 
VALUES ('GHS IRULAKURICHI', 'user-1', ...);

-- 2. Trigger fires automatically
-- sync_principal_school_assignment() is called

-- 3. Principal's profile is updated
UPDATE profiles SET school_id = 'school-1' WHERE id = 'user-1';
```

**Step 3:** Result
- ✅ School created
- ✅ Principal assigned to school
- ✅ Principal's profile has school_id set
- ✅ Principal can now view teachers from this school

### Scenario 2: Admin Changes School's Principal

**Step 1:** Admin changes the principal of a school
```
Admin → School Management → Edit School
- Current Principal: "Amutha G"
- New Principal: "Rajesh K"
- Click "Update"
```

**Step 2:** Database operations
```sql
-- 1. School is updated
UPDATE schools SET principal_id = 'user-2' WHERE id = 'school-1';

-- 2. Trigger fires automatically
-- sync_principal_school_assignment() is called

-- 3. Old principal's school_id is cleared
UPDATE profiles SET school_id = NULL WHERE id = 'user-1';

-- 4. New principal's school_id is set
UPDATE profiles SET school_id = 'school-1' WHERE id = 'user-2';
```

**Step 3:** Result
- ✅ School's principal changed
- ✅ Old principal no longer has school_id
- ✅ New principal has school_id set
- ✅ New principal can now view teachers from this school
- ✅ Old principal cannot view teachers from this school anymore

### Scenario 3: Principal Views Teachers List

**Step 1:** Principal logs in and goes to dashboard
```
Principal → Login → Dashboard
```

**Step 2:** Principal clicks "Total Teachers" card
```
Principal → Dashboard → Click "Total Teachers" card
```

**Step 3:** System checks principal's school_id
```typescript
// TeachersList.tsx
if (!profile?.school_id) {
  toast({
    title: 'Error',
    description: 'You are not assigned to any school',
    variant: 'destructive',
  });
  return;
}
```

**Step 4:** If school_id exists, fetch teachers
```typescript
const data = await profileApi.getTeachersBySchoolId(profile.school_id);
```

**Step 5:** Display teachers list
```
Teachers List Page
- Header: "All Teachers of This School"
- School Name: "GHS IRULAKURICHI"
- Teachers: 1 teacher found
  - Sundharachozan S (chozan)
```

---

## Benefits

### 1. Automatic Synchronization

✅ **No Manual Updates Needed**
- Admins don't need to manually update principal's school_id
- System handles it automatically

✅ **Consistent Data**
- schools.principal_id and profiles.school_id are always in sync
- No data inconsistencies

### 2. Handles Edge Cases

✅ **Principal Change**
- Old principal's school_id is cleared
- New principal's school_id is set
- No orphaned data

✅ **Principal Removal**
- If principal_id is set to NULL, old principal's school_id is cleared
- Clean data state

### 3. Fixes Existing Data

✅ **Retroactive Fix**
- Migration includes data fix query
- All existing principals are updated
- No manual intervention needed

---

## Testing

### Test Case 1: Create School with Principal

**Steps:**
1. Login as admin
2. Go to School Management
3. Create a new school
4. Assign a principal
5. Click "Create"

**Expected Result:**
- School is created
- Principal's profile has school_id set
- Principal can view teachers list

**Verification:**
```sql
SELECT school_id FROM profiles WHERE id = '<principal_id>';
-- Should return the school's id
```

### Test Case 2: Change School's Principal

**Steps:**
1. Login as admin
2. Go to School Management
3. Edit an existing school
4. Change the principal
5. Click "Update"

**Expected Result:**
- Old principal's school_id is cleared
- New principal's school_id is set
- New principal can view teachers list
- Old principal cannot view teachers list

**Verification:**
```sql
-- Old principal should have NULL school_id
SELECT school_id FROM profiles WHERE id = '<old_principal_id>';
-- Should return NULL

-- New principal should have the school's id
SELECT school_id FROM profiles WHERE id = '<new_principal_id>';
-- Should return the school's id
```

### Test Case 3: Principal Views Teachers List

**Steps:**
1. Login as principal (e.g., hm_amutha)
2. Go to Principal Dashboard
3. Click "Total Teachers" card

**Expected Result:**
- Teachers List page loads successfully
- Shows all teachers from the same school
- No error message

**Verification:**
- Page header shows "All Teachers of This School"
- School name is displayed
- Teachers are listed in the table

---

## Troubleshooting

### Issue: Principal still gets "You are not assigned to any school" error

**Possible Causes:**
1. Migration not applied
2. Principal not assigned to any school in School Management
3. Database trigger not working

**Solution:**

**Step 1:** Check if migration is applied
```sql
SELECT * FROM supabase_migrations 
WHERE name = '20240112000010_sync_principal_school_assignment';
```

**Step 2:** Check if principal has school_id
```sql
SELECT id, username, school_id 
FROM profiles 
WHERE username = 'hm_amutha';
```

**Step 3:** Check if school has principal assigned
```sql
SELECT id, school_name, principal_id 
FROM schools 
WHERE school_name = 'GHS IRULAKURICHI';
```

**Step 4:** Manually fix if needed
```sql
-- Get the school's id
SELECT id FROM schools WHERE school_name = 'GHS IRULAKURICHI';

-- Get the principal's id
SELECT id FROM profiles WHERE username = 'hm_amutha';

-- Update principal's school_id
UPDATE profiles 
SET school_id = '<school_id>' 
WHERE id = '<principal_id>';
```

### Issue: Trigger not firing

**Check if triggers exist:**
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%sync_principal_school%';
```

**Expected Result:**
```
trigger_name                           | event_manipulation | event_object_table
---------------------------------------|--------------------|-----------------
trigger_sync_principal_school_on_insert| INSERT             | schools
trigger_sync_principal_school_on_update| UPDATE             | schools
```

**If triggers don't exist, reapply migration:**
```sql
-- Run the migration SQL manually
```

---

## Summary

✅ **Problem Solved:** Principals can now view teachers list  
✅ **Automatic Sync:** school_id is automatically updated when principal is assigned  
✅ **Data Fixed:** All existing principals have correct school_id  
✅ **Edge Cases Handled:** Principal changes are handled correctly  
✅ **No Manual Work:** Admins don't need to manually update school_id  

**Status:** ✅ Fixed and Tested  
**Migration:** 20240112000010_sync_principal_school_assignment.sql  
**Last Updated:** 2025-01-12
