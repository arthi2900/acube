# Negative Marking Feature Guide

## Overview
The Question Bank now supports **negative marking** for questions. Teachers can specify marks to be deducted for incorrect answers, which is commonly used in competitive exams and assessments.

## Key Features

### 1. Flexible Negative Marking
- **Default Value**: 0 (no negative marking)
- **Minimum Value**: 0 (cannot be negative)
- **Step Value**: 0.25 (allows fractional deductions like 0.25, 0.5, 0.75, 1.0, etc.)
- **Optional Field**: Teachers can choose to use negative marking or leave it at 0

### 2. Common Use Cases

#### No Negative Marking (Default)
- **Value**: 0
- **Use Case**: Regular classroom tests, practice quizzes
- **Behavior**: Students get full marks for correct answers, zero for incorrect answers

#### Fractional Negative Marking
- **Value**: 0.25 or 0.5
- **Use Case**: Competitive exams, entrance tests
- **Example**: 
  - Question worth 4 marks
  - Negative marking: 1 mark (1/4 of question marks)
  - Correct answer: +4 marks
  - Wrong answer: -1 mark
  - Unanswered: 0 marks

#### Full Negative Marking
- **Value**: Equal to question marks
- **Use Case**: High-stakes assessments where guessing should be discouraged
- **Example**:
  - Question worth 2 marks
  - Negative marking: 2 marks
  - Correct answer: +2 marks
  - Wrong answer: -2 marks

### 3. User Interface

#### Add Question Dialog
- **Location**: After "Marks" field
- **Label**: "Negative Marks"
- **Input Type**: Number input with step 0.25
- **Helper Text**: "Marks deducted for wrong answer (0 = no deduction)"
- **Default**: 0

#### Edit Question Dialog
- **Location**: After "Marks" field
- **Label**: "Negative Marks"
- **Input Type**: Number input with step 0.25
- **Helper Text**: "Marks deducted for wrong answer (0 = no deduction)"
- **Preserves**: Existing negative_marks value when editing

#### Row View (Table)
- **Column**: "Negative Marks" (after "Marks" column)
- **Display**: Shows the negative marks value (e.g., 0, 0.25, 0.5, 1)

#### Card View
- **Location**: After "Marks" field in the details grid
- **Label**: "Negative Marks"
- **Display**: Shows the negative marks value

## Database Schema

### Table: questions
```sql
Column: negative_marks
Type: DECIMAL(5,2)
Default: 0
Constraint: NOT NULL, CHECK (negative_marks >= 0)
```

### Migration
- **File**: `supabase/migrations/00020_add_negative_marks_to_questions.sql`
- **Applied**: Successfully migrated
- **Backward Compatible**: Yes (default value 0 for existing questions)

## TypeScript Types

### Question Interface
```typescript
export interface Question {
  id: string;
  subject_id: string;
  lesson_id: string | null;
  question_text: string;
  question_type: QuestionType;
  options: string[] | MatchPair[] | null;
  correct_answer: string;
  marks: number;
  negative_marks: number;  // ✅ New field
  difficulty: DifficultyLevel;
  bank_name: string | null;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
}
```

## How to Use

### For Teachers

#### Creating a New Question
1. Click "Add Question" button
2. Fill in all required fields (Question Text, Class, Subject, etc.)
3. Enter the marks for the question (e.g., 4)
4. **Enter negative marks** (optional):
   - Leave as 0 for no negative marking
   - Enter 0.25 for 1/4 mark deduction
   - Enter 0.5 for 1/2 mark deduction
   - Enter 1 for 1 mark deduction
   - Or any other value as needed
5. Complete the rest of the form and click "Add Question"

#### Editing an Existing Question
1. Click the Edit (pencil) icon on any question
2. Modify the "Negative Marks" field as needed
3. Click "Update Question" to save changes

#### Viewing Questions
- **Row View**: Check the "Negative Marks" column in the table
- **Card View**: Look for "Negative Marks" in the question details

### For Principals
- Same functionality as teachers
- Can create and edit questions with negative marking
- Can view negative marks in both Row and Card views

## Examples

### Example 1: Competitive Exam Question
```
Question: What is the capital of France?
Marks: 4
Negative Marks: 1
Type: MCQ

Scoring:
- Correct answer: +4 marks
- Wrong answer: -1 mark
- Not attempted: 0 marks
```

