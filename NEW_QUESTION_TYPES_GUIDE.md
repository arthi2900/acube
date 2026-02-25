# New Question Types Implementation Guide

## Overview
Two new question types have been successfully added to the Question Bank system:

1. **Match the Following** - Students match items from two columns
2. **Multiple Response MCQ** - Multiple correct answers allowed (multi-select)

## Features Implemented

### 1. Match the Following
- **Purpose**: Create questions where students match items from a left column to items in a right column
- **UI Features**:
  - Add/remove match pairs dynamically
  - Define correct matches for each left item
  - Visual display of pairs in both row and card views
  - Validation ensures at least 2 pairs are provided

**Example Question**:
```
Question: Match the following decay processes with their characteristics:

Left Column          Right Column
Alpha decay     →    Atomic number unchanged
Beta decay      →    Atomic number unchanged
Gamma decay     →    Atomic number changes
Neutron decay   →    Atomic number changes

Correct Matches:
- Beta decay → Atomic number unchanged
- Gamma decay → Atomic number unchanged
```

### 2. Multiple Response MCQ
- **Purpose**: Create multiple-choice questions where more than one answer can be correct
- **UI Features**:
  - Checkbox selection for multiple correct answers
  - Clear indication of all correct answers in display views
  - Validation ensures at least one correct answer is selected
  - Visual checkmarks (✓) show correct answers in card view

**Example Question**:
```
Question: In which of the following decay processes does the atomic number of the nucleus remain unchanged?

Options:
A) Alpha decay
B) Beta decay
C) Gamma decay
D) Neutron decay

Correct Answers: B, C (Beta decay and Gamma decay)
```

## Technical Implementation

### Database Changes
- **Migration File**: `supabase/migrations/00017_add_new_question_types.sql`
- **Enum Extension**: Added `match_following` and `multiple_response` to `question_type` enum
- **Data Storage**:
  - Match Following: `options` stores array of `{left, right}` pairs, `correct_answer` stores JSON of correct matches
  - Multiple Response: `options` stores array of strings, `correct_answer` stores comma-separated correct options

### TypeScript Types
- **File**: `src/types/types.ts`
- **New Interface**: `MatchPair` with `left` and `right` properties
- **Updated Types**: `QuestionType` now includes all 5 question types

### UI Components Updated
- **File**: `src/pages/teacher/QuestionBank.tsx`
- **Form State**: Extended to handle match pairs and multiple correct answers
- **Add Dialog**: Conditional rendering based on question type
- **Edit Dialog**: Full support for editing all question types
- **Row View**: Updated badges to show all question types
- **Card View**: Enhanced display for options, match pairs, and multiple correct answers

## User Guide

### Creating a Match the Following Question

1. Click "Add Question" button
2. Select "Match the Following" from Question Type dropdown
3. Fill in the question text
4. Enter pairs in the "Match Pairs" section:
   - Left Item: The item students will match from
   - Right Match: The corresponding match option
5. In the "Correct Answer" section, select the correct match for each left item
6. Click "Add Question"

### Creating a Multiple Response Question

1. Click "Add Question" button
2. Select "Multiple Response (Multiple Answers)" from Question Type dropdown
3. Fill in the question text
4. Add options (minimum 2 required)
5. In the "Correct Answer" section, check all correct answers
6. Click "Add Question"

## Display Features

### Row View
- Question types shown with clear badges:
  - "MCQ (Single)" for traditional multiple choice
  - "MCQ (Multiple)" for multiple response
  - "Match Following" for match questions

### Card View
- **MCQ (Single)**: Shows options with correct answer highlighted in green
- **MCQ (Multiple)**: Shows all options with checkmarks (✓) on correct answers
- **Match Following**: Displays pairs with correct matches indicated

## Validation Rules

### Match the Following
- Minimum 2 pairs required
- All pairs must have both left and right items filled
- At least one correct match must be defined
- Each left item must have a corresponding match selected

### Multiple Response
- Minimum 2 options required
- At least 1 correct answer must be selected
- All options must be non-empty

## Data Format Examples

### Match the Following Storage
```json
{
  "options": [
    {"left": "Beta decay", "right": "Atomic number unchanged"},
    {"left": "Gamma decay", "right": "Atomic number unchanged"},
    {"left": "Alpha decay", "right": "Atomic number changes"},
    {"left": "Neutron decay", "right": "Atomic number changes"}
  ],
  "correct_answer": "{\"Beta decay\":\"Atomic number unchanged\",\"Gamma decay\":\"Atomic number unchanged\"}"
}
```

### Multiple Response Storage
```json
{
  "options": ["Alpha decay", "Beta decay", "Gamma decay", "Neutron decay"],
  "correct_answer": "Beta decay,Gamma decay"
}
```

## Testing Checklist

- [x] Database migration applied successfully
- [x] TypeScript types updated
- [x] Add Question dialog supports new types
- [x] Edit Question dialog supports new types
- [x] Form validation works correctly
- [x] Row view displays new types correctly
- [x] Card view displays new types correctly
- [x] Questions can be created with new types
- [x] Questions can be edited with new types
- [x] Questions can be deleted
- [x] No linting errors

## Future Enhancements

Potential improvements for future versions:
1. Drag-and-drop interface for match the following
2. Randomize option order for students
3. Partial credit scoring for multiple response
4. Import/export questions in bulk
5. Question templates for common patterns
