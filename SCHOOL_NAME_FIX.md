# School Name Display Fix

## Problem
When users registered and selected a school, the "School Name" column in the Pending Users table showed "-" instead of displaying the actual school name that was selected during registration.

## Root Cause
The registration process was incorrectly passing the school **name** (a string) instead of the school **ID** (UUID) to the database. 

The `school_name` field in the Profile type is a **computed field** obtained by joining the `profiles` table with the `schools` table - it's not a direct column in the profiles table. The actual column in the profiles table is `school_id` which stores the UUID reference to the schools table.

## Solution Applied

### 1. Updated Register.tsx
**File:** `/workspace/app-85wc5xzx8yyp/src/pages/Register.tsx`

**Changes:**
- Changed state variable from `schoolName` to `schoolId`
- Updated the Select component to use `school.id` as the value instead of `school.school_name`
- Updated validation to check `schoolId` instead of `schoolName`
- Updated the signUp call to pass `schoolId` instead of `schoolName`

```tsx
// Before
const [schoolName, setSchoolName] = useState('');
<SelectItem value={school.school_name}>

// After
const [schoolId, setSchoolId] = useState('');
<SelectItem value={school.id}>
```

### 2. Updated useAuth.ts
**File:** `/workspace/app-85wc5xzx8yyp/src/hooks/useAuth.ts`

**Changes:**
- Changed parameter name from `schoolName` to `schoolId`
- Updated the profile update to set `school_id` instead of `school_name`

```tsx
// Before
schoolName?: string
if (schoolName) updates.school_name = schoolName;

// After
schoolId?: string
if (schoolId) updates.school_id = schoolId;
```

## How It Works Now

1. **User Registration:**
   - User selects a school from the dropdown
   - The school's UUID (id) is stored in the `schoolId` state
   - On form submission, the `schoolId` is passed to the signUp function

2. **Database Storage:**
   - The `school_id` (UUID) is saved to the `profiles.school_id` column
   - This creates a foreign key relationship with the `schools` table

3. **Data Retrieval:**
   - When fetching profiles, the API joins with the schools table
   - The `school_name` is retrieved from the joined schools table
   - The school name is displayed in the Pending Users table

## Database Schema
```sql
-- profiles table has school_id column
ALTER TABLE profiles 
ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE SET NULL;

-- API query joins to get school_name
SELECT 
  profiles.*,
  schools.school_name
FROM profiles
LEFT JOIN schools ON profiles.school_id = schools.id;
```

## Testing
- ✅ Lint check passed with no errors
- ✅ Code compiles successfully
- ✅ Registration flow updated correctly
- ✅ School name will now display in Pending Users table

## Impact
- **Users:** When registering, the selected school will now be properly saved and displayed
- **Admins:** The Pending Users table will show the correct school name for each pending user
- **Database:** Proper foreign key relationship maintained between profiles and schools

## Files Modified
1. `/workspace/app-85wc5xzx8yyp/src/pages/Register.tsx`
2. `/workspace/app-85wc5xzx8yyp/src/hooks/useAuth.ts`

## No Breaking Changes
This fix does not affect:
- Existing database schema
- Existing API queries
- Other parts of the application
- User experience (except fixing the bug)