### Example 2: Practice Quiz (No Negative Marking)
```
Question: Solve: 2 + 2 = ?
Marks: 2
Negative Marks: 0
Type: Short Answer

Scoring:
- Correct answer: +2 marks
- Wrong answer: 0 marks
```

### Example 3: High-Stakes Assessment
```
Question: Which of the following is correct?
Marks: 5
Negative Marks: 1.25
Type: Multiple Response MCQ

Scoring:
- All correct answers selected: +5 marks
- Any wrong answer: -1.25 marks
- Not attempted: 0 marks
```

## Best Practices

### 1. Choose Appropriate Negative Marking
- **Easy questions**: Lower or no negative marking (0 or 0.25)
- **Medium questions**: Moderate negative marking (0.5 or 1)
- **Hard questions**: Higher negative marking (1 or more)

### 2. Communicate Clearly
- Always inform students about negative marking policy
- Display negative marking information in exam instructions
- Be consistent within the same exam/assessment

### 3. Common Ratios
- **1:4 ratio**: 1 mark deduction for 4 marks question (0.25 per mark)
- **1:3 ratio**: 1 mark deduction for 3 marks question (0.33 per mark)
- **1:2 ratio**: 1 mark deduction for 2 marks question (0.5 per mark)
- **1:1 ratio**: Equal deduction (discourages guessing completely)

### 4. Question Type Considerations
- **MCQ (Single)**: Standard negative marking works well
- **MCQ (Multiple)**: Consider higher negative marking to prevent random selection
- **True/False**: Often use 50% negative marking (0.5 for 1 mark question)
- **Short Answer**: Usually no negative marking (subjective evaluation)
- **Match the Following**: Partial negative marking per incorrect match

## Validation Rules

### Frontend Validation
- ✅ Minimum value: 0
- ✅ Step value: 0.25 (allows fractional values)
- ✅ Default value: 0
- ✅ Placeholder: "0"

### Database Validation
- ✅ NOT NULL constraint
- ✅ CHECK constraint: `negative_marks >= 0`
- ✅ DECIMAL(5,2) type (allows values up to 999.99)

## Technical Implementation

### Files Modified
1. **Database Migration**: `supabase/migrations/00020_add_negative_marks_to_questions.sql`
2. **TypeScript Types**: `src/types/types.ts`
3. **Question Bank Component**: `src/pages/teacher/QuestionBank.tsx`

### Changes Made
- ✅ Added `negative_marks` column to database
- ✅ Updated Question interface with `negative_marks` field
- ✅ Added input field in Add Question dialog
- ✅ Added input field in Edit Question dialog
- ✅ Added column in Row View table
- ✅ Added field in Card View
- ✅ Updated form state management (formData, resetForm, partialResetForm)
- ✅ Updated handleSubmit to include negative_marks
- ✅ Updated handleUpdate to include negative_marks
- ✅ Updated handleEdit to populate negative_marks

### Code Quality
- ✅ No linting errors
- ✅ No TypeScript errors
- ✅ Type-safe implementation
- ✅ Follows existing code patterns
- ✅ Backward compatible (default value 0)

## Future Enhancements

### Potential Features
1. **Auto-calculate negative marks**: Suggest negative marking based on question marks (e.g., 1/4 of marks)
2. **Negative marking presets**: Quick buttons for common ratios (1:4, 1:3, 1:2)
3. **Exam-level negative marking**: Set default negative marking for entire exam
4. **Analytics**: Show impact of negative marking on student scores
5. **Negative marking policy templates**: Predefined policies for different exam types

## Support

### Common Questions

**Q: Can negative marks be greater than question marks?**
A: Yes, technically possible, but not recommended. Use with caution.

**Q: What happens to existing questions?**
A: All existing questions automatically get `negative_marks = 0` (no negative marking).

**Q: Can I change negative marks after exam is published?**
A: Yes, but it's not recommended as it may affect fairness. Change before publishing.

**Q: Does negative marking apply to all question types?**
A: Yes, but it's most commonly used for MCQ and True/False questions.

**Q: How do I disable negative marking?**
A: Set the value to 0 (zero).

## Conclusion

The negative marking feature provides teachers with flexible assessment options, allowing them to create exams that discourage guessing and reward knowledge. The feature is fully integrated into the Question Bank with a user-friendly interface and robust validation.

For any issues or questions, please refer to the technical documentation or contact the development team.
