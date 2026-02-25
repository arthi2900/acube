# Quick Reference: 35% Passing Marks Feature

## Overview
The system automatically calculates passing marks as **35% of the total marks** for every exam. This ensures consistency and compliance with educational grading standards.

## How It Works

### For Teachers Creating Exams

1. **Navigate to Create Exam**
   - Go to Teacher Dashboard → Create Exam

2. **Select Question Paper**
   - Choose a finalized question paper from the dropdown
   - System automatically retrieves total marks from the question paper

3. **Automatic Calculation**
   - Passing marks are instantly calculated as 35% of total marks
   - The field is read-only (cannot be edited)
   - Calculation is displayed clearly: "Total Marks: X | Passing Marks: Y (35%)"

4. **Complete Exam Setup**
   - Fill in other exam details (title, dates, duration, etc.)
   - Submit the exam

### Calculation Formula

```
Passing Marks = Math.ceil(Total Marks × 0.35)
```

**Note**: `Math.ceil` rounds up to the nearest whole number

### Examples

| Total Marks | Calculation | Passing Marks |
|-------------|-------------|---------------|
| 100 | 100 × 0.35 = 35 | 35 |
| 80 | 80 × 0.35 = 28 | 28 |
| 50 | 50 × 0.35 = 17.5 | 18 (rounded up) |
| 33 | 33 × 0.35 = 11.55 | 12 (rounded up) |
| 25 | 25 × 0.35 = 8.75 | 9 (rounded up) |
| 10 | 10 × 0.35 = 3.5 | 4 (rounded up) |

### For Students Taking Exams

1. **View Exam Details**
   - Before starting an exam, students can see:
     - Total Marks
     - Passing Marks (35% of total)
     - Duration

2. **After Submission**
   - System automatically evaluates objective questions
   - Calculates total marks obtained
   - Determines pass/fail status based on 35% threshold

3. **Result Display**
   - **Pass**: If marks obtained ≥ passing marks
   - **Fail**: If marks obtained < passing marks

### For Principals Approving Exams

1. **Review Exam Details**
   - When approving school-level exams, principals can see:
     - Total marks from the question paper
     - Automatically calculated passing marks (35%)

2. **Approval Decision**
   - Passing marks cannot be modified
   - Ensures consistency across all exams in the school

## Key Benefits

### 1. Consistency
- All exams follow the same 35% passing threshold
- No variation between teachers or subjects
- Standardized grading across the institution

### 2. Accuracy
- No manual calculation errors
- Automatic rounding ensures correct values
- System-enforced compliance

### 3. Transparency
- Teachers see the calculation clearly
- Students know the passing threshold before starting
- Principals can verify the calculation during approval

### 4. Efficiency
- No need for manual calculation
- Saves time during exam creation
- Reduces administrative overhead

## Technical Details

### Implementation
- **File**: `src/pages/teacher/CreateExam.tsx`
- **Trigger**: When question paper is selected
- **Calculation**: Automatic via React useEffect hook
- **Storage**: Saved in `exams.passing_marks` database field

### UI Elements
- **Label**: "Passing Marks (Auto-calculated as 35% of Total Marks)"
- **Input Field**: Read-only, disabled, with muted background
- **Helper Text**: "Total Marks: X | Passing Marks: Y (35%)"

### Database
```sql
CREATE TABLE exams (
  id uuid PRIMARY KEY,
  total_marks integer NOT NULL,
  passing_marks integer NOT NULL,  -- Auto-calculated as 35%
  -- ... other fields
);
```

## Frequently Asked Questions

### Q: Can teachers change the passing marks?
**A**: No. The passing marks field is read-only and automatically calculated. This ensures consistency across all exams.

### Q: Why is it 35%?
**A**: This is the educational institution's grading policy. It ensures a fair and consistent passing threshold for all students.

### Q: What if the calculation results in a decimal?
**A**: The system uses `Math.ceil` to round up to the nearest whole number. For example, 11.55 becomes 12.

### Q: Can the percentage be changed?
**A**: Currently, the 35% threshold is fixed. If the institution's policy changes, the system can be updated to use a different percentage.

### Q: What happens if a question paper has 0 total marks?
**A**: The system prevents creating exams from question papers with 0 total marks. Teachers must add questions to the paper first.

### Q: How do students know the passing marks?
**A**: Students can view the passing marks in the exam details before starting the exam and in their results after submission.

## Troubleshooting

### Issue: Passing marks not calculated
**Solution**: Ensure you have selected a question paper with questions (total marks > 0)

### Issue: Passing marks seem incorrect
**Solution**: Verify the total marks of the selected question paper. The calculation is always 35% of total marks, rounded up.

### Issue: Cannot edit passing marks
**Solution**: This is by design. Passing marks are automatically calculated and cannot be manually edited to ensure consistency.

## Related Documentation

- **USER_GUIDE.md** - Complete user guide for all roles
- **PASSING_MARKS_IMPLEMENTATION.md** - Detailed technical implementation
- **IMPLEMENTATION_COMPLETE_FINAL.md** - Complete system status

---

**Quick Tip**: When creating a question paper, ensure the total marks are appropriate for your exam. The passing marks will be automatically calculated as 35% of this total.
