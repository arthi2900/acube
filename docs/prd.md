# A Cube Online Test Management System - Question Bank Analysis Requirements Document

## 1. Application Description

### 1.1 Application Name
A Cube Online Test Management System - Question Bank Analysis Module

### 1.2 Application Purpose
Analyze exam responses from a selected Question Bank and specific Exam to identify questions with incorrect answers and track wrong attempt counts.

### 1.3 Core Objective
Provide educators with insights into question difficulty by analyzing student performance data, filtering incorrect answers, and displaying aggregated wrong attempt statistics for each question in the selected Question Bank and Exam.

---

## 2. Question Bank Analysis Feature

### 2.1 Question Bank Selection
- Display a dropdown or selection interface listing only the Question Banks mapped to the current user
- Allow user to select one Question Bank for analysis
- Show Question Bank name and basic metadata (total questions, associated exams count)

### 2.2 Exam Selection
- Display a dropdown or selection interface to the right side of Question Bank selection
- List all exams created based on the selected Question Bank
- Show exam names in the dropdown
- Allow user to select one specific exam for analysis
- Update analysis results based on the selected exam

### 2.3 Analysis Scope
- Analyze the selected exam that used the selected Question Bank
- Include only questions from the selected Question Bank
- Display data specific to the selected exam

### 2.4 Data Processing Logic
1. Identify the selected exam conducted using the selected Question Bank
2. Extract all student responses for questions from that Question Bank in the selected exam
3. Filter responses to identify incorrect answers
4. Count total wrong attempts for each question in the selected exam
5. Generate structured output table

---

## 3. Analysis Results Display

### 3.1 Results Table Structure

The analysis results must be displayed in a table with the following columns:

| Column Name | Description |
|-------------|-------------|
| S.No | Serial number (not sortable) |
| Question Text | Full text of the question (sortable)<br>**Display correct answer directly below the question text** |
| Type | Question type (sortable) |
| Difficulty | Difficulty level (sortable) |
| Wrong | Total count of incorrect answers in the selected exam (sortable)<br>**Clickable to show dropdown with student details** |
| Total | Total attempts in the selected exam (sortable) |
| Wrong % | Percentage of wrong attempts (sortable) |

### 3.2 Table Features
- Sortable columns for all columns except S.No (sort by ascending/descending order)
- Search functionality to filter questions by text
- Pagination for large datasets
- Export option (CSV/Excel format)
- **Clickable Wrong column values to display student response details**

### 3.3 Wrong Column Dropdown Functionality

**Behavior:**
- When user clicks on a Wrong value in the table, display a dropdown list
- Dropdown appears directly below or adjacent to the clicked Wrong value
- Dropdown is view-only (not editable)
- Clicking outside the dropdown or on another Wrong value closes the current dropdown

**Dropdown Content:**
- List of students who answered the question incorrectly
- For each student, display:
  - Student name
  - Student's incorrect answer

**Dropdown Format Example:**
```
┌─────────────────────────────────────┐
│ Students with Wrong Answers         │
├─────────────────────────────────────┤
│ • John Smith - Answer: Paris        │
│ • Emily Chen - Answer: Berlin       │
│ • Michael Brown - Answer: Madrid    │
└─────────────────────────────────────┘
```

### 3.4 Correct Answer Display

**Implementation:**
- Display the correct answer directly below the Question Text in each table row
- Format: Correct Answer: [answer text]
- Use a distinct visual style (e.g., smaller font, different color, or italic text)
- Ensure correct answer is visible without requiring user interaction

**Example Row Layout:**
```
Question Text: What is the capital of France?
Correct Answer: Paris
```

### 3.5 Additional Display Elements
- **Header Section:**
  - Selected Question Bank name
  - Selected Exam name
  - Total questions analyzed
  - Date of the selected exam

- **Summary Statistics:**
  - Total wrong attempts across all questions in the selected exam
  - Average wrong attempts per question
  - Most frequently missed question (highest wrong attempts)

