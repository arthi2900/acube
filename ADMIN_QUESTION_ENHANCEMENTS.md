# Admin Question Management Enhancements

## Overview
This document describes the enhancements made to the Admin Question Bank Management system to allow admins to create questions and manage user question banks.

## Requirements Implemented

### 1. Create Question (Admin)
**Status**: ✅ Completed

**Description**: Added "Create Question" functionality in Admin login, similar to the teacher's question creation form.

**Implementation Details**:
- Added a "Create Question" button in the AdminQuestionBank page header
- Created a comprehensive dialog form with the following features:
  - **Class Selection**: Dropdown to select class
  - **Subject Selection**: Dropdown to select subject (filtered by selected class)
  - **Question Text**: Rich text editor for question content
  - **Question Type**: Support for MCQ, True/False, and Short Answer
  - **Difficulty Level**: Easy, Medium, Hard options
  - **Marks Configuration**: Positive marks and negative marks
  - **MCQ Options**: Dynamic option management (add/remove options, minimum 2 required)
  - **Correct Answer Selection**: Type-specific answer input
  - **Image Upload**: Optional image attachment with validation (max 1MB, specific file types)
- Questions created by admin are automatically marked as global (`is_global = true`)
- Added `createGlobalQuestion` API function in `src/db/api.ts`

**Files Modified**:
- `src/pages/admin/AdminQuestionBank.tsx`: Added create question dialog and form
- `src/db/api.ts`: Added `createGlobalQuestion` function

### 2. Question Bank Management
**Status**: ✅ Already Implemented

**Description**: Show list of all user-created question banks not in global bank, with ability to add them to global.

**Existing Implementation**:
- The "Users" tab in AdminQuestionBank already filters to show only non-global questions
- API function `getAllQuestionsWithUsers()` filters with `is_global = false` (line 546 in api.ts)
- "Copy to Global" button already exists for each user question
- `copyQuestionToGlobal()` function creates a copy of the question with `is_global = true`

**No Changes Required**: This functionality was already fully implemented in the previous version.

## Technical Details

### New API Function
```typescript
async createGlobalQuestion(question: Omit<Question, 'id' | 'created_at' | 'created_by' | 'is_global'>): Promise<Question | null> {
  const user = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('questions')
    .insert({ ...question, created_by: user.data.user?.id, is_global: true })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}
```

### Form Features
1. **Validation**:
   - Required fields: Question Text, Class, Subject
   - MCQ: Minimum 2 options required
   - All question types: Correct answer required

2. **Image Upload**:
   - Supported formats: JPEG, PNG, GIF, WebP
   - Maximum file size: 1MB
   - Automatic upload to Supabase Storage
   - Preview of uploaded image

3. **User Experience**:
   - Form resets after successful submission
   - Success/error toast notifications
   - Loading states for image upload
   - Responsive design with scrollable dialog

## Usage

### For Admins:
1. Navigate to "Question Bank Management" page
2. Click "Create Question" button in the header
3. Fill in the form:
   - Select Class and Subject
   - Enter question text using rich text editor
   - Choose question type and difficulty
   - Set marks and negative marks
   - Add options (for MCQ) or answer (for other types)
   - Optionally upload an image
4. Click "Create Question" to submit
5. Question will be added to the Global Question Bank

### Managing User Questions:
1. Navigate to "Users" tab in Question Bank Management
2. View all non-global questions created by users
3. Use filters to search by user, bank name, or question text
4. Click "Copy to Global" button to add a user question to the global bank

## Benefits
- **Centralized Management**: Admins can create global questions directly
- **Consistency**: Same question creation experience as teachers
- **Flexibility**: Support for multiple question types
- **Quality Control**: Admins can review user questions and promote them to global bank
- **Efficiency**: Quick access to create and manage questions from one interface

## Testing
- ✅ Lint check passed (no errors in new code)
- ✅ Form validation working correctly
- ✅ Image upload functionality tested
- ✅ Question creation saves to database with is_global = true
- ✅ All question types (MCQ, True/False, Short Answer) working

## Future Enhancements
- Add support for Match Following and Multiple Response question types in admin form
- Bulk question creation from CSV/Excel
- Question preview before submission
- Edit global questions
- Question versioning and history
