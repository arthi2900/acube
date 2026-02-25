# Dynamic Exam Card Filtering Feature

## Overview

Implemented dynamic exam card filtering on the Student Dashboard and My Exams page. Each card now navigates to a filtered view showing only the relevant exams based on their status.

---

## Feature Implementation

### 1. Dashboard Cards with Click Navigation

**Location**: `src/pages/student/StudentDashboard.tsx`

Each card on the dashboard now navigates to the My Exams page with a filter parameter:

#### Current Exam Card
- **Click Action**: Navigate to `/student/exams?filter=current`
- **Shows**: Only ongoing exams (started but not ended)
- **Badge Count**: Number of current exams

#### Upcoming Exams Card
- **Click Action**: Navigate to `/student/exams?filter=upcoming`
- **Shows**: Only scheduled exams (not yet started)
- **Badge Count**: Number of upcoming exams

#### Completed Exams Card
- **Click Action**: Navigate to `/student/exams?filter=completed`
- **Shows**: Only completed exams (submitted or time expired)
- **Badge Count**: Number of completed exams

---

### 2. My Exams Page with Tabbed Interface

**Location**: `src/pages/student/StudentExams.tsx`

The My Exams page now features a tabbed interface with four tabs:

#### Tab 1: All Exams
- Shows all exams grouped by status
- Sections: Current, Upcoming, Completed
- Default view when no filter is applied

#### Tab 2: Current
- Shows only ongoing exams
- Exams that have started but not ended
- Action buttons: "Start Exam" or "Continue Exam"

#### Tab 3: Upcoming
- Shows only scheduled exams
- Exams that haven't started yet
- Action button: "Exam not yet available" (disabled)

#### Tab 4: Completed
- Shows only completed exams
- Exams that are submitted or time expired
- Action button: "View Result"

---

## Exam Status Logic

### Current Exams
```typescript
// Exam is current if:
// 1. Exam has started (current time >= start_time)
// 2. Exam has not ended (current time < end_time)
// 3. Student hasn't submitted yet

const isCurrent = hasExamStarted(exam.start_time) && 
                  !hasExamEnded(exam.end_time) &&
                  (!attempt || attempt.status === 'in_progress');
```

### Upcoming Exams
```typescript
// Exam is upcoming if:
// 1. Exam hasn't started yet (current time < start_time)

const isUpcoming = !hasExamStarted(exam.start_time);
```

### Completed Exams
```typescript
// Exam is completed if:
// 1. Student has submitted (status = 'submitted' or 'evaluated')
// OR
// 2. Exam time has ended (current time >= end_time)

const isCompleted = (attempt && 
                     (attempt.status === 'submitted' || 
                      attempt.status === 'evaluated')) ||
                    hasExamEnded(exam.end_time);
```

---

## User Flow

### Flow 1: Click Current Exam Card
```
Dashboard
  ↓ (Click "Current Exam" card)
My Exams Page (filter=current)
  ↓ (Shows only ongoing exams)
  ↓ (Click "Start Exam" or "Continue Exam")
Take Exam Page
```

### Flow 2: Click Upcoming Exams Card
```
Dashboard
  ↓ (Click "Upcoming Exams" card)
My Exams Page (filter=upcoming)
  ↓ (Shows only scheduled exams)
  ↓ (Buttons disabled until exam starts)
Wait for exam to start
```

### Flow 3: Click Completed Card
```
Dashboard
  ↓ (Click "Completed" card)
My Exams Page (filter=completed)
  ↓ (Shows only completed exams)
  ↓ (Click "View Result")
Exam Result Page
```

---

## Technical Implementation

### URL Parameter Handling

**Dashboard Navigation**:
```typescript
// Current Exam Card
onClick={() => navigate('/student/exams?filter=current')}

// Upcoming Exams Card
onClick={() => navigate('/student/exams?filter=upcoming')}

// Completed Card
onClick={() => navigate('/student/exams?filter=completed')}
```

**My Exams Page Filter Detection**:
```typescript
const [searchParams] = useSearchParams();
const [activeTab, setActiveTab] = useState<string>('all');

useEffect(() => {
  const filter = searchParams.get('filter');
  if (filter && ['current', 'upcoming', 'completed'].includes(filter)) {
    setActiveTab(filter);
  }
}, [searchParams]);
```

