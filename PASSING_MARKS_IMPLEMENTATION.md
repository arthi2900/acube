# Automatic Passing Marks Calculation - Implementation Summary

## Overview
This document describes the implementation of the automatic passing marks calculation feature, which ensures that passing marks are always calculated as **35% of the total marks** for any exam.

## Key Requirement
**Pass Mark Calculation Rule**: The passing marks for any exam must be automatically calculated as 35% of the total marks of the question paper.

Formula: `Passing Marks = Math.ceil(Total Marks × 0.35)`

## Implementation Details

### 1. Modified File: `src/pages/teacher/CreateExam.tsx`

#### Changes Made:

1. **State Management**
   - Added `totalMarks` state to track the selected question paper's total marks
   - Changed initial `passingMarks` from hardcoded `40` to `0`

2. **Automatic Calculation Effect**
   ```typescript
   useEffect(() => {
     if (formData.questionPaperId) {
       const selectedPaper = questionPapers.find(p => p.id === formData.questionPaperId);
       if (selectedPaper && selectedPaper.total_marks) {
         const calculatedPassingMarks = Math.ceil(selectedPaper.total_marks * 0.35);
         setTotalMarks(selectedPaper.total_marks);
         setFormData(prev => ({ ...prev, passingMarks: calculatedPassingMarks }));
       }
     }
   }, [formData.questionPaperId, questionPapers]);
   ```

3. **UI Changes**
   - Changed the "Passing Marks" input field to **read-only** and **disabled**
   - Updated label to: "Passing Marks (Auto-calculated as 35% of Total Marks)"
   - Added informative text showing: "Total Marks: X | Passing Marks: Y (35%)"
   - Applied `bg-muted` class to visually indicate the field is not editable

### 2. How It Works

1. **When Teacher Creates an Exam:**
   - Teacher selects a question paper from the dropdown
   - System automatically retrieves the total marks from the selected question paper
   - System calculates passing marks as 35% of total marks (rounded up using `Math.ceil`)
   - Passing marks field is automatically populated and locked

2. **Example Calculations:**
   - Total Marks: 100 → Passing Marks: 35
   - Total Marks: 80 → Passing Marks: 28
   - Total Marks: 50 → Passing Marks: 18
   - Total Marks: 33 → Passing Marks: 12 (11.55 rounded up)

3. **User Experience:**
   - Teachers cannot manually edit the passing marks
   - The calculation is transparent and visible to the teacher
   - The system ensures consistency across all exams

## Benefits

1. **Consistency**: All exams follow the same 35% passing threshold
2. **Accuracy**: No manual calculation errors
3. **Transparency**: Teachers can see the calculation clearly
4. **Compliance**: Meets the educational institution's grading policy

## Database Schema

The `exams` table stores the calculated passing marks:
```sql
CREATE TABLE exams (
  id uuid PRIMARY KEY,
  question_paper_id uuid REFERENCES question_papers(id),
  title text NOT NULL,
  total_marks integer NOT NULL,
  passing_marks integer NOT NULL,  -- Auto-calculated as 35% of total_marks
  -- ... other fields
);
```

## Related Files

- **Frontend**: `src/pages/teacher/CreateExam.tsx` - Exam creation form with auto-calculation
- **Database**: `supabase/migrations/00023_create_exams_attempts_answers_tables.sql` - Exams table schema
- **API**: `src/db/api.ts` - Exam creation API calls
- **Types**: `src/types/types.ts` - TypeScript interfaces for Exam

## Testing Checklist

- [x] Passing marks are automatically calculated when question paper is selected
- [x] Calculation uses correct formula (35% of total marks)
- [x] Result is rounded up using Math.ceil
- [x] Field is read-only and disabled
- [x] UI clearly shows the calculation
- [x] Lint checks pass without errors

## Future Enhancements

If the passing percentage needs to be configurable in the future:
1. Add a system setting for passing percentage (default: 35%)
2. Allow admins to modify the passing percentage
3. Update the calculation to use the configured percentage
4. Display the configured percentage in the UI

## Notes

- The 35% threshold is a fixed requirement as per the educational institution's policy
- This implementation ensures compliance with the grading standards
- Teachers are informed about the automatic calculation through clear UI labels
- The system prevents manual override to maintain consistency
