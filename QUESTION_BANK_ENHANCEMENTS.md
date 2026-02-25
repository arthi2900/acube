# Question Bank Form Enhancements

## Overview
Enhanced the Add Question form in the Question Bank to provide better control and filtering based on teacher assignments. The form now intelligently shows only the classes and subjects assigned to the logged-in teacher, and includes dynamic option management for Multiple Choice Questions.

## Features Implemented

### 1. Class Dropdown
**Purpose**: Display only classes assigned to the teacher

**Implementation**:
- Fetches teacher assignments from the database
- Extracts unique classes from the assignments
- Displays only those classes in the dropdown
- Required field for question creation

**User Experience**:
- Teachers see only their assigned classes
- Clear "Select class" placeholder
- Automatically resets subject selection when class changes

### 2. Subject Dropdown (Dependent on Class)
**Purpose**: Display only subjects for the selected class that are assigned to the teacher

**Implementation**:
- Disabled until a class is selected
- Filters subjects based on:
  - Selected class ID
  - Teacher's assignments for that class
- Shows only subjects the teacher is authorized to teach

**User Experience**:
- Disabled state when no class is selected
- Clear "Select subject" placeholder
- Only shows relevant subjects for the selected class

### 3. Dynamic Options Management
**Purpose**: Allow teachers to add or remove answer options for MCQ questions

**Features**:
- **Add Option Button**: Adds a new empty option field
- **Remove Option Button**: Removes an option (appears next to each option)
- **Minimum Requirement**: At least 2 options must be present
- **Visual Feedback**: Trash icon for remove button

**Implementation**:
```typescript
// Add option
const addOption = () => {
  setFormData({
    ...formData,
    options: [...formData.options, '']
  });
};

// Remove option
const removeOption = (index: number) => {
  if (formData.options.length <= 2) {
    toast({
      title: 'Error',
      description: 'At least 2 options are required',
      variant: 'destructive',
    });
    return;
  }
  const newOptions = formData.options.filter((_, i) => i !== index);
  setFormData({ ...formData, options: newOptions });
};
```

## Form Layout

### Updated Structure
```
┌─────────────────────────────────────────────────────────┐
│ Question Text                                           │
├─────────────────────────────────────────────────────────┤
│ Class                    │ Subject                      │
├─────────────────────────────────────────────────────────┤
│ Question Type            │ Marks                        │
├─────────────────────────────────────────────────────────┤
│ Difficulty               │                              │
├─────────────────────────────────────────────────────────┤
│ Options (MCQ only)                    [+ Add Option]    │
│ Option 1                                      [Remove]   │
│ Option 2                                      [Remove]   │
│ ...                                                      │
├─────────────────────────────────────────────────────────┤
│ Correct Answer                                          │
└─────────────────────────────────────────────────────────┘
```

## Technical Implementation

### State Management
```typescript
const [formData, setFormData] = useState({
  question_text: '',
  class_id: '',           // NEW: Class selection
  subject_id: '',
  question_type: 'mcq',
  difficulty: 'medium',
  marks: 1,
  options: ['', ''],      // CHANGED: Start with 2 empty options
  correct_answer: '',
});
```

### New State Variables
```typescript
const [classes, setClasses] = useState<Class[]>([]);
const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignmentWithDetails[]>([]);
const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
```

### Data Loading
```typescript
const loadData = async () => {
  // Get current teacher profile
  const profile = await profileApi.getCurrentProfile();
  
  // Get teacher assignments for current academic year
  const assignments = await academicApi.getTeacherAssignments(profile.id, '2024-2025');
  
  // Extract unique classes from assignments
  const uniqueClasses = Array.from(
    new Map(assignments.map(a => [a.class_id, a.class])).values()
  );
  
  setClasses(uniqueClasses);
  setTeacherAssignments(assignments);
};
```

### Subject Filtering Logic
```typescript
const getAvailableSubjects = () => {
  if (!formData.class_id) return [];
  
  // Get subject IDs assigned to teacher for selected class
  const assignedSubjectIds = teacherAssignments
    .filter(a => a.class_id === formData.class_id)
    .map(a => a.subject_id);
  
  // Filter subjects by class and teacher assignment
  return subjects.filter(s => 
    s.class_id === formData.class_id && 
    assignedSubjectIds.includes(s.id)
  );
};
```

### Form Validation
```typescript
if (!formData.question_text || !formData.class_id || !formData.subject_id || !formData.correct_answer) {
  toast({
    title: 'Error',
    description: 'Please fill in all required fields',
    variant: 'destructive',
  });
  return;
}
```

## User Experience Improvements