### Exam Categorization

```typescript
const categorizeExams = () => {
  const currentExams: ExamWithDetails[] = [];
  const upcomingExams: ExamWithDetails[] = [];
  const completedExams: ExamWithDetails[] = [];

  exams.forEach(exam => {
    const attempt = attempts[exam.id];
    const started = hasExamStarted(exam.start_time);
    const ended = hasExamEnded(exam.end_time);
    
    // Completed: submitted, evaluated, or time has ended
    if (attempt && (attempt.status === 'submitted' || attempt.status === 'evaluated')) {
      completedExams.push(exam);
    } else if (ended) {
      completedExams.push(exam);
    }
    // Current: exam has started but not ended
    else if (started && !ended) {
      currentExams.push(exam);
    }
    // Upcoming: exam hasn't started yet
    else if (!started) {
      upcomingExams.push(exam);
    }
  });

  return { currentExams, upcomingExams, completedExams };
};
```

---

## Performance Optimization

### Batch API for Exam Attempts

**Problem**: The My Exams page was also suffering from N+1 query problem (similar to Dashboard)

**Solution**: Replaced sequential API calls with batch query

**Before**:
```typescript
// N+1 Problem: Making separate API call for each exam
for (const exam of publishedExams) {
  const attempt = await examAttemptApi.getAttemptByStudent(exam.id, profile.id);
  // 87 exams = 87 API calls
}
```

**After**:
```typescript
// Batch Query: Fetch all attempts in one call
const examIds = publishedExams.map(exam => exam.id);
const attemptsData = await examAttemptApi.getAllAttemptsForStudent(profile.id, examIds);

// Convert to map for O(1) lookup
const attemptsMap: Record<string, ExamAttempt> = {};
attemptsData.forEach(attempt => {
  attemptsMap[attempt.exam_id] = attempt;
});
```

**Impact**:
- Reduced API calls from 87 to 1
- Faster page load time
- Better user experience

---

## UI Components

### Tabs Component

```typescript
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="all">
      All Exams
      <Badge variant="secondary">{exams.length}</Badge>
    </TabsTrigger>
    <TabsTrigger value="current">
      <PlayCircle className="h-4 w-4 mr-1" />
      Current
      <Badge variant="default">{currentExams.length}</Badge>
    </TabsTrigger>
    <TabsTrigger value="upcoming">
      <Clock className="h-4 w-4 mr-1" />
      Upcoming
      <Badge variant="outline">{upcomingExams.length}</Badge>
    </TabsTrigger>
    <TabsTrigger value="completed">
      <CheckCircle2 className="h-4 w-4 mr-1" />
      Completed
      <Badge variant="secondary">{completedExams.length}</Badge>
    </TabsTrigger>
  </TabsList>

  <TabsContent value="all">...</TabsContent>
  <TabsContent value="current">...</TabsContent>
  <TabsContent value="upcoming">...</TabsContent>
  <TabsContent value="completed">...</TabsContent>
</Tabs>
```

### Empty States

Each tab has a custom empty state:

**Current Tab Empty State**:
```typescript
<Card>
  <CardContent className="flex flex-col items-center justify-center py-12">
    <PlayCircle className="h-12 w-12 text-muted-foreground mb-3" />
    <h3 className="text-base font-semibold mb-1">No current exams</h3>
    <p className="text-sm text-muted-foreground text-center">
      You don't have any ongoing exams at the moment.
    </p>
  </CardContent>
</Card>
```

**Upcoming Tab Empty State**:
```typescript
<Card>
  <CardContent className="flex flex-col items-center justify-center py-12">
    <Clock className="h-12 w-12 text-muted-foreground mb-3" />
    <h3 className="text-base font-semibold mb-1">No upcoming exams</h3>
    <p className="text-sm text-muted-foreground text-center">
      You don't have any scheduled exams yet.
    </p>
  </CardContent>
</Card>
```

**Completed Tab Empty State**:
```typescript
<Card>
  <CardContent className="flex flex-col items-center justify-center py-12">
    <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-3" />
    <h3 className="text-base font-semibold mb-1">No completed exams</h3>
    <p className="text-sm text-muted-foreground text-center">
      You haven't completed any exams yet.
    </p>
  </CardContent>
</Card>
```

