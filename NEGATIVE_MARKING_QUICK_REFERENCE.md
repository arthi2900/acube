# Negative Marking Feature - Quick Reference

## ✅ Feature Summary

The Question Bank now supports **negative marking** - teachers can specify marks to be deducted for incorrect answers.

## 🎯 Key Points

| Aspect | Details |
|--------|---------|
| **Default Value** | 0 (no negative marking) |
| **Minimum Value** | 0 |
| **Step Value** | 0.25 (allows 0.25, 0.5, 0.75, 1.0, etc.) |
| **Field Type** | Optional number input |
| **Database Type** | DECIMAL(5,2) |
| **Validation** | Must be >= 0 |

## 📍 Where to Find It

### Add Question Dialog
```
┌─────────────────────────────────────┐
│ Question Text: [____________]       │
│ Class: [Select Class ▼]            │
│ Subject: [Select Subject ▼]        │
│ Question Type: [MCQ ▼]             │
│ Marks: [4]                         │
│ Negative Marks: [1] ← NEW FIELD    │
│   ℹ️ Marks deducted for wrong      │
│      answer (0 = no deduction)     │
│ Difficulty: [Medium ▼]             │
│ ...                                │
└─────────────────────────────────────┘
```

### Edit Question Dialog
```
┌─────────────────────────────────────┐
│ Question Text: [____________]       │
│ Difficulty: [Medium ▼]             │
│ Marks: [4]                         │
│ Negative Marks: [1] ← NEW FIELD    │
│   ℹ️ Marks deducted for wrong      │
│      answer (0 = no deduction)     │
│ ...                                │
└─────────────────────────────────────┘
```

### Row View (Table)
```
┌──────────┬──────┬──────────┬─────────────────┬─────────┐
│ Question │ Type │ Marks    │ Negative Marks  │ Actions │
├──────────┼──────┼──────────┼─────────────────┼─────────┤
│ What is..│ MCQ  │ 4        │ 1               │ ✏️ 🗑️   │
│ Solve... │ Short│ 2        │ 0               │ ✏️ 🗑️   │
│ True or..│ T/F  │ 1        │ 0.25            │ ✏️ 🗑️   │
└──────────┴──────┴──────────┴─────────────────┴─────────┘
                                    ↑
                              NEW COLUMN
```

### Card View
```
┌─────────────────────────────────────┐
│ 📝 What is the capital of France?  │
│                                     │
│ Bank Name: Class10_Geography        │
│ Subject: Geography                  │
│ Type: MCQ                          │
│ Difficulty: Medium                 │
│ Marks: 4                           │
│ Negative Marks: 1      ← NEW FIELD │
│ Correct Answer: Paris              │
│                                     │
│ Options:                           │
│ A. London                          │
│ B. Paris ✓                         │
│ C. Berlin                          │
│ D. Madrid                          │
│                                     │
│ [Edit] [Delete]                    │
└─────────────────────────────────────┘
```

## 💡 Common Examples

### Example 1: Competitive Exam (Standard)
```
Marks: 4
Negative Marks: 1
Ratio: 1:4 (25% deduction)

Scoring:
✅ Correct: +4 marks
❌ Wrong: -1 mark
⚪ Skipped: 0 marks
```

### Example 2: True/False Question
```
Marks: 1
Negative Marks: 0.25
Ratio: 1:4 (25% deduction)

Scoring:
✅ Correct: +1 mark
❌ Wrong: -0.25 marks
⚪ Skipped: 0 marks
```

### Example 3: No Negative Marking
```
Marks: 2
Negative Marks: 0
Ratio: No deduction

Scoring:
✅ Correct: +2 marks
❌ Wrong: 0 marks
⚪ Skipped: 0 marks
```

### Example 4: High-Stakes Assessment
```
Marks: 5
Negative Marks: 2.5
Ratio: 1:2 (50% deduction)

Scoring:
✅ Correct: +5 marks
❌ Wrong: -2.5 marks
⚪ Skipped: 0 marks
```

## 🔧 How to Use

