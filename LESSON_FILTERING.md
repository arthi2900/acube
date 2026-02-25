# Lesson Filtering Implementation

## Overview
The Manage Lessons feature now implements role-based filtering to ensure teachers only see lessons for their assigned class-section-subject combinations. Additionally, a customizable filter UI allows users to further refine the displayed lessons by class and subject.

## Filtering Logic

### For Teachers
```
Teacher sees a lesson ONLY IF:
  - Teacher is assigned to the lesson's class_id
  AND
  - Teacher is assigned to the lesson's subject_id
  AND
  - The assignment is for the current academic year (2024-2025)
```

### For Principals
```
Principal sees ALL lessons in their school (no filtering)
```

## Implementation Details

### 1. Data Loading (loadData function)

**Teacher Flow:**
1. Load teacher assignments for current academic year
2. Extract assigned class IDs and subject IDs
3. Load all lessons from school
4. Filter lessons where:
   - `assignments.some(a => a.class_id === lesson.class_id && a.subject_id === lesson.subject_id)`
5. Load only assigned classes and subjects for dropdowns

**Principal Flow:**
1. Load all lessons from school
2. Load all classes from school
3. Load all subjects from school
4. No filtering applied

### 2. Add Lesson Dialog

**Class Dropdown:**
- Teachers: Only shows classes they are assigned to
- Principals: Shows all classes in school

**Subject Dropdown:**
- Teachers: Only shows subjects they are assigned to for the selected class
- Principals: Shows all subjects for the selected class

**Validation:**
- Teachers: Verifies assignment exists for selected class-subject combination before creating lesson
- Principals: No assignment validation required

### 3. Lesson Display

Lessons are grouped by "Class - Subject" combination:
- Teachers see only groups for their assigned combinations
- Principals see all groups in the school

### 4. Edit/Rename/Delete Operations

- Teachers can only modify lessons for their assigned class-subject combinations
- Principals can modify any lesson in their school
- All operations respect RLS policies at database level

## Database Security

Row Level Security (RLS) policies ensure:
- Users can only view lessons in their school
- Teachers and principals can create/update/delete lessons
- All operations are logged with created_by field

## Example Scenario

**Teacher Assignment:**
- Class: Class 10
- Section: Section A
- Subject: English

**Visible Lessons:**
- ✅ Lesson: "Grammar Basics" (Class 10, English)
- ✅ Lesson: "Poetry Analysis" (Class 10, English)
- ❌ Lesson: "Algebra" (Class 10, Mathematics) - Not assigned to Math
- ❌ Lesson: "Grammar Basics" (Class 9, English) - Not assigned to Class 9

**Add Lesson Dialog:**
- Class dropdown: Only shows "Class 10"
- Subject dropdown: Only shows "English" (when Class 10 is selected)
- Cannot create lessons for other class-subject combinations

## Benefits

1. **Data Isolation**: Teachers only see relevant lessons
2. **Simplified UI**: Dropdowns show only valid options
3. **Security**: Database-level policies prevent unauthorized access
4. **Flexibility**: Principals retain full access for administrative tasks
5. **Scalability**: Efficient filtering even with large lesson databases
6. **User Control**: Custom filters allow users to focus on specific classes or subjects
7. **Better UX**: Clear filter UI with "Clear Filters" button for easy reset

## UI Features

### Sticky Header Section
The entire header section (including title, filters, and view toggle) is now frozen/sticky:
- **Sticky Positioning**: Remains visible at the top when scrolling through lessons
- **Background**: Solid background color to prevent content overlap
- **Border**: Bottom border to separate from scrollable content
- **Z-index**: Elevated layer to stay above scrolling content
- **Components Included**:
  - Page title and description
  - Add Lesson button
  - Filter Lessons card (Class, Subject, Clear Filters)
  - View Mode Toggle buttons (Card View / List View)

### View Mode Toggle
Located in the sticky header below the Filter Lessons card:
- **Card View**: Grid layout with lessons displayed in cards (2-3 columns on desktop)
- **List View**: Vertical list layout with full-width lesson items
- Toggle buttons with icons for easy switching between views
- Active view is highlighted with primary button style

### Filter Card
Located in the sticky header below the page title:
- **Class Filter**: Dropdown to select a specific class or "All Classes"
- **Subject Filter**: Dropdown to select a specific subject (enabled only when a class is selected)
- **Clear Filters Button**: One-click reset to show all lessons

### Filter Behavior
- Selecting a class automatically resets the subject filter
- Subject dropdown is disabled until a class is selected
- Subject dropdown only shows subjects for the selected class
- Clear Filters button is disabled when no filters are active
- Empty state message changes based on whether filters are applied

### Filter Logic
```
Display lesson IF:
  - (filterClassId === 'all' OR lesson.class_id === filterClassId)
  AND
  - (filterSubjectId === 'all' OR lesson.subject_id === filterSubjectId)
```

### Responsive Design
- Grid layout: 1 column on mobile, 3 columns on desktop (md breakpoint)
- All filter controls are touch-friendly
- Clear visual feedback for disabled states
- View mode toggle adapts to screen size
- List view provides better mobile experience with full-width items
- Card view optimizes desktop space with multi-column grid
- **Sticky header maintains visibility during scroll on all devices**
- **Scrollable content area with proper overflow handling**

### Scrolling Behavior
- **Fixed Header**: Title, filters, and view toggle remain visible at top
- **Scrollable Content**: Only the lessons list scrolls beneath the fixed header
- **Smooth Scrolling**: Natural scroll behavior with proper overflow handling
- **No Content Overlap**: Solid background prevents content from showing through header
- **Accessibility**: Keyboard navigation and screen reader friendly

### View Mode Comparison

**Card View:**
- Compact grid layout (2-3 columns on desktop)
- Best for viewing many lessons at once
- Lessons displayed in bordered cards with hover effects
- Truncated text for long lesson names
- Action buttons (edit/delete) inline with lesson name

**List View:**
- Full-width vertical list layout
- Best for detailed viewing and easier scanning
- More spacious with larger touch targets
- Full lesson names visible without truncation
- Action buttons aligned to the right
- Better for mobile devices and accessibility