---

## Visual Design

### Dashboard Cards

**Current Exam Card**:
- Border: 2px solid primary color (blue)
- Icon: PlayCircle (primary color)
- Badge: Default variant (blue background)
- Hover: Shadow elevation increase

**Upcoming Exams Card**:
- Border: 2px solid orange-500
- Icon: Clock (orange-500)
- Badge: Outline variant with orange border
- Hover: Shadow elevation increase

**Completed Card**:
- Border: 2px solid green-500
- Icon: CheckCircle2 (green-500)
- Badge: Outline variant with green border
- Hover: Shadow elevation increase

### Tab Badges

- **All Exams**: Secondary variant (gray)
- **Current**: Default variant (blue)
- **Upcoming**: Outline variant (transparent with border)
- **Completed**: Secondary variant (gray)

---

## Exam Status Badges

### Badge Variants

```typescript
const getExamStatus = (exam: ExamWithDetails) => {
  const attempt = attempts[exam.id];
  
  // Submitted or Evaluated
  if (attempt && (attempt.status === 'submitted' || attempt.status === 'evaluated')) {
    return { label: 'Submitted', variant: 'secondary' };
  }
  
  // In Progress
  if (attempt && attempt.status === 'in_progress') {
    return { label: 'In Progress', variant: 'default' };
  }
  
  // Time Expired (no submission)
  if (isExamCompleted(exam) && !attempt) {
    return { label: 'Missed', variant: 'destructive' };
  }
  
  // Available (can take now)
  if (isExamAvailable(exam)) {
    return { label: 'Available', variant: 'default' };
  }
  
  // Upcoming (not yet started)
  if (isExamUpcoming(exam)) {
    return { label: 'Upcoming', variant: 'outline' };
  }
  
  return { label: 'Unknown', variant: 'secondary' };
};
```

---

## Action Buttons

### Current Exams

**Start Exam** (No attempt yet):
```typescript
{!attempt && available && (
  <Button onClick={() => navigate(`/student/exams/${exam.id}/take`)}>
    <PlayCircle className="h-4 w-4 mr-2" />
    Start Exam
  </Button>
)}
```

**Continue Exam** (In progress):
```typescript
{inProgress && available && (
  <Button onClick={() => navigate(`/student/exams/${exam.id}/take`)}>
    <PlayCircle className="h-4 w-4 mr-2" />
    Continue Exam
  </Button>
)}
```

### Upcoming Exams

**Disabled Button**:
```typescript
{isUpcoming && (
  <Button disabled>
    <ClockAlert className="h-4 w-4 mr-2" />
    Exam not yet available
  </Button>
)}
```

### Completed Exams

**View Result**:
```typescript
{hasSubmitted && (
  <Button
    variant="outline"
    onClick={() => navigate(`/student/exams/${exam.id}/result`)}
  >
    <CheckCircle2 className="h-4 w-4 mr-2" />
    View Result
  </Button>
)}
```

---

## Testing Scenarios

### Test Case 1: Current Exam Card Click
1. Navigate to Student Dashboard
2. Verify "Current Exam" card shows count
3. Click "Current Exam" card
4. Verify navigation to `/student/exams?filter=current`
5. Verify "Current" tab is active
6. Verify only ongoing exams are displayed
7. Verify action buttons show "Start Exam" or "Continue Exam"

### Test Case 2: Upcoming Exams Card Click
1. Navigate to Student Dashboard
2. Verify "Upcoming Exams" card shows count
3. Click "Upcoming Exams" card
4. Verify navigation to `/student/exams?filter=upcoming`
5. Verify "Upcoming" tab is active
6. Verify only scheduled exams are displayed
7. Verify action buttons are disabled

### Test Case 3: Completed Card Click
1. Navigate to Student Dashboard
2. Verify "Completed" card shows count
3. Click "Completed" card
4. Verify navigation to `/student/exams?filter=completed`
5. Verify "Completed" tab is active
6. Verify only completed exams are displayed
7. Verify action buttons show "View Result"

