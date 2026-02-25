# Teachers List Feature - Principal Dashboard

## Overview

This feature allows Principals to view all teachers belonging to their school by clicking on the "Total Teachers" card in the Principal Dashboard.

---

## Feature Requirements

### Functional Requirements

✅ **Click Trigger**: Clicking the "Total Teachers" card opens the Teachers List page  
✅ **School-Based Data**: Shows all teachers from the same school (using `school_id`)  
✅ **No User Filtering**: Does NOT filter by logged-in user ID  
✅ **Access Control**: Only Principal can view this list  
✅ **Search & Sort**: Enables search and sort functionality  
✅ **Total Count**: Shows total count of teachers at the top  

### Data Rules

✅ **Fetch by school_id**: Uses principal's `school_id` to fetch teachers  
✅ **All Teachers**: Shows ALL teachers from the school, not just those created by the principal  
✅ **School-Wise Data**: Data is school-wise, not user-wise  

### Display Fields

✅ **Teacher Name**: Full name or username  
✅ **Username**: Login username  
✅ **Email**: Email address  
✅ **Phone Number**: Contact number  
✅ **Status**: Active/Pending/Suspended status  

### UX Requirements

✅ **Header**: "All Teachers of This School"  
✅ **School Name**: Displays the school name in the header  
✅ **Search**: Search by name, username, phone, or email  
✅ **Sort**: Sort by Teacher Name or Phone Number  
✅ **Total Count**: Shows "X of Y" teachers (filtered vs total)  
✅ **Back Button**: Navigate back to Principal Dashboard  

---

## Implementation Details

### 1. API Function

**File**: `src/db/api.ts`

**Function**: `profileApi.getTeachersBySchoolId(schoolId: string)`

