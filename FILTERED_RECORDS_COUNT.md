# Filtered Records Count Feature

## Overview
Added a dynamic filtered records count display to the User Management page that shows administrators exactly how many users match their current search and filter criteria.

## Feature Description

### Visual Display
The filtered records count appears below the search and filter controls, showing:
1. **Count Badge**: A secondary badge displaying the number of matching records
2. **Active Filters Summary**: Text showing which filters are currently applied

### Display Format
```
[Badge: X records found] Searching for "query" • Role: Teacher • School: GHS IRULAKURICHI
```

### Components

#### 1. Records Count Badge
- **Format**: `X records found` or `1 record found` (singular)
- **Style**: Secondary badge with padding
- **Dynamic**: Updates in real-time as filters change
- **Tab-Aware**: Shows count for the active tab (Pending/Active/Suspended)

#### 2. Active Filters Summary
- **Search Query**: Displays the search text in quotes
- **Role Filter**: Shows the selected role (e.g., "Role: Teacher")
- **School Filter**: Shows the selected school name
- **Separator**: Uses bullet points (•) between multiple filters

## Examples

### Single Filter
```
[5 records found] Searching for "ram"
```

### Multiple Filters
```
[8 records found] Searching for "student" • Role: Student • School: GHS SATHAPADI
```

### Role Filter Only
```
[12 records found] Role: Teacher
```

### School Filter Only
```
[3 records found] School: GHS IRULAKURICHI
```

## Implementation Details

### Conditional Display
The filtered records count only appears when:
- Search query is not empty, OR
- Role filter is not "all", OR
- School filter is not "all"

### Code Structure
```tsx
{(searchQuery || roleFilter !== 'all' || schoolFilter !== 'all') && (
  <div className="mt-4 flex items-center gap-2 text-sm">
    <Badge variant="secondary" className="px-3 py-1">
      {activeTab === 'pending' && `${pendingProfiles.length} ${pendingProfiles.length === 1 ? 'record' : 'records'} found`}
      {activeTab === 'active' && `${activeProfiles.length} ${activeProfiles.length === 1 ? 'record' : 'records'} found`}
      {activeTab === 'suspended' && `${suspendedProfiles.length} ${suspendedProfiles.length === 1 ? 'record' : 'records'} found`}
    </Badge>
    <span className="text-muted-foreground">
      {searchQuery && `Searching for "${searchQuery}"`}
      {searchQuery && (roleFilter !== 'all' || schoolFilter !== 'all') && ' • '}
      {roleFilter !== 'all' && `Role: ${getRoleLabel(roleFilter)}`}
      {roleFilter !== 'all' && schoolFilter !== 'all' && ' • '}
      {schoolFilter !== 'all' && `School: ${schools.find(s => s.id === schoolFilter)?.school_name || 'Unknown'}`}
    </span>
  </div>
)}
```

### Smart Features

#### 1. Singular/Plural Handling
- Automatically uses "record" for 1 result
- Uses "records" for 0 or multiple results

#### 2. Dynamic School Name Lookup
- Finds the school name from the schools array using the school ID
- Shows "Unknown" if school is not found

#### 3. Role Label Formatting
- Uses the `getRoleLabel()` function to display user-friendly role names
- Converts "admin" → "Admin", "teacher" → "Teacher", etc.

#### 4. Separator Logic
- Only shows bullet points (•) between active filters
- Prevents extra separators when filters are not active

## User Benefits

### 1. Immediate Feedback
- Users instantly see how many results match their filters
- No need to scroll through the table to count

### 2. Filter Confirmation
- Clear indication of which filters are currently active
- Helps users understand why they're seeing specific results

### 3. Search Validation
- Shows if a search query returned results
- Helps users refine their search if needed

### 4. Better User Experience
- Professional appearance
- Clear and concise information
- Reduces confusion about filtered results

## Technical Details

### State Dependencies
- `searchQuery`: Current search text
- `roleFilter`: Selected role filter value
- `schoolFilter`: Selected school filter value
- `activeTab`: Current tab (pending/active/suspended)
- `pendingProfiles`: Filtered pending users array
- `activeProfiles`: Filtered active users array
- `suspendedProfiles`: Filtered suspended users array
- `schools`: Array of all schools

### Styling
- **Badge**: Secondary variant with custom padding
- **Text**: Small size (text-sm) with muted foreground color
- **Layout**: Flexbox with gap for spacing
- **Margin**: Top margin (mt-4) for separation from filters

## Testing

### Test Cases
1. ✅ Count updates when search query changes
2. ✅ Count updates when role filter changes
3. ✅ Count updates when school filter changes
4. ✅ Count updates when switching tabs
5. ✅ Singular "record" shown for 1 result
6. ✅ Plural "records" shown for 0 or multiple results
7. ✅ Search query displayed in quotes
8. ✅ Role label formatted correctly
9. ✅ School name displayed correctly
10. ✅ Bullet separators appear only between active filters
11. ✅ Component hidden when no filters active
12. ✅ Component shown when any filter is active

## Files Modified
- `/workspace/app-85wc5xzx8yyp/src/pages/admin/UserManagement.tsx`
  - Added filtered records count display component
  - Integrated with existing filter state
  - Added conditional rendering logic

## Performance
- **No Additional API Calls**: Uses existing filtered data
- **Minimal Re-renders**: Only updates when filter state changes
- **Efficient Lookup**: School name lookup is O(n) but schools array is small

## Future Enhancements (Optional)
- Add animation when count changes
- Add color coding (green for many results, yellow for few, red for none)
- Add export button next to count for filtered results
- Add "Show all" link to quickly clear filters
- Add percentage indicator (e.g., "20 of 100 users")
