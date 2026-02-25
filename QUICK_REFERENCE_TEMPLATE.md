# Quick Reference: 3-Sheet Template Structure

## 📋 Template Overview

```
┌─────────────────────────────────────────────────────────┐
│ question_bank_template.xlsx                             │
├─────────────────────────────────────────────────────────┤
│ Sheet 1: Options      → Dropdown values (don't modify)  │
│ Sheet 2: Questions    → Work here! (empty + dropdowns)  │
│ Sheet 3: Reference    → Examples (read-only)            │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Start (5 Steps)

1. **Download** template from Bulk Upload dialog
2. **Review** Reference sheet (see examples)
3. **Go to** Questions sheet (empty, ready to use)
4. **Use dropdowns** ⬇️ to select values (no typing!)
5. **Upload** file and fix any validation errors

---

## 📊 Sheet Details

### Sheet 1: Options
- **Purpose**: Dropdown values
- **Action**: Don't modify
- **Contains**: Classes, Subjects, Lessons, Question Types, Difficulty Levels

### Sheet 2: Questions ⭐
- **Purpose**: Your work area
- **Action**: Enter questions here
- **Contains**: Empty rows with dropdown validation

### Sheet 3: Reference
- **Purpose**: Examples
- **Action**: Use as guide
- **Contains**: 5 sample questions (one for each type)

---

## ⬇️ Dropdown Fields

| Field | Required | Values From |
|-------|----------|-------------|
| Class Name | ✅ Yes | Options Sheet |
| Subject Name | ✅ Yes | Options Sheet |
| Lesson Name | ⚠️ Optional | Options Sheet |
| Question Type | ✅ Yes | Options Sheet |
| Difficulty | ✅ Yes | Options Sheet |

---

## 📝 Question Types

1. **mcq**: Multiple Choice (fill Options A-D, Correct Answer)
2. **true_false**: True/False (Correct Answer: "True" or "False")
3. **short_answer**: Short Answer (fill Correct Answer)
4. **match_following**: Match Following (fill Match Left/Right 1-4)
5. **multiple_response**: Multiple Response (fill Options, Correct Answer as "A,C", Answer Options)

---

## ✅ Do's

- ✅ Use dropdown menus for validated fields
- ✅ Check Reference sheet for examples
- ✅ Keep Options sheet intact
- ✅ Work only in Questions sheet
- ✅ Test with small batch first

---

## ❌ Don'ts

- ❌ Don't modify Options sheet
- ❌ Don't delete Reference sheet
- ❌ Don't type values manually (use dropdowns)
- ❌ Don't change column headers
- ❌ Don't rename sheets

---

## 🚨 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Class not found" | Typed manually | Use dropdown |
| "Subject not found" | Typed manually | Use dropdown |
| "Invalid question type" | Wrong value | Use dropdown |
| "Dropdown not showing" | File corrupted | Re-download template |

---

## 💡 Pro Tips

1. **Start Small**: Test with 2-3 questions first
2. **Use Reference**: Keep it open while working
3. **Save Often**: Don't lose your work
4. **Check Options**: Verify your classes/subjects are listed
5. **Test Upload**: Upload small batch to catch errors early

---

## 📞 Need Help?

1. Check validation error messages (include row numbers)
2. Review Reference sheet for correct format
3. Verify Options sheet has your data
4. Try re-downloading template
5. Check BULK_UPLOAD_GUIDE.md for detailed instructions

---

## 🎨 Visual Workflow

```
Download → Review → Check → Work → Upload
Template   Reference Options Questions File
           Sheet     Sheet   Sheet
           (examples)(values)(dropdowns)
```

---

## 📚 Documentation

- **BULK_UPLOAD_GUIDE.md**: Detailed user guide
- **TEMPLATE_STRUCTURE.md**: Visual structure guide
- **IMPLEMENTATION_SUMMARY.md**: Technical details
- **BEFORE_AFTER_TEMPLATE_RESTRUCTURE.md**: Comparison

---

## ⚡ Key Benefits

- 🎯 **Clean Work Area**: No sample data to delete
- 🛡️ **Error Prevention**: Dropdown validation
- 📖 **Clear Guidance**: Separate examples
- 🎨 **Professional**: Well-organized structure
- ⚡ **Fast**: Ready to use immediately

---

## 🔍 Validation Rules

- ✅ All required fields filled
- ✅ Class/Subject exist in system
- ✅ Question type is valid
- ✅ Difficulty level is valid
- ✅ Marks > 0
- ✅ Type-specific fields correct

---

## 📊 Template Stats

- **Sheets**: 3 (Options, Questions, Reference)
- **Dropdown Fields**: 5 (Class, Subject, Lesson, Type, Difficulty)
- **Sample Questions**: 5 (one per type)
- **Supported Rows**: 1000 (with validation)

---

## 🎓 Example Row

```
Question Text: What is the capital of France?
Class Name: [Dropdown: Class 10] ⬇️
Subject Name: [Dropdown: Geography] ⬇️
Lesson Name: [Dropdown: World Capitals] ⬇️
Question Type: [Dropdown: mcq] ⬇️
Difficulty: [Dropdown: easy] ⬇️
Marks: 1
Negative Marks: 0
Option A: London
Option B: Paris
Option C: Berlin
Option D: Madrid
Correct Answer: Paris
```

---

## 🚀 Success Checklist

Before uploading:
- [ ] All required fields filled
- [ ] Used dropdowns (not typed)
- [ ] Checked Reference sheet for format
- [ ] Verified Options sheet intact
- [ ] Tested with small batch
- [ ] Saved file

---

## 📈 Version History

- **v1.0**: Initial 2-sheet structure
- **v2.0**: ✨ New 3-sheet structure (current)
  - Added Reference sheet
  - Made Questions sheet empty
  - Improved dropdown validation
  - Enhanced user experience

---

**Last Updated**: December 31, 2024
**Version**: 2.0
**Status**: ✅ Production Ready