```typescript
async getTeachersBySchoolId(schoolId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      schools!profiles_school_id_fkey (
        school_name
      )
    `)
    .eq('role', 'teacher')
    .eq('school_id', schoolId)
    .order('full_name', { ascending: true });
  if (error) throw error;
  
  const profiles = Array.isArray(data) ? data : [];
  return profiles.map((profile: any) => ({
    ...profile,
    school_name: profile.schools?.school_name || null,
    schools: undefined
  }));
}
```

**Key Points:**
- Filters by `role = 'teacher'`
- Filters by `school_id` (passed as parameter)
- Orders by `full_name` alphabetically
- Includes school name in the response
- Returns empty array if no data

---

### 2. Teachers List Page

**File**: `src/pages/principal/TeachersList.tsx`

**Features:**
- Loads teachers using `profileApi.getTeachersBySchoolId()`
- Search functionality (filters by name, username, phone, email)
- Sort functionality (by Teacher Name or Phone Number)
- Displays total count and filtered count
- Shows status badges (Active, Pending, Suspended)
- Summary cards showing statistics

**Components Used:**
- Card, CardContent, CardHeader, CardTitle
- Input (for search)
- Button (for back navigation)
- Table, TableBody, TableCell, TableHead, TableHeader, TableRow
- Icons: ArrowLeft, Search, Users

**State Management:**
- `teachers`: All teachers from the school
- `filteredTeachers`: Filtered and sorted teachers
- `searchQuery`: Current search query
- `sortField`: Current sort field (full_name or phone)
- `sortOrder`: Current sort order (asc or desc)

---

### 3. Principal Dashboard Updates

**File**: `src/pages/principal/PrincipalDashboard.tsx`

**Changes:**
1. Added `useNavigate` hook
2. Updated `statCards` array to include:
   - `onClick` handler for "Total Teachers" card
   - `clickable` flag to indicate clickable cards
3. Updated card rendering:
   - Added `cursor-pointer` and `hover:shadow-lg` classes for clickable cards
   - Added `onClick` handler
   - Added "Click to view details" hint text

**Visual Feedback:**
- Hover effect on "Total Teachers" card
- Shadow transition on hover
- Hint text below the count

---

### 4. Route Configuration

**File**: `src/routes.tsx`

**New Route:**
```typescript
{
  name: 'Teachers List',
  path: '/principal/teachers',
  element: (
    <ProtectedRoute allowedRoles={['principal']}>
      <TeachersList />
    </ProtectedRoute>
  ),
  visible: false,
}
```

**Access Control:**
- Protected route
- Only accessible by users with `role = 'principal'`
- Redirects to login if not authenticated
- Shows "Access Denied" if wrong role

---

## User Flow

### Step 1: Principal Dashboard

1. Principal logs in
2. Sees the dashboard with stat cards
3. "Total Teachers" card shows the count
4. Card has hover effect and "Click to view details" text

### Step 2: Click "Total Teachers" Card

1. Principal clicks the "Total Teachers" card
2. Navigates to `/principal/teachers`
3. Page loads with loading spinner

### Step 3: Teachers List Page

1. Page loads all teachers from the school
2. Displays header: "All Teachers of This School"
3. Shows school name below the header
4. Displays total count: "Teachers List (X of Y)"
5. Shows search bar
6. Shows table with all teachers

### Step 4: Search and Sort

1. Principal can search by name, username, phone, or email
2. Filtered count updates: "Teachers List (X of Y)"
3. Principal can click column headers to sort
4. Sort indicator shows current sort direction (↑ or ↓)

### Step 5: View Summary

1. Scroll down to see summary cards
2. Shows total teachers, active teachers, and pending teachers
3. Visual indicators with icons and colors

### Step 6: Return to Dashboard

1. Click the back button (arrow icon)
2. Navigates back to `/principal`
3. Dashboard loads with updated stats

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Principal Dashboard                                         │
│                                                               │
│  ┌──────────────────┐                                        │
│  │ Total Teachers   │  ← Click                               │
│  │      15          │                                         │
│  │ Click to view... │                                         │
│  └──────────────────┘                                        │
│         │                                                     │
│         │ navigate('/principal/teachers')                    │
│         ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Teachers List Page                                  │    │
│  │                                                       │    │
│  │  1. Get principal's profile                          │    │
│  │     - Extract school_id                              │    │
│  │                                                       │    │
│  │  2. Call API: getTeachersBySchoolId(school_id)       │    │
│  │     ↓                                                 │    │
│  │  3. Supabase Query:                                  │    │
│  │     SELECT * FROM profiles                           │    │
│  │     WHERE role = 'teacher'                           │    │
│  │     AND school_id = '<principal_school_id>'          │    │
│  │     ORDER BY full_name ASC                           │    │
│  │     ↓                                                 │    │
│  │  4. Returns ALL teachers from the school             │    │
│  │     (not filtered by logged-in user)                 │    │
│  │     ↓                                                 │    │
│  │  5. Display in table with search & sort              │    │
│  │                                                       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Access Control

### Who Can Access?

✅ **Principal**: Can view all teachers from their school  
❌ **Admin**: Cannot access this page (has separate User Management)  
❌ **Teacher**: Cannot access this page  
❌ **Student**: Cannot access this page  

### What Can They See?

**Principal:**
- All teachers from the same school
- Teacher name, username, email, phone
- Status (Active, Pending, Suspended)
- Summary statistics

**Teachers:**
- Cannot see other teachers
- Can only see students from their school (in separate page)

**Students:**
- Cannot see any teachers list
- Can only see their own profile

---

## Database Query

### SQL Query (Simplified)

```sql
SELECT 
  p.*,
  s.school_name
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.id
WHERE p.role = 'teacher'
  AND p.school_id = '<principal_school_id>'