---

## 4. User Workflow

### 4.1 Analysis Process
1. User navigates to Question Bank Analysis section
2. User selects a Question Bank from dropdown (showing only user-mapped Question Banks)
3. User selects an Exam from the dropdown to the right side (showing exams created based on the selected Question Bank)
4. System processes exam data and generates analysis for the selected exam
5. Results table displays with wrong attempt counts and all sortable columns
6. User can sort (except S.No), filter, and export results
7. **User can click on Wrong values to view student-specific incorrect answers**
8. **User can view correct answers displayed below each question text**

---

## 5. Technical Requirements

### 5.1 Data Access
- Access to Question Bank database
- Access to exam records and student responses
- Ability to query and aggregate response data
- Filter Question Banks by user mapping
- Filter exams by selected Question Bank
- **Retrieve individual student responses for incorrect answers**
- **Retrieve correct answers for each question**

### 5.2 Performance Considerations
- Optimize queries for large datasets (multiple exams, many students)
- Implement caching for frequently accessed Question Banks
- Display loading indicators during analysis processing
- **Lazy load student response data when Wrong value is clicked**

### 5.3 Data Accuracy
- Ensure correct mapping between questions and responses
- Validate answer correctness logic
- Handle edge cases (partial credit, multiple correct answers)
- **Accurately identify and display student names and their incorrect answers**
- **Ensure correct answer data is accurate and up-to-date**

---

## 6. Integration with Existing System

### 6.1 Question Bank Module
- Integrate with existing Question Bank selection interface
- Maintain consistency with current Question Bank management features
- Filter Question Banks based on user mapping
- **Access correct answer data from Question Bank**

### 6.2 Exam Management Module
- Access exam records and response data
- Filter exams by Question Bank usage
- Display exam names in the Exams dropdown
- **Retrieve student-level response data for dropdown display**

### 6.3 Reporting Module
- Add Question Bank Analysis as a new report type
- Integrate with existing export and sharing features

---

## 7. User Interface Requirements

### 7.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Question Bank Analysis                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Select Question Bank: [Dropdown Menu ▼]   Exams: [Dropdown Menu ▼]   [Analyze]       │
│ (Only user-mapped Question Banks)          (Exams based on selected Question Bank)    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Analysis Summary                                         │   │
│ │ Question Bank: [Selected Bank Name]                     │   │
│ │ Exam: [Selected Exam Name]                              │   │
│ │ Total Questions Analyzed: 50                            │   │
│ │ Exam Date: 15/02/2026                                   │   │
│ │ Total Wrong Attempts: 245                               │   │
│ │ Average Wrong Attempts per Question: 4.9                │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ [Search questions...]                    [Export CSV]   │   │
│ ├─────────────────────────────────────────────────────────┤   │
│ │ S.No │ Question Text ↕ │ Type ↕ │ Difficulty ↕ │ Wrong ↕ │ Total ↕ │ Wrong % ↕ │
│ ├─────────────────────────────────────────────────────────┤   │
│ │ 1    │ What is the capital of France?        │ MCQ │ Easy │ 15 (clickable) │ 40 │ 37.5% │
│ │      │ Correct Answer: Paris                 │     │      │                │    │       │
│ │ 2    │ Solve: 2x + 5 = 15                    │ MCQ │ Medium │ 12 (clickable) │ 38 │ 31.6% │
│ │      │ Correct Answer: x = 5                 │     │      │                │    │       │
│ │ 3    │ Define photosynthesis                 │ Text │ Hard │ 10 (clickable) │ 35 │ 28.6% │
│ │      │ Correct Answer: Process by which...   │     │      │                │    │       │
│ │ ...  │ ...                                   │ ... │ ...  │ ...            │ ... │ ...   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ [Previous] Page 1 of 5 [Next]                                  │
└─────────────────────────────────────────────────────────────────┘

