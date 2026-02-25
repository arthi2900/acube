# Visual Guide: Passing Marks Auto-Calculation Feature

## Feature Overview

This guide demonstrates the automatic passing marks calculation feature that ensures all exams follow the 35% passing threshold.

## Before Implementation

### Previous Behavior
- Teachers manually entered passing marks
- Risk of inconsistency across exams
- Potential for calculation errors
- No enforcement of 35% policy

### Old UI
```
┌─────────────────────────────────────────┐
│ Passing Marks *                         │
│ ┌─────────────────────────────────────┐ │
│ │ 40                                  │ │ ← Manual input
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Issues
❌ Teachers could enter any value (e.g., 40, 50, 30)
❌ No validation against 35% policy
❌ Inconsistent passing thresholds across exams
❌ Manual calculation required

## After Implementation

### New Behavior
- System automatically calculates passing marks as 35% of total marks
- Calculation happens when question paper is selected
- Field is read-only (cannot be edited)
- Transparent display of calculation
- Consistent across all exams

### New UI
```
┌─────────────────────────────────────────────────────────────┐
│ Passing Marks (Auto-calculated as 35% of Total Marks)      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 35                                    [Read-Only]       │ │ ← Auto-calculated
│ └─────────────────────────────────────────────────────────┘ │
│ Total Marks: 100 | Passing Marks: 35 (35%)                 │ ← Helper text
└─────────────────────────────────────────────────────────────┘
```

### Benefits
✅ Automatic calculation based on question paper total marks
✅ Enforces 35% policy consistently
✅ No manual calculation errors
✅ Transparent and visible to teachers
✅ Read-only field prevents manual override

## User Flow

### Step 1: Navigate to Create Exam
```
Teacher Dashboard
    ↓
[Create Exam] Button
    ↓
Create Exam Page
```

### Step 2: Fill Basic Information
```
┌─────────────────────────────────────────┐
│ Exam Type: ○ Practice  ● School-Level  │
│                                         │
│ Exam Title: Mathematics Mid-Term       │
│                                         │
│ Question Paper: [Select...]             │ ← Not selected yet
│                                         │
│ Passing Marks: 0                        │ ← Default value
└─────────────────────────────────────────┘
```

### Step 3: Select Question Paper
```
┌─────────────────────────────────────────┐
│ Question Paper: [Mathematics Paper 1]   │ ← Selected
│                 (Total Marks: 100)      │
│                                         │
│ Passing Marks: 35                       │ ← Auto-calculated!
│ Total Marks: 100 | Passing Marks: 35   │
└─────────────────────────────────────────┘
```

### Step 4: Complete and Submit
```
┌─────────────────────────────────────────┐
│ ✓ Exam Title: Mathematics Mid-Term     │
│ ✓ Question Paper: Mathematics Paper 1  │
│ ✓ Total Marks: 100                     │
│ ✓ Passing Marks: 35 (Auto-calculated)  │
│ ✓ Duration: 60 minutes                 │
│ ✓ Start Time: 2025-12-15 10:00 AM     │
│ ✓ End Time: 2025-12-15 11:00 AM       │
│                                         │
│ [Submit Exam]                           │
└─────────────────────────────────────────┘
```

## Calculation Examples

### Example 1: Standard 100 Marks Exam
```
Question Paper: Mathematics Paper 1
Total Marks: 100
Calculation: 100 × 0.35 = 35
Passing Marks: 35
```

### Example 2: 80 Marks Exam
```
Question Paper: Science Quiz
Total Marks: 80
Calculation: 80 × 0.35 = 28
Passing Marks: 28
```

### Example 3: 50 Marks Exam (with rounding)
```
Question Paper: English Test
Total Marks: 50
Calculation: 50 × 0.35 = 17.5
Passing Marks: 18 (rounded up)
```

### Example 4: 33 Marks Exam (with rounding)
```
Question Paper: Quick Assessment
Total Marks: 33
Calculation: 33 × 0.35 = 11.55
Passing Marks: 12 (rounded up)
```

## Student View

### Before Taking Exam
```
┌─────────────────────────────────────────┐
│ Mathematics Mid-Term Exam               │
│                                         │
│ Duration: 60 minutes                    │
│ Total Marks: 100                        │
│ Passing Marks: 35                       │ ← Clear threshold
│                                         │
│ [Start Exam]                            │
└─────────────────────────────────────────┘
```

### After Submission
```
┌─────────────────────────────────────────┐
│ Exam Result                             │
│                                         │
│ Total Marks: 100                        │
│ Marks Obtained: 42                      │
│ Passing Marks: 35                       │
│ Percentage: 42%                         │
│                                         │
│ Status: ✓ PASS                          │ ← 42 ≥ 35
└─────────────────────────────────────────┘
```

## Principal Approval View

### Exam Approval Screen
```
┌─────────────────────────────────────────┐
│ Exam Details for Approval               │
│                                         │
│ Title: Mathematics Mid-Term             │
│ Teacher: John Doe                       │
│ Class: Class 10                         │
│ Subject: Mathematics                    │
│                                         │
│ Question Paper: Mathematics Paper 1     │
│ Total Marks: 100                        │
│ Passing Marks: 35 (35%)                 │ ← Verified
│                                         │
│ Duration: 60 minutes                    │
│ Start: 2025-12-15 10:00 AM             │
│ End: 2025-12-15 11:00 AM               │
│                                         │
│ [Approve] [Reject]                      │
└─────────────────────────────────────────┘
```

## Technical Implementation

### Code Structure
```typescript
// State management
const [totalMarks, setTotalMarks] = useState(0);
const [formData, setFormData] = useState({
  passingMarks: 0,  // Initial value
  // ... other fields
});

// Auto-calculation effect
useEffect(() => {
  if (formData.questionPaperId) {
    const selectedPaper = questionPapers.find(
      p => p.id === formData.questionPaperId
    );
    if (selectedPaper && selectedPaper.total_marks) {
      // Calculate 35% and round up
      const calculatedPassingMarks = Math.ceil(
        selectedPaper.total_marks * 0.35
      );
      setTotalMarks(selectedPaper.total_marks);
      setFormData(prev => ({ 
        ...prev, 
        passingMarks: calculatedPassingMarks 
      }));
    }
  }
}, [formData.questionPaperId, questionPapers]);
```

### UI Component
```tsx
<div className="space-y-2">
  <Label htmlFor="passingMarks">
    Passing Marks (Auto-calculated as 35% of Total Marks)
  </Label>
  <Input
    id="passingMarks"
    type="number"
    value={formData.passingMarks}
    readOnly
    disabled
    className="bg-muted"
  />
  <p className="text-sm text-muted-foreground">
    Total Marks: {totalMarks} | Passing Marks: {formData.passingMarks} (35%)
  </p>
</div>
```

## Validation and Error Handling

### Scenario 1: No Question Paper Selected
```
┌─────────────────────────────────────────┐
│ Question Paper: [Select...]             │
│                                         │
│ Passing Marks: 0                        │
│                                         │
│ ⚠ Please select a question paper       │
└─────────────────────────────────────────┘
```

### Scenario 2: Question Paper with 0 Marks
```
┌─────────────────────────────────────────┐
│ Question Paper: Empty Paper             │
│                 (Total Marks: 0)        │
│                                         │
│ ❌ Error: The selected question paper  │
│    has no questions. Please add         │
│    questions first.                     │
└─────────────────────────────────────────┘
```

### Scenario 3: Valid Question Paper
```
┌─────────────────────────────────────────┐
│ Question Paper: Mathematics Paper 1     │
│                 (Total Marks: 100)      │
│                                         │
│ Passing Marks: 35                       │
│ ✓ Automatically calculated              │
└─────────────────────────────────────────┘
```

## Comparison Table

| Aspect | Before | After |
|--------|--------|-------|
| **Input Method** | Manual entry | Automatic calculation |
| **Consistency** | Variable | Always 35% |
| **Accuracy** | Prone to errors | 100% accurate |
| **Validation** | None | Built-in |
| **Transparency** | Hidden calculation | Visible formula |
| **User Control** | Full control | Read-only (enforced policy) |
| **Compliance** | Manual enforcement | Automatic enforcement |

## Key Takeaways

1. **Automatic**: No manual calculation required
2. **Consistent**: All exams follow 35% policy
3. **Transparent**: Calculation is visible to users
4. **Accurate**: No rounding or calculation errors
5. **Enforced**: Cannot be manually overridden
6. **User-Friendly**: Clear labels and helper text

## Related Documentation

- **PASSING_MARKS_IMPLEMENTATION.md** - Technical implementation details
- **PASSING_MARKS_QUICK_REFERENCE.md** - Quick reference guide
- **USER_GUIDE.md** - Complete user guide

---

**Note**: This feature ensures compliance with the educational institution's grading policy and maintains consistency across all exams in the system.
