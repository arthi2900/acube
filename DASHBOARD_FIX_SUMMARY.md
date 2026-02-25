# Principal Dashboard - Teacher & Student Count Fix

## Issue Description
The Teachers and Students cards in the Principal Dashboard were showing incorrect values (0 instead of actual counts).

## Root Cause Analysis

### Initial Problem
The dashboard was using `profileApi.getAllProfiles()` which fetched ALL profiles from the entire system, not just profiles from the principal's school.

### Database Verification
Current database state for school_id `c8e300c5-1e14-45df-bb71-69c4d604a047`:
- **Teachers**: 1 teacher
- **Students**: 2 students
- **Principal**: 1 principal (email: ghsirulakurichi2011@gmail.com)

## Fixes Applied

### Fix 1: Use School-Specific API Calls (Commit: 9ba9b6a)
**Changed from:**
```typescript
const [profiles, exams] = await Promise.all([
  profileApi.getAllProfiles(),
  examApi.getAllExams(),
]);

const teachers = profiles.filter((p) => p.role === 'teacher');
const students = profiles.filter((p) => p.role === 'student');
```

**Changed to:**
```typescript
const [teachers, students, exams] = await Promise.all([
  profileApi.getTeachersBySchoolId(profile.school_id),
  profileApi.getStudentsBySchoolId(profile.school_id),
  examApi.getAllExams(),
]);
```

**Benefits:**
- Only fetches data for the principal's school
- More efficient (fewer records to fetch)
- Correct data isolation between schools
- Uses existing optimized API functions

### Fix 2: Improve Loading State Management (Commit: 330ba44)
**Improvements:**
- Always call `loadStats()` in useEffect (not conditionally)
- Set loading to false even when school_id is not available
- Set loading to true at the start of loadStats
- Add console.log debugging to track data loading
- Better handling of edge cases

**Code:**
```typescript
useEffect(() => {
  loadStats();
}, [profile?.school_id]);

const loadStats = async () => {
  if (!profile?.school_id) {
    setLoading(false);
    return;
  }

  setLoading(true);
  try {
    console.log('Loading stats for school_id:', profile.school_id);
    const [teachers, students, exams] = await Promise.all([
      profileApi.getTeachersBySchoolId(profile.school_id),
      profileApi.getStudentsBySchoolId(profile.school_id),
      examApi.getAllExams(),
    ]);

    console.log('Teachers:', teachers.length, 'Students:', students.length, 'Exams:', exams.length);

    setStats({
      totalTeachers: teachers.length,
      totalStudents: students.length,
      totalExams: exams.length,
    });
  } catch (error) {
    console.error('Error loading stats:', error);
  } finally {
    setLoading(false);
  }
};
```

## Expected Results

When the principal logs in with email `ghsirulakurichi2011@gmail.com`, the dashboard should show:
- **Teachers**: 1
- **Students**: 2
- **Exams**: (varies based on exam data)

## Verification Steps

### Step 1: Check Browser Console
1. Open the Principal Dashboard
2. Open browser DevTools (F12)
3. Check the Console tab for debug messages:
   ```
   Loading stats for school_id: c8e300c5-1e14-45df-bb71-69c4d604a047
   Teachers: 1 Students: 2 Exams: X
   ```

### Step 2: Verify Card Values
The dashboard cards should display:
- **Academic Management**: "Setup" (clickable)
- **Teachers**: 1 (clickable)
- **Students**: 2 (clickable)
- **Exams**: X (not clickable)

### Step 3: Database Verification
Run this SQL query to verify the data:
```sql
-- Check teacher count
SELECT COUNT(*) as teacher_count
FROM profiles 
WHERE role = 'teacher' 
AND school_id = 'c8e300c5-1e14-45df-bb71-69c4d604a047';

-- Check student count
SELECT COUNT(*) as student_count
FROM profiles 
WHERE role = 'student' 
AND school_id = 'c8e300c5-1e14-45df-bb71-69c4d604a047';
```

Expected results:
- teacher_count: 1
- student_count: 2

## API Functions Used

### profileApi.getTeachersBySchoolId(schoolId)
- **Location**: `src/db/api.ts` (line 121)
- **Purpose**: Fetch all teachers for a specific school
- **Query**: 
  - Filters by `role = 'teacher'`
  - Filters by `school_id = schoolId`
  - Orders by `full_name` ascending
  - Includes school name via join

### profileApi.getStudentsBySchoolId(schoolId)
- **Location**: `src/db/api.ts` (line 143)
- **Purpose**: Fetch all students for a specific school
- **Query**: 
  - Filters by `role = 'student'`
  - Filters by `school_id = schoolId`
  - Orders by `full_name` ascending
  - Includes school name via join

## Troubleshooting

### If counts are still showing 0:

1. **Check if principal has school_id:**
   ```sql
   SELECT id, email, school_id 
   FROM profiles 
   WHERE role = 'principal' 
   AND email = 'ghsirulakurichi2011@gmail.com';
   ```
   - Should return school_id: `c8e300c5-1e14-45df-bb71-69c4d604a047`

2. **Check browser console for errors:**
   - Look for "Error loading stats:" messages
   - Check if school_id is logged correctly

3. **Verify API functions work:**
   - Check Network tab in DevTools
   - Look for Supabase API calls
   - Verify response data

4. **Check authentication:**
   - Ensure user is logged in as principal
   - Verify profile is loaded in useAuth hook

### If counts are incorrect but not 0:

1. **Check for duplicate profiles:**
   ```sql
   SELECT id, email, role, school_id 
   FROM profiles 
   WHERE school_id = 'c8e300c5-1e14-45df-bb71-69c4d604a047'
   ORDER BY role, created_at;
   ```

2. **Verify school_id consistency:**
   - Ensure all teachers/students have the correct school_id
   - Check for NULL school_id values

## Related Files

- **Dashboard Component**: `src/pages/principal/PrincipalDashboard.tsx`
- **API Functions**: `src/db/api.ts`
- **Auth Hook**: `src/hooks/useAuth.tsx`
- **Profile Type**: `src/types/types.ts`

## Git Commits

1. **9ba9b6a** - Fix teacher and student count to show school-specific data
2. **330ba44** - Improve dashboard stats loading with better error handling

## Additional Notes

### Card Title Changes
Also applied in recent commits:
- "Total Teachers" → "Teachers" (Commit: 6098417)
- "Total Students" → "Students" (Commit: 6098417)
- "Total Exams" → "Exams" (Commit: 52faaa9)

These changes provide cleaner, more concise card titles.

### Future Enhancements

1. **Add refresh button** to manually reload stats
2. **Add loading skeleton** for better UX during data fetch
3. **Add error state display** when data fails to load
4. **Add empty state message** when school_id is not set
5. **Cache stats data** to reduce API calls
6. **Add real-time updates** using Supabase subscriptions

## Testing Checklist

- [x] Code passes ESLint checks
- [x] Database queries verified
- [x] API functions tested
- [x] Loading states handled correctly
- [x] Error handling implemented
- [x] Console logging added for debugging
- [ ] Browser testing completed
- [ ] Verified with actual principal login
- [ ] Checked all card values are correct

## Status

**Status**: ✅ **CODE COMPLETE - READY FOR BROWSER TESTING**

The code has been fixed and all quality checks pass. The next step is to test in the browser with the principal login to verify the counts display correctly.

---

**Last Updated**: December 14, 2024
**Fixed By**: AI Assistant
**Verified By**: Pending browser testing