### Creating a Question with Negative Marking
1. Click **"Add Question"**
2. Fill in question details
3. Enter **Marks** (e.g., 4)
4. Enter **Negative Marks** (e.g., 1)
   - Leave as 0 for no negative marking
   - Use 0.25, 0.5, 1, etc. for deductions
5. Complete form and click **"Add Question"**

### Editing Negative Marks
1. Click **Edit (✏️)** icon on question
2. Modify **"Negative Marks"** field
3. Click **"Update Question"**

### Viewing Negative Marks
- **Row View**: Check "Negative Marks" column
- **Card View**: Look for "Negative Marks" in details

## 📊 Common Ratios

| Ratio | Question Marks | Negative Marks | Use Case |
|-------|----------------|----------------|----------|
| 1:4   | 4              | 1              | Standard competitive exams |
| 1:4   | 1              | 0.25           | True/False questions |
| 1:3   | 3              | 1              | Moderate difficulty |
| 1:2   | 2              | 1              | Discourage guessing |
| 1:2   | 4              | 2              | High-stakes assessment |
| 1:1   | 5              | 5              | Extreme penalty (rare) |
| None  | Any            | 0              | Practice/learning mode |

## ✨ Benefits

### For Teachers
- ✅ Flexible assessment design
- ✅ Discourage random guessing
- ✅ Reward actual knowledge
- ✅ Industry-standard exam format
- ✅ Easy to configure per question

### For Students
- ✅ Clear scoring rules
- ✅ Fair evaluation
- ✅ Encourages strategic thinking
- ✅ Prepares for competitive exams

## 🎨 UI Features

### Input Field
- **Type**: Number input
- **Min**: 0
- **Step**: 0.25
- **Default**: 0
- **Placeholder**: "0"
- **Helper Text**: "Marks deducted for wrong answer (0 = no deduction)"

### Display
- **Row View**: Simple numeric value in table column
- **Card View**: Labeled field with value
- **Both Views**: Always visible alongside marks

## 🔒 Validation

### Frontend
- ✅ Minimum value: 0
- ✅ Step increment: 0.25
- ✅ Number type validation
- ✅ Default value: 0

### Backend
- ✅ NOT NULL constraint
- ✅ CHECK constraint: `negative_marks >= 0`
- ✅ DECIMAL(5,2) type
- ✅ Allows values up to 999.99

## 📝 Best Practices

### DO ✅
- Use standard ratios (1:4, 1:3, 1:2)
- Communicate policy to students
- Be consistent within same exam
- Set before publishing exam
- Use 0 for practice tests

### DON'T ❌
- Don't exceed question marks (usually)
- Don't change after exam starts
- Don't use for subjective questions
- Don't forget to inform students
- Don't use negative values

## 🚀 Technical Details

### Database
```sql
ALTER TABLE questions
ADD COLUMN negative_marks DECIMAL(5,2) NOT NULL DEFAULT 0
CHECK (negative_marks >= 0);
```

### TypeScript
```typescript
interface Question {
  // ... other fields
  marks: number;
  negative_marks: number;  // ✅ New field
  // ... other fields
}
```

### Migration
- **File**: `00020_add_negative_marks_to_questions.sql`
- **Status**: ✅ Applied successfully
- **Backward Compatible**: ✅ Yes (default 0)

## 📚 Related Documentation

- **Full Guide**: `NEGATIVE_MARKING_GUIDE.md`
- **Migration File**: `supabase/migrations/00020_add_negative_marks_to_questions.sql`
- **Component**: `src/pages/teacher/QuestionBank.tsx`
- **Types**: `src/types/types.ts`

## 🎓 Quick Tips

1. **For MCQ**: Use 1:4 ratio (1 mark deduction for 4 marks question)
2. **For True/False**: Use 0.25 or 0.5 deduction
3. **For Practice**: Set to 0 (no negative marking)
4. **For Competitive**: Use standard 1:4 or 1:3 ratio
5. **For High-Stakes**: Use 1:2 ratio to strongly discourage guessing

## 📞 Support

For detailed information, see `NEGATIVE_MARKING_GUIDE.md`

---

**Feature Status**: ✅ Fully Implemented and Tested
**Version**: 1.0
**Last Updated**: 2025-12-11