### Test Case 4: Tab Switching
1. Navigate to My Exams page
2. Click "All Exams" tab → Verify all exams shown
3. Click "Current" tab → Verify only current exams shown
4. Click "Upcoming" tab → Verify only upcoming exams shown
5. Click "Completed" tab → Verify only completed exams shown

### Test Case 5: Empty States
1. Create student with no current exams
2. Click "Current Exam" card
3. Verify empty state message displayed
4. Repeat for Upcoming and Completed tabs

---

## Edge Cases Handled

### 1. No Exams Assigned
- Dashboard cards show "0" count
- My Exams page shows "No exams available" message
- All tabs show appropriate empty states

### 2. Exam Time Transitions
- Upcoming exam becomes current when start time reached
- Current exam becomes completed when end time reached
- Dashboard and My Exams page reflect real-time status

### 3. Multiple Exam States
- Student can have exams in all three states simultaneously
- Each tab correctly filters and displays relevant exams
- Badge counts update dynamically

### 4. Invalid Filter Parameter
- URL with invalid filter (e.g., `?filter=invalid`) defaults to "All Exams" tab
- No errors or crashes

### 5. Direct URL Access
- User can bookmark filtered URLs (e.g., `/student/exams?filter=current`)
- Page loads with correct tab active
- Filter persists across page refreshes

---

## Benefits

### User Experience
✅ **Intuitive Navigation**: Click cards to see filtered exams
✅ **Clear Organization**: Exams grouped by status
✅ **Quick Access**: Direct links to specific exam categories
✅ **Visual Feedback**: Color-coded cards and badges
✅ **Empty States**: Clear messages when no exams available

### Performance
✅ **Batch API**: Reduced API calls from 87 to 1
✅ **Fast Loading**: Optimized data fetching
✅ **Efficient Filtering**: Client-side filtering after initial load
✅ **No Re-fetching**: Tab switching doesn't reload data

### Maintainability
✅ **Reusable Logic**: Centralized exam categorization
✅ **Type Safety**: TypeScript interfaces for all data
✅ **Clean Code**: Separated concerns and modular functions
✅ **Consistent UI**: Shared components across tabs

---

## Files Modified

### 1. `src/pages/student/StudentDashboard.tsx`
- Added filter parameters to card click handlers
- Updated navigation URLs with query parameters

### 2. `src/pages/student/StudentExams.tsx`
- Added `useSearchParams` hook for URL parameter handling
- Added `activeTab` state for tab management
- Replaced N+1 query loop with batch API call
- Implemented tabbed interface with four tabs
- Added filter logic for each tab
- Added empty states for each tab
- Optimized performance with batch query

---

## Future Enhancements

### 1. Search and Filter
- Add search bar to filter exams by title or subject
- Add dropdown filters for subject, class, date range

### 2. Sorting Options
- Sort by date (ascending/descending)
- Sort by subject
- Sort by status

### 3. Pagination
- Implement pagination for completed exams (85+ exams)
- Load more on scroll or button click

### 4. Exam Reminders
- Show countdown timer for upcoming exams
- Highlight exams starting soon

### 5. Quick Actions
- Add "Start Exam" button directly on dashboard cards
- Add "View Result" button for recently completed exams

---

## Summary

### What Was Implemented
✅ Dynamic exam card filtering on Student Dashboard
✅ Click navigation with filter parameters
✅ Tabbed interface on My Exams page
✅ Four tabs: All, Current, Upcoming, Completed
✅ URL parameter handling for deep linking
✅ Batch API optimization for performance
✅ Empty states for each tab
✅ Color-coded visual design
✅ Responsive action buttons

### Performance Improvements
✅ Reduced API calls from 87 to 1 (My Exams page)
✅ Faster page load time
✅ Efficient client-side filtering
✅ No unnecessary re-fetching

### User Experience Improvements
✅ Intuitive card-based navigation
✅ Clear exam status categorization
✅ Quick access to specific exam types
✅ Visual feedback with colors and badges
✅ Helpful empty state messages

---

**Date**: 2025-12-11  
**Feature**: Dynamic Exam Card Filtering  
**Status**: ✅ Complete  
**Files Modified**: 2  
**Performance**: Optimized with batch API  
**User Experience**: Enhanced with tabbed interface
