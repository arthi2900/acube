# Testing Guide: Submission Progress Indicators

## Overview
This guide helps you test the new submission progress indicators and performance optimizations.

## Prerequisites
- Login as a student
- Have at least one active exam available
- Exam should have questions to answer

## Test Scenarios

### Test 1: Manual Submission with Progress Dialog

**Steps:**
1. Login as a student
2. Navigate to "Available Exams"
3. Click "Start Exam" on any exam
4. Answer at least a few questions (optional)
5. Click "Submit Exam" button
6. Confirm submission in the dialog

**Expected Results:**
✅ Progress dialog appears immediately
✅ Progress bar shows 0% → 25% → 50% → 75% → 100%
✅ Step 1: "Saving your answers..." with spinning loader
✅ Step 2: "Submitting exam..." with spinning loader
✅ Step 3: "Evaluating your answers..." with spinning loader
✅ Step 4: "Finalizing results..." with spinning loader
✅ All completed steps show green checkmarks
✅ Dialog shows "Do not close this window" message
✅ After completion, redirected to results page
✅ Toast notification: "Exam submitted and evaluated successfully"

**Duration:** Should take 2-4 seconds total

---

### Test 2: Auto-Submission (Timer Expires)

**Steps:**
1. Login as a student
2. Start an exam with a short duration (or wait for timer to expire)
3. Let the timer reach 0:00

**Expected Results:**
✅ Progress dialog appears automatically when timer hits 0
✅ Same 4-step progress as manual submission
✅ All answers saved (including unanswered questions as null)
✅ Toast notification: "Time Up! Your exam has been automatically submitted and evaluated"
✅ Redirected to results page

---

### Test 3: Error Handling

**Steps:**
1. Login as a student
2. Start an exam
3. Disconnect internet (or simulate network error)
4. Try to submit the exam

**Expected Results:**
✅ Progress dialog appears
✅ One of the steps fails and shows red error icon
✅ Error message displayed in red box
✅ Dialog auto-closes after 3 seconds
✅ Toast notification shows error message

---

## Visual Checklist

### Progress Dialog Appearance
- [ ] Dialog appears centered on screen
- [ ] Title: "Submitting Exam"
- [ ] Progress bar visible and animating
- [ ] Step counter: "Step X of 4"
- [ ] 4 steps listed vertically
- [ ] Icons change based on status
- [ ] Info message at bottom
- [ ] Cannot close dialog during submission

### Step Icons
- [ ] Pending: Gray circle (⚪)
- [ ] In Progress: Blue spinning loader (🔄)
- [ ] Completed: Green checkmark (✅)
- [ ] Error: Red circle (❌)

---

## Performance Benchmarks

### Expected Timings
- **Step 1 (Saving)**: 1-3 seconds
- **Step 2 (Submitting)**: ~500ms
- **Step 3 (Evaluating)**: 200-500ms
- **Step 4 (Finalizing)**: ~500ms
- **Total**: 2-4 seconds

---

## Important Notes

### About Sentry CORS Errors
The console shows multiple Sentry CORS errors. **These are completely harmless** and do not affect:
- Application functionality
- Submission process
- Progress indicators
- User experience

See `CONSOLE_ERRORS_EXPLANATION.md` for details.

### Success Indicators
Look for these logs in console to verify everything is working:
- "Filtered exams count: X" ✅
- "=== MANUAL SUBMIT ===" or "=== AUTO-SUBMIT TRIGGERED ===" ✅
- "✅ All questions saved successfully" ✅

---

## Additional Resources

- `PERFORMANCE_OPTIMIZATION.md` - Technical details
- `SUBMISSION_FLOW_DIAGRAM.md` - Visual flow diagrams
- `CONSOLE_ERRORS_EXPLANATION.md` - Understanding console errors
- `TODO.md` - Implementation history