**When Wrong value is clicked:**
┌─────────────────────────────────────┐
│ Students with Wrong Answers         │
├─────────────────────────────────────┤
│ • John Smith - Answer: Berlin       │
│ • Emily Chen - Answer: Madrid       │
│ • Michael Brown - Answer: Rome      │
└─────────────────────────────────────┘
```

### 7.2 Visual Design
- Consistent with A Cube design system
- Clear visual hierarchy
- Color coding for high wrong attempt counts (e.g., red for >50 attempts)
- Responsive layout for different screen sizes
- Sort indicators (↕ or ↑↓) on all sortable column headers
- Exams dropdown positioned to the right side of Question Bank dropdown
- **Wrong values styled as clickable links or buttons**
- **Correct answer displayed in a visually distinct style (smaller font, muted color, or italic)**
- **Dropdown overlay with clear borders and shadow for visibility**
- **Close button or click-outside behavior for dropdown**

---

## 8. Functional Requirements

### 8.1 Question Bank Selection
- Dropdown displays only Question Banks mapped to the current user
- Show Question Bank metadata on selection
- Disable analysis button until both Question Bank and Exam are selected

### 8.2 Exam Selection
- Dropdown displays exams created based on the selected Question Bank
- Show exam names in the dropdown
- Update dropdown options when Question Bank selection changes
- Disable analysis button until exam is selected

### 8.3 Analysis Execution
- Display loading indicator during processing
- Show progress for large datasets
- Handle errors gracefully with user-friendly messages

### 8.4 Results Interaction
- Click on question text to view full question details
- Sort by all columns except S.No (ascending/descending)
- Search/filter questions by text content
- Export results to CSV or Excel format
- **Click on Wrong values to display dropdown with student names and their incorrect answers**
- **View correct answer displayed below each question text**

### 8.5 Wrong Value Dropdown Interaction
- **Click on any Wrong value to open dropdown**
- **Dropdown displays list of students with incorrect answers**
- **Each entry shows: Student Name - Answer: [student's answer]**
- **Dropdown is view-only (no editing allowed)**
- **Close dropdown by clicking outside or clicking another Wrong value**
- **Handle cases where no students answered incorrectly (display appropriate message)**

### 8.6 Correct Answer Display
- **Correct answer displayed directly below Question Text in each row**
- **Format: Correct Answer: [answer text]**
- **Always visible without user interaction**
- **Styled distinctly from question text**

### 8.7 Data Refresh
- Option to refresh analysis with latest exam data
- Display last updated timestamp

---

## 9. Success Criteria

### 9.1 Functional Success
- Accurate identification of incorrect answers
- Correct aggregation of wrong attempt counts
- Reliable filtering by selected Question Bank and Exam
- Proper filtering of Question Banks by user mapping
- Proper filtering of Exams by selected Question Bank
- Functional sorting on all columns except S.No
- **Accurate display of student names and their incorrect answers in dropdown**
- **Correct answer displayed accurately below each question text**
- **Dropdown opens and closes reliably on user interaction**

### 9.2 Performance Success
- Analysis completes within 10 seconds for typical datasets
- Table loads and renders smoothly
- Export functionality works without timeout
- Sorting operations execute instantly
- Exam dropdown updates instantly when Question Bank changes
- **Dropdown loads student data within 2 seconds of click**

### 9.3 User Experience Success
- Intuitive interface requiring minimal training
- Clear presentation of analysis results
- Actionable insights for educators
- Easy-to-use sorting functionality
- Seamless Question Bank and Exam selection workflow
- **Clear visual indication that Wrong values are clickable**
- **Dropdown content is easy to read and understand**
- **Correct answer is immediately visible and clearly distinguished from question text**

---

## 10. Future Enhancements

Potential future additions (not included in current scope):
- Drill-down to view individual student responses
- Comparison across multiple Question Banks
- Comparison across multiple Exams
- Trend analysis over time
- Question difficulty scoring based on wrong attempts
- Recommendations for question revision
- Export dropdown data to separate report
- Filter students by specific answer patterns