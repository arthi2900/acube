# Force Delete Exam - Testing Guide

## 🧪 Comprehensive Testing Checklist

This guide provides step-by-step testing instructions to verify the Force Delete Exam feature works correctly.

---

## 📋 Pre-Testing Setup

### Required Test Accounts

1. **Admin Account**
   - Role: `admin`
   - Purpose: Test full force delete access

2. **Principal Account**
   - Role: `principal`
   - Purpose: Test principal force delete access

3. **Teacher Account**
   - Role: `teacher`
   - Purpose: Test restricted access

4. **Student Accounts** (at least 2)
   - Role: `student`
   - Purpose: Create exam attempts

### Required Test Data

1. **Exam without attempts**
   - Status: `draft` or `published`
   - Student attempts: 0

2. **Exam with attempts**
   - Status: `published`
   - Student attempts: 2+

3. **Completed exam**
   - Status: `completed`
   - Student attempts: 2+

---

## 🔍 Test Cases

### Test Suite 1: Role-Based UI Rendering

#### Test 1.1: Teacher View
**Objective**: Verify teachers see single delete button

**Steps**:
1. Login as Teacher
2. Navigate to "Manage Exams"
3. Locate any exam card

**Expected Results**:
- ✅ Single "Delete" button visible
- ✅ No dropdown menu
- ✅ No "Force Delete" option

**Status**: [ ] Pass [ ] Fail

---

#### Test 1.2: Principal View
**Objective**: Verify principals see dropdown menu

**Steps**:
1. Login as Principal
2. Navigate to "Manage Exams"
3. Locate any exam card
4. Click "Delete" button

**Expected Results**:
- ✅ Dropdown menu appears
- ✅ "Normal Delete" option visible
- ✅ "Force Delete" option visible (in red)
- ✅ Both options clickable

**Status**: [ ] Pass [ ] Fail

---

#### Test 1.3: Admin View
**Objective**: Verify admins see dropdown menu

**Steps**:
1. Login as Admin
2. Navigate to "Manage Exams"
3. Locate any exam card
4. Click "Delete" button

**Expected Results**:
- ✅ Dropdown menu appears
- ✅ "Normal Delete" option visible
- ✅ "Force Delete" option visible (in red)
- ✅ Both options clickable

**Status**: [ ] Pass [ ] Fail

---

### Test Suite 2: Normal Delete Behavior

#### Test 2.1: Normal Delete Without Attempts (Teacher)
**Objective**: Verify normal delete works for exams without attempts

**Steps**:
1. Login as Teacher
2. Navigate to "Manage Exams"
3. Find exam with 0 attempts
4. Click "Delete" button
5. Review confirmation dialog
6. Click "Delete Exam"

**Expected Results**:
- ✅ Confirmation dialog appears
- ✅ Shows exam details
- ✅ Shows "Student Attempts: 0"
- ✅ Deletion succeeds
- ✅ Success toast: "Exam deleted successfully"
- ✅ Exam removed from list

**Status**: [ ] Pass [ ] Fail

---

#### Test 2.2: Normal Delete With Attempts (Teacher)
**Objective**: Verify normal delete blocked when attempts exist

**Steps**:
1. Login as Teacher
2. Navigate to "Manage Exams"
3. Find exam with 2+ attempts
4. Click "Delete" button
5. Wait for validation

**Expected Results**:
- ✅ Button shows "Checking..." briefly
- ✅ Error toast appears
- ✅ Message: "Cannot Delete Exam"
- ✅ Description: "X student(s) have already attempted this exam"
- ✅ Exam NOT deleted
- ✅ Exam still in list

**Status**: [ ] Pass [ ] Fail

---

#### Test 2.3: Normal Delete With Attempts (Principal)
**Objective**: Verify normal delete blocked for principals too

**Steps**:
1. Login as Principal
2. Navigate to "Manage Exams"
3. Find exam with 2+ attempts
4. Click "Delete" dropdown
5. Select "Normal Delete"
6. Wait for validation

**Expected Results**:
- ✅ Error toast appears
- ✅ Message: "Cannot Delete Exam"
- ✅ Description: "X student(s) have already attempted this exam"
- ✅ Exam NOT deleted

**Status**: [ ] Pass [ ] Fail

---

### Test Suite 3: Force Delete Functionality

#### Test 3.1: Force Delete Dialog Opens
**Objective**: Verify force delete dialog appears correctly

**Steps**:
1. Login as Principal
2. Navigate to "Manage Exams"
3. Find exam with 2+ attempts
4. Click "Delete" dropdown
5. Select "Force Delete"

**Expected Results**:
- ✅ Force Delete dialog opens
- ✅ Warning icon (⚠️) visible
- ✅ Title: "Force Delete Exam"
- ✅ Exam name displayed
- ✅ Red warning box visible
- ✅ Warning message displayed
- ✅ Exam details shown (class, subject, status)
- ✅ Attempt count highlighted in red
- ✅ Additional warning about deleting attempts
- ✅ Text input field visible
- ✅ Placeholder: "Type DELETE to confirm"
- ✅ "Force Delete" button disabled
- ✅ "Cancel" button enabled

**Status**: [ ] Pass [ ] Fail

---

#### Test 3.2: Text Confirmation Validation
**Objective**: Verify text input validation works correctly

**Steps**:
1. Open Force Delete dialog (from Test 3.1)
2. Try clicking "Force Delete" button (should be disabled)
3. Type "delete" (lowercase) in input
4. Check button state
5. Clear input
6. Type "Delete" (mixed case) in input
7. Check button state
8. Clear input
9. Type "DELETE" (uppercase) in input
10. Check button state

**Expected Results**:
- ✅ Button disabled initially
- ✅ Button disabled with "delete"
- ✅ Helper text: "Please type exactly 'DELETE'"
- ✅ Button disabled with "Delete"
- ✅ Button ENABLED with "DELETE"
- ✅ No helper text with correct input

**Status**: [ ] Pass [ ] Fail

---

#### Test 3.3: Force Delete Execution
**Objective**: Verify force delete executes successfully

**Steps**:
1. Open Force Delete dialog
2. Note the exam ID and attempt count
3. Type "DELETE" in input field
4. Click "Force Delete" button
5. Wait for completion

**Expected Results**:
- ✅ Button shows "Deleting..." during operation
- ✅ Both buttons disabled during deletion
- ✅ Success toast appears
- ✅ Message: "Exam and all associated data deleted successfully"
- ✅ Dialog closes automatically
- ✅ Exam removed from list
- ✅ List refreshes automatically

**Status**: [ ] Pass [ ] Fail

---

#### Test 3.4: Verify Complete Data Deletion
**Objective**: Verify all related data deleted from database

**Steps**:
1. Note exam ID before deletion
2. Execute force delete (from Test 3.3)
3. Check database tables:
   ```sql
   -- Check exam deleted
   SELECT * FROM exams WHERE id = '<exam-id>';
   
   -- Check attempts deleted
   SELECT * FROM exam_attempts WHERE exam_id = '<exam-id>';
   
   -- Check answers deleted
   SELECT * FROM exam_answers WHERE attempt_id IN (
     SELECT id FROM exam_attempts WHERE exam_id = '<exam-id>'
   );
   ```

**Expected Results**:
- ✅ Exam record not found
- ✅ No exam attempts found
- ✅ No exam answers found
- ✅ No orphaned records

**Status**: [ ] Pass [ ] Fail

---

#### Test 3.5: Force Delete Cancel
**Objective**: Verify cancel button works correctly

**Steps**:
1. Open Force Delete dialog
2. Type "DELETE" in input field
3. Click "Cancel" button

**Expected Results**:
- ✅ Dialog closes
- ✅ Exam NOT deleted
- ✅ Exam still in list
- ✅ No error messages

**Status**: [ ] Pass [ ] Fail

---

#### Test 3.6: Force Delete Dialog Reset
**Objective**: Verify dialog resets when reopened

**Steps**:
1. Open Force Delete dialog
2. Type "DELETE" in input field
3. Click "Cancel"
4. Open Force Delete dialog again

**Expected Results**:
- ✅ Input field is empty
- ✅ "Force Delete" button disabled
- ✅ No previous state retained

**Status**: [ ] Pass [ ] Fail

---

### Test Suite 4: Security & Authorization

#### Test 4.1: Teacher Cannot Access Force Delete API
**Objective**: Verify API blocks teacher access

**Steps**:
1. Login as Teacher
2. Open browser console
3. Get an exam ID
4. Execute:
   ```javascript
   const { data, error } = await supabase
     .rpc('force_delete_exam', { exam_id: '<exam-id>' });
   console.log(data);
   ```

**Expected Results**:
- ✅ Function returns error
- ✅ Message: "Unauthorized: Only Principals and Admins can force delete exams"
- ✅ success: false
- ✅ Exam NOT deleted

**Status**: [ ] Pass [ ] Fail

---

#### Test 4.2: Principal Can Access Force Delete API
**Objective**: Verify API allows principal access

**Steps**:
1. Login as Principal
2. Open browser console
3. Get an exam ID (with attempts)
4. Execute:
   ```javascript
   const { data, error } = await supabase
     .rpc('force_delete_exam', { exam_id: '<exam-id>' });
   console.log(data);
   ```

**Expected Results**:
- ✅ Function succeeds
- ✅ success: true
- ✅ Message: "Exam and all associated data deleted successfully"
- ✅ attempts_deleted: X (correct count)
- ✅ Exam deleted from database

**Status**: [ ] Pass [ ] Fail

---

#### Test 4.3: Invalid Exam ID
**Objective**: Verify error handling for non-existent exam

**Steps**:
1. Login as Principal
2. Open browser console
3. Execute:
   ```javascript
   const { data, error } = await supabase
     .rpc('force_delete_exam', { exam_id: '00000000-0000-0000-0000-000000000000' });
   console.log(data);
   ```

**Expected Results**:
- ✅ Function returns error
- ✅ Message: "Exam not found"
- ✅ success: false

**Status**: [ ] Pass [ ] Fail

---

### Test Suite 5: Edge Cases

#### Test 5.1: Completed Exam
**Objective**: Verify delete button hidden for completed exams

**Steps**:
1. Login as Principal
2. Navigate to "Manage Exams"
3. Find exam with status "completed"

**Expected Results**:
- ✅ No delete button visible
- ✅ Only "View Results" button shown

**Status**: [ ] Pass [ ] Fail

---

#### Test 5.2: Multiple Rapid Clicks
**Objective**: Verify no duplicate deletions

**Steps**:
1. Open Force Delete dialog
2. Type "DELETE"
3. Click "Force Delete" button multiple times rapidly

**Expected Results**:
- ✅ Button disabled after first click
- ✅ Shows "Deleting..." state
- ✅ Only one deletion executed
- ✅ No errors

**Status**: [ ] Pass [ ] Fail

---

#### Test 5.3: Network Error Handling
**Objective**: Verify graceful error handling

**Steps**:
1. Open browser DevTools
2. Go to Network tab
3. Enable "Offline" mode
4. Open Force Delete dialog
5. Type "DELETE" and confirm

**Expected Results**:
- ✅ Error toast appears
- ✅ Message: "Failed to force delete exam"
- ✅ Dialog remains open
- ✅ Can retry after going online

**Status**: [ ] Pass [ ] Fail

---

#### Test 5.4: Concurrent Deletion
**Objective**: Verify behavior when exam deleted by another user

**Steps**:
1. Login as Principal in two browsers
2. In Browser 1: Open Force Delete dialog for exam X
3. In Browser 2: Force delete exam X
4. In Browser 1: Complete force delete

**Expected Results**:
- ✅ Browser 1 shows error: "Exam not found"
- ✅ No crash or unexpected behavior
- ✅ List refreshes correctly

**Status**: [ ] Pass [ ] Fail

---

### Test Suite 6: UI/UX Testing

#### Test 6.1: Responsive Design
**Objective**: Verify UI works on different screen sizes

**Steps**:
1. Login as Principal
2. Navigate to "Manage Exams"
3. Test on:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)

**Expected Results**:
- ✅ Dropdown menu accessible on all sizes
- ✅ Dialog readable and usable
- ✅ Buttons properly sized
- ✅ Text not truncated

**Status**: [ ] Pass [ ] Fail

---

#### Test 6.2: Keyboard Navigation
**Objective**: Verify keyboard accessibility

**Steps**:
1. Login as Principal
2. Navigate to "Manage Exams"
3. Use Tab key to navigate
4. Open Force Delete dialog
5. Use Tab to navigate dialog
6. Use Enter to confirm

**Expected Results**:
- ✅ Can tab to delete button
- ✅ Can open dropdown with keyboard
- ✅ Can navigate dialog with Tab
- ✅ Can type in input field
- ✅ Can confirm with Enter
- ✅ Can cancel with Esc

**Status**: [ ] Pass [ ] Fail

---

#### Test 6.3: Screen Reader Support
**Objective**: Verify screen reader compatibility

**Steps**:
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Login as Principal
3. Navigate to "Manage Exams"
4. Navigate to delete button
5. Open Force Delete dialog

**Expected Results**:
- ✅ Button announced correctly
- ✅ Dialog title announced
- ✅ Warning message read
- ✅ Input field labeled
- ✅ Button states announced

**Status**: [ ] Pass [ ] Fail

---

#### Test 6.4: Visual Feedback
**Objective**: Verify all visual states work correctly

**Steps**:
1. Test all button states:
   - Normal
   - Hover
   - Disabled
   - Loading
2. Test dialog states:
   - Opening animation
   - Closing animation
3. Test toast notifications:
   - Success
   - Error

**Expected Results**:
- ✅ Clear visual distinction between states
- ✅ Smooth animations
- ✅ Proper color contrast
- ✅ Icons display correctly

**Status**: [ ] Pass [ ] Fail

---

### Test Suite 7: Performance Testing

#### Test 7.1: Large Dataset
**Objective**: Verify performance with many attempts

**Steps**:
1. Create exam with 100+ student attempts
2. Login as Principal
3. Open Force Delete dialog
4. Execute force delete
5. Measure time to complete

**Expected Results**:
- ✅ Dialog opens quickly (< 1 second)
- ✅ Deletion completes in reasonable time (< 5 seconds)
- ✅ No UI freezing
- ✅ Success message appears

**Status**: [ ] Pass [ ] Fail

---

#### Test 7.2: Multiple Exams
**Objective**: Verify performance with many exams

**Steps**:
1. Create 50+ exams
2. Login as Principal
3. Navigate to "Manage Exams"
4. Measure page load time
5. Test delete functionality

**Expected Results**:
- ✅ Page loads in reasonable time
- ✅ Dropdown menu responsive
- ✅ Dialog opens quickly
- ✅ No performance degradation

**Status**: [ ] Pass [ ] Fail

---

## 📊 Test Results Summary

### Overall Results

| Test Suite | Total Tests | Passed | Failed | Status |
|------------|-------------|--------|--------|--------|
| Role-Based UI | 3 | | | |
| Normal Delete | 3 | | | |
| Force Delete | 6 | | | |
| Security | 3 | | | |
| Edge Cases | 4 | | | |
| UI/UX | 4 | | | |
| Performance | 2 | | | |
| **TOTAL** | **25** | | | |

### Pass Rate
- **Target**: 100%
- **Actual**: ____%

---

## 🐛 Bug Report Template

If any test fails, use this template to report:

```markdown
### Bug Report

**Test Case**: [Test ID and Name]
**Severity**: [Critical/High/Medium/Low]
**Environment**: [Browser, OS, Screen Size]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots**:
[Attach if applicable]

**Console Errors**:
[Copy any errors from browser console]

**Additional Notes**:
[Any other relevant information]
```

---

## ✅ Sign-Off

### Tester Information
- **Name**: _______________
- **Date**: _______________
- **Role**: _______________

### Test Completion
- [ ] All test cases executed
- [ ] All tests passed
- [ ] Bugs reported (if any)
- [ ] Documentation reviewed
- [ ] Feature approved for production

### Signatures
- **Tester**: _______________
- **Reviewer**: _______________
- **Approver**: _______________

---

## 📚 Additional Resources

- **Full Documentation**: `FORCE_DELETE_EXAM_FEATURE.md`
- **Quick Reference**: `FORCE_DELETE_QUICK_REFERENCE.md`
- **Visual Guide**: `FORCE_DELETE_VISUAL_GUIDE.md`
- **Implementation Summary**: `FORCE_DELETE_IMPLEMENTATION_SUMMARY.md`

---

**Happy Testing! 🧪**
