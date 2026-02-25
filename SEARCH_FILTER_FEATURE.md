# Search and Filter Feature - User Management

## Overview
Added comprehensive search and filter functionality to the User Management page, allowing administrators to quickly find and filter users by multiple criteria. Includes a filtered records count display showing the number of matching results.

## Features Implemented

### 1. Search Functionality
- **Search Input Field**: Full-text search across multiple fields
- **Searchable Fields**:
  - Username
  - Full Name
  - Email
  - School Name
- **Real-time Search**: Results update as you type
- **Clear Button**: Quick "X" button to clear search query

### 2. Role Filter
- **Filter Options**:
  - All Roles (default)
  - Admin
  - Principal
  - Teacher
  - Student
- **Dropdown Selection**: Easy-to-use select component
- **Applies to All Tabs**: Works across Pending, Active, and Suspended tabs

### 3. School Filter
- **Dynamic School List**: Automatically populated from database
- **Filter Options**:
  - All Schools (default)
  - Individual schools from the database
- **Dropdown Selection**: Easy-to-use select component
- **Applies to All Tabs**: Works across Pending, Active, and Suspended tabs

### 4. Clear Filters Button
- **Conditional Display**: Only shows when filters are active
- **One-Click Reset**: Clears all filters (search, role, school) at once
- **Visual Feedback**: Clear indication of active filters

### 5. Filtered Records Count (NEW)
- **Dynamic Count Display**: Shows the number of records matching current filters
- **Active Filters Summary**: Displays which filters are currently applied
- **Smart Formatting**: 
  - Shows "1 record found" or "X records found"
  - Displays search query in quotes
  - Shows selected role and school
  - Separates multiple filters with bullet points (•)
- **Conditional Display**: Only appears when filters are active
- **Tab-Aware**: Updates count based on active tab (Pending/Active/Suspended)

## User Interface

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  [Search Input with Icon]  [Role Filter]  [School Filter]  │
│                                          [Clear Filters]     │
│                                                              │
│  [Badge: X records found] Searching for "query" • Role: ... │
└─────────────────────────────────────────────────────────────┘
```

### Filtered Records Count Examples
- `5 records found` Searching for "ram"
- `12 records found` Role: Teacher
- `3 records found` School: GHS IRULAKURICHI
- `8 records found` Searching for "student" • Role: Student • School: GHS SATHAPADI

### Responsive Design
- **Desktop (xl+)**: All filters in a single row
- **Mobile/Tablet**: Filters stack vertically for better usability
- **Search Input**: Takes full width on mobile, flexible on desktop

## Technical Implementation

### State Management
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [roleFilter, setRoleFilter] = useState<string>('all');
const [schoolFilter, setSchoolFilter] = useState<string>('all');
```

### Filter Logic
```typescript
const filterProfiles = (profilesList: Profile[]) => {
  return profilesList.filter(profile => {
    const matchesSearch = 
      searchQuery === '' ||
      profile.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.school_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || profile.role === roleFilter;
    const matchesSchool = schoolFilter === 'all' || profile.school_id === schoolFilter;
    
    return matchesSearch && matchesRole && matchesSchool;
  });
};
```

### Applied to All Tabs
```typescript
const pendingProfiles = filterProfiles(profiles.filter(p => !p.approved));
const activeProfiles = filterProfiles(profiles.filter(p => p.approved && !p.suspended));
const suspendedProfiles = filterProfiles(profiles.filter(p => p.suspended));
```

## User Experience Enhancements

### 1. Visual Indicators
- **Search Icon**: Magnifying glass icon in search input
- **Clear Icon**: X button appears when search has text
- **Placeholder Text**: Helpful hint about searchable fields

### 2. Accessibility
- **Keyboard Navigation**: All filters accessible via keyboard
- **Clear Labels**: Descriptive placeholder text
- **Responsive Design**: Works on all screen sizes

### 3. Performance
- **Client-Side Filtering**: Instant results without server requests
- **Efficient Algorithm**: Case-insensitive string matching
- **No Lag**: Smooth filtering even with many users

## Use Cases

### Example 1: Find All Teachers in a Specific School
1. Select "Teacher" from Role Filter
2. Select school name from School Filter
3. View filtered results

### Example 2: Search for a Specific User
1. Type username or name in search box
2. Results filter in real-time
3. Clear search to see all users again

### Example 3: View All Pending Principals
1. Click "Pending" tab
2. Select "Principal" from Role Filter
3. View filtered pending principals

### Example 4: Find Users by School Name
1. Type school name in search box
2. All users from that school appear
3. Works across all tabs

## Benefits

### For Administrators
- **Time Saving**: Quickly find specific users without scrolling
- **Better Organization**: Filter by role and school for targeted management
- **Improved Workflow**: Manage users more efficiently

### For System Performance
- **No Database Load**: All filtering happens client-side
- **Fast Response**: Instant results without network requests
- **Scalable**: Works efficiently even with large user lists

## Files Modified
- `/workspace/app-85wc5xzx8yyp/src/pages/admin/UserManagement.tsx`
  - Added state variables for search and filters
  - Implemented `filterProfiles()` function
  - Added search and filter UI components
  - Updated profile lists to use filtered results

## Testing
- ✅ Lint check passed
- ✅ All filters work independently
- ✅ Filters work in combination
- ✅ Clear filters button works correctly
- ✅ Responsive design verified
- ✅ Works across all tabs (Pending, Active, Suspended)

## Future Enhancements (Optional)
- Add date range filter for registration date
- Add export filtered results to CSV
- Add saved filter presets
- Add filter count indicator
- Add advanced search with operators (AND, OR, NOT)
