# Quick Start Guide: Student Exam Detail View

## 🎯 Purpose
View detailed exam performance for individual students, including which questions they answered correctly or incorrectly.

## 📍 How to Access

### Step 1: Navigate to Manage Exams
- Login as **Teacher**, **Principal**, or **Admin**
- Click on **"Manage Exams"** from your dashboard

### Step 2: View Exam Results
- Find the exam you want to review
- Click the **"View Results"** button

### Step 3: Select a Student
- In the Student Results table, you'll see a list of all students
- **Click on any student's name** (it's now a clickable link)
- You'll be taken to the detailed view for that student

## 📊 What You'll See

### Top Section: Summary Cards
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Status    │    Score    │   Result    │ Time Taken  │
│  Evaluated  │  75 / 100   │    Pass     │   45 min    │
│             │   75.00%    │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Middle Section: Exam Timeline
- **Started:** Date and time when student began the exam
- **Submitted:** Date and time when student submitted

### Bottom Section: Question-wise Analysis
For each question, you'll see:

```
┌────────────────────────────────────────────────────────┐
│ Q1. [MCQ] [5 marks] [-1 negative]                  ✓   │
│                                                         │
│ What is 2 + 2?                                         │
│ A) 3                                                   │
│ B) 4                                                   │
│ C) 5                                                   │
│ D) 6                                                   │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ Student Answer: [B]                                    │
│ Correct Answer: [B]                                    │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ Marks: 5 / 5                    [Correct]              │
└────────────────────────────────────────────────────────┘
```

## 🎨 Visual Indicators

### Status Badges
- **Not Attempted** - Gray badge
- **In Progress** - Outlined badge
- **Submitted** - Secondary badge
- **Evaluated** - Primary badge

### Result Badges
- **Pass** - Green badge with checkmark ✓
- **Fail** - Red badge with cross ✗

### Answer Correctness
- **Correct Answer** - Green checkmark (✓) on the right
- **Incorrect Answer** - Red cross (✗) on the right

## 📝 Question Types Supported

### 1. Multiple Choice Questions (MCQ)
- Shows all options
- Highlights student's selection
- Displays correct answer

### 2. True/False
- Shows student's choice
- Displays correct answer

### 3. Multiple Response
- Shows all selected answers as badges
- Displays correct combination

### 4. Short Answer
- Shows student's written response
- Displays expected answer for comparison

### 5. Match Following
- Shows student's matches (Left → Right)
- Displays correct matches

## 🔍 Use Cases

### 1. Identify Weak Areas
**Scenario:** Student failed the exam
- Review which topics they struggled with
- Identify patterns in incorrect answers
- Plan remedial teaching

### 2. Verify Grading
**Scenario:** Student questions their grade
- Review each answer in detail
- Verify automatic grading was correct
- Provide explanation if needed

### 3. Performance Analysis
**Scenario:** Track student improvement
- Compare performance across questions
- Identify consistent strengths
- Note areas needing attention

### 4. Provide Feedback
**Scenario:** Give personalized feedback
- Reference specific questions
- Explain why answers were incorrect
- Suggest study materials

## 🚀 Tips for Teachers

1. **Quick Navigation**: Use the back button to return to the results page
2. **Compare Students**: Open multiple tabs to compare different students
3. **Take Notes**: Keep track of common mistakes across students
4. **Follow Up**: Use this data to plan review sessions

## ⚠️ Important Notes

- Only **submitted** or **evaluated** exams show detailed answers
- Students who haven't started the exam won't have answer data
- The page is read-only - you cannot edit answers here
- All question types are supported with appropriate displays

## 🔐 Access Permissions

| Role      | Can Access? |
|-----------|-------------|
| Teacher   | ✅ Yes      |
| Principal | ✅ Yes      |
| Admin     | ✅ Yes      |
| Student   | ❌ No       |

## 📱 Mobile Support

The page is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🆘 Troubleshooting

### Problem: Student name is not clickable
**Solution:** Ensure the student has submitted the exam

### Problem: No answers showing
**Solution:** Check if the student actually attempted the exam

### Problem: Page shows "not found"
**Solution:** Verify you have the correct permissions and the exam exists

## 📞 Need Help?

If you encounter any issues:
1. Check your internet connection
2. Refresh the page
3. Verify you're logged in with the correct role
4. Contact your system administrator

---

**Last Updated:** December 2025
**Feature Version:** 1.0