### 1. Cascading Dropdowns
- Class selection enables subject dropdown
- Subject dropdown shows only relevant subjects
- Changing class resets subject selection

### 2. Visual Feedback
- Disabled state for subject dropdown when no class selected
- Clear placeholder text for all dropdowns
- Toast notifications for validation errors

### 3. Dynamic Options
- Add button with Plus icon
- Remove button with Trash icon (red color)
- Minimum 2 options enforced with error message
- Smooth addition and removal of option fields

### 4. Form Reset
- All fields reset to default values when form is closed
- Options reset to 2 empty fields
- Class and subject selections cleared

## Benefits

### For Teachers
- **Simplified Selection**: Only see classes and subjects they teach
- **Reduced Errors**: Can't select unauthorized classes/subjects
- **Flexible Options**: Add as many MCQ options as needed
- **Better Control**: Remove unnecessary options easily

### For System Integrity
- **Data Validation**: Ensures questions are created for valid assignments
- **Access Control**: Teachers can only create questions for their subjects
- **Consistency**: Maintains relationship between classes, subjects, and teachers

### For User Experience
- **Intuitive Flow**: Logical progression from class to subject
- **Clear Feedback**: Disabled states and placeholders guide users
- **Error Prevention**: Validation prevents incomplete submissions

## Database Relationships

### Teacher Assignments Table
```sql
teacher_assignments
├── teacher_id (references profiles)
├── subject_id (references subjects)
├── class_id (references classes)
├── section_id (references sections)
└── academic_year
```

### Data Flow
```
1. Load teacher profile
2. Fetch teacher_assignments for current academic year
3. Extract unique classes from assignments
4. When class selected → filter subjects by:
   - class_id matches selected class
   - subject_id exists in teacher's assignments
5. Display filtered subjects in dropdown
```

## Files Modified

### `/workspace/app-85wc5xzx8yyp/src/pages/teacher/QuestionBank.tsx`
**Changes**:
- Added imports for `Class`, `TeacherAssignmentWithDetails`, `Profile`, `academicApi`, `profileApi`
- Added state variables for classes, teacher assignments, and current profile
- Updated `loadData()` to fetch teacher assignments and filter classes
- Added `getAvailableSubjects()` function for subject filtering
- Added `addOption()`, `removeOption()`, and `updateOption()` functions
- Updated form UI to include Class dropdown
- Made Subject dropdown dependent on Class selection
- Added dynamic option management UI with Add/Remove buttons
- Updated form validation to include class_id
- Changed default options from 4 to 2

## Testing

### Test Cases
1. ✅ Class dropdown shows only assigned classes
2. ✅ Subject dropdown disabled when no class selected
3. ✅ Subject dropdown shows only subjects for selected class
4. ✅ Subject dropdown shows only subjects assigned to teacher
5. ✅ Add Option button adds new option field
6. ✅ Remove Option button removes option
7. ✅ Cannot remove options when only 2 remain
8. ✅ Error toast shown when trying to remove below minimum
9. ✅ Form validation checks for class and subject
10. ✅ Form resets correctly when closed
11. ✅ Changing class resets subject selection
12. ✅ Lint check passes

## API Dependencies

### Required APIs
- `profileApi.getCurrentProfile()` - Get logged-in teacher profile
- `academicApi.getTeacherAssignments()` - Get teacher's class/subject assignments
- `subjectApi.getAllSubjects()` - Get all subjects (filtered client-side)
- `questionApi.createQuestion()` - Create new question

### Academic Year
- Currently hardcoded to `'2024-2025'`
- Can be made dynamic in future enhancements

## Future Enhancements (Optional)

### 1. Dynamic Academic Year
- Add academic year selector
- Load assignments for selected year

### 2. Bulk Question Import
- Import questions from CSV/Excel
- Validate against teacher assignments

### 3. Question Templates
- Save frequently used question formats
- Quick create from templates

### 4. Option Reordering
- Drag and drop to reorder options
- Randomize option order

### 5. Rich Text Editor
- Format question text with bold, italic, etc.
- Add images to questions and options

### 6. Question Preview
- Preview how question will appear to students
- Test question before saving

## Security Considerations

### Access Control
- Teachers can only see their assigned classes
- Teachers can only create questions for their subjects
- Server-side validation should verify teacher assignments

### Data Integrity
- Class-Subject relationship maintained
- Teacher-Subject assignment verified
- Minimum option requirement enforced

## Performance

### Optimization
- Client-side filtering for subjects (fast)
- Single API call for teacher assignments
- Efficient data extraction using Map for unique classes

### Scalability
- Works efficiently with large number of assignments
- No performance impact from dynamic options
- Minimal re-renders with proper state management