ORDER BY p.full_name ASC;
```

### Key Points

1. **Filters by role**: Only teachers
2. **Filters by school_id**: Only from principal's school
3. **Orders by full_name**: Alphabetical order
4. **Joins schools**: To get school name
5. **No user filter**: Does NOT filter by logged-in user ID

---

## UI Components

### 1. Page Header

```
┌─────────────────────────────────────────────────────────┐
│  [←]  All Teachers of This School                       │
│       School Name                                        │
└─────────────────────────────────────────────────────────┘
```

### 2. Search and Count

```
┌─────────────────────────────────────────────────────────┐
│  👥 Teachers List (15 of 15)    [🔍 Search...]          │
└─────────────────────────────────────────────────────────┘
```

### 3. Teachers Table

```
┌─────────────────────────────────────────────────────────┐
│  #  │ Teacher Name ↑ │ Username │ Email │ Phone │ Status│
├─────┼────────────────┼──────────┼───────┼───────┼───────┤
│  1  │ John Doe       │ john123  │ ...   │ ...   │ Active│
│  2  │ Jane Smith     │ jane456  │ ...   │ ...   │ Active│
│  3  │ Bob Johnson    │ bob789   │ ...   │ ...   │Pending│
└─────────────────────────────────────────────────────────┘
```

### 4. Summary Cards

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 👥 Total     │  │ 👥 Active    │  │ 👥 Pending   │
│    15        │  │    12        │  │    3         │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Status Indicators

### Active

- **Badge Color**: Green
- **Condition**: `approved = true` AND `suspended = false`
- **Display**: "Active"

### Pending

- **Badge Color**: Yellow
- **Condition**: `approved = false`
- **Display**: "Pending"

### Suspended

- **Badge Color**: Red
- **Condition**: `suspended = true`
- **Display**: "Suspended"

---

## Search Functionality

### Search Fields

- Teacher Name (full_name)
- Username
- Phone Number
- Email

### Search Behavior

1. Case-insensitive search
2. Partial match (contains)
3. Updates filtered count in real-time
4. Shows "No teachers found matching your search" if no results

### Example

**Search Query**: "john"

**Matches:**
- Full Name: "John Doe"
- Username: "john123"
- Email: "john@example.com"

---

## Sort Functionality

### Sortable Columns

1. **Teacher Name** (full_name)
2. **Phone Number** (phone)

### Sort Behavior

1. Click column header to sort
2. First click: Ascending (↑)
3. Second click: Descending (↓)
4. Third click: Back to ascending
5. Sort indicator shows current direction

### Default Sort

- **Field**: Teacher Name (full_name)
- **Order**: Ascending (A-Z)

---

## Error Handling

### No School Assigned

**Condition**: Principal has no `school_id`

**Behavior:**
- Shows toast error: "You are not assigned to any school"
- Does not load teachers
- Shows empty state

### API Error

**Condition**: API call fails

**Behavior:**
- Shows toast error: "Failed to load teachers list"
- Logs error to console
- Shows empty state

### No Teachers Found

**Condition**: School has no teachers

**Behavior:**
- Shows empty state with icon
- Message: "No teachers found in this school"

---

## Testing Checklist

### Functional Testing

- [ ] Click "Total Teachers" card navigates to Teachers List page
- [ ] Page loads all teachers from the same school
- [ ] Search filters teachers correctly
- [ ] Sort by Teacher Name works (ascending/descending)
- [ ] Sort by Phone Number works (ascending/descending)
- [ ] Total count displays correctly
- [ ] Filtered count updates when searching
- [ ] Status badges display correctly
- [ ] Summary cards show correct statistics
- [ ] Back button returns to Principal Dashboard

### Access Control Testing

- [ ] Principal can access the page
- [ ] Admin cannot access the page
- [ ] Teacher cannot access the page
- [ ] Student cannot access the page
- [ ] Unauthenticated users redirected to login

### Data Testing

- [ ] Shows all teachers from the school (not just created by principal)
- [ ] Does not show teachers from other schools
- [ ] Handles empty state (no teachers)
- [ ] Handles error state (API failure)
- [ ] Handles missing school_id

### UI/UX Testing

- [ ] Hover effect on "Total Teachers" card
- [ ] "Click to view details" hint text visible
- [ ] Loading spinner shows while loading
- [ ] Search bar works smoothly
- [ ] Sort indicators display correctly
- [ ] Table is responsive
- [ ] Empty state is user-friendly
- [ ] Error messages are clear

---

## Future Enhancements

### Possible Improvements

1. **Subject Assignment**
   - Add subject field to teachers
   - Show subjects taught by each teacher
   - Filter by subject

2. **Teacher Details Page**
   - Click teacher row to view details
   - Show exams created by teacher
   - Show students taught by teacher

3. **Export Functionality**
   - Export teachers list to CSV
   - Export to PDF
   - Print-friendly view

4. **Bulk Actions**
   - Select multiple teachers
   - Bulk approve/suspend
   - Bulk email

5. **Advanced Filters**
   - Filter by status (Active/Pending/Suspended)
   - Filter by subject
   - Filter by date joined

6. **Pagination**
   - Add pagination for large lists
   - Configurable page size
   - Jump to page

---

## Related Documentation

- **ROLE_BASED_ACCESS_IMPLEMENTATION.md** - Access control details
- **ACCESS_CONTROL_VISUAL_GUIDE.md** - Visual reference for permissions
- **SCHOOL_ISOLATION_GUIDE.md** - School-based multi-tenancy
- **TESTING_QUICK_START.md** - Testing guide

---

## Summary

✅ **Feature Complete**: All requirements implemented  
✅ **Access Control**: Only Principal can access  
✅ **Data Integrity**: Fetches by school_id, not user_id  
✅ **User Experience**: Search, sort, and summary statistics  
✅ **Error Handling**: Proper error messages and empty states  
✅ **Code Quality**: Passes linting, follows best practices  

**Status**: ✅ Ready for Testing  
**Last Updated**: 2025-01-12  
**Version**: 1.0
