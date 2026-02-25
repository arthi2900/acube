# Question Bank Wrong Answer Analysis - Implementation Plan

## Feature Overview
Analyze all exam responses from a selected Question Bank to identify questions that students answered incorrectly, count total wrong attempts across all exams, and display results in a structured table.

---

## Requirements Analysis

### Core Requirements
1. **Question Bank Selection**: Dropdown to select a specific Question Bank
2. **Data Analysis**: Analyze all exam responses for questions from the selected bank
3. **Wrong Answer Filtering**: Filter only incorrect answers (is_correct = false)
4. **Aggregation**: Count total wrong attempts per question across all exams
5. **Display**: Show results in a table with columns:
   - Question Text
   - Wrong Attempts Count
6. **Scope**: Only show data for the selected Question Bank

### Additional Enhancements (Recommended)
- Show question type and difficulty level
- Display total attempts vs wrong attempts (percentage)
- Sort by wrong attempts (descending by default)
- Export results to CSV
- View question details
- Highlight high-error questions (e.g., >50% wrong rate)

---

## Technical Implementation Plan

### 1. Database Schema Analysis

**Existing Tables:**
- `questions` - Contains question_text, bank_name, question_type, difficulty
- `question_paper_questions` - Links questions to question papers
- `exams` - Exam details
- `exam_attempts` - Student exam attempts
- `exam_answers` - Individual question responses with is_correct field

**Data Flow:**
```
questions (bank_name filter)
  ↓
question_paper_questions (get all papers using these questions)
  ↓
exams (get all exams using these papers)
  ↓
exam_attempts (get all student attempts)
  ↓
exam_answers (filter is_correct = false, count by question_id)
```

### 2. API Function Design

**Location:** `/src/db/api.ts`

**Function Signature:**
```typescript
async getQuestionBankWrongAnswerAnalysis(bankName: string): Promise<QuestionWrongAnswerStats[]>
```

**Query Logic:**
```sql
SELECT 
  q.id as question_id,
  q.question_text,
  q.question_type,
  q.difficulty,
  q.bank_name,
  COUNT(CASE WHEN ea.is_correct = false THEN 1 END) as wrong_attempts_count,
  COUNT(ea.id) as total_attempts_count,
  ROUND(
    (COUNT(CASE WHEN ea.is_correct = false THEN 1 END)::numeric / 
     NULLIF(COUNT(ea.id), 0) * 100), 2
  ) as wrong_percentage
FROM questions q
LEFT JOIN question_paper_questions qpq ON q.id = qpq.question_id
LEFT JOIN exams e ON qpq.question_paper_id = e.question_paper_id
LEFT JOIN exam_attempts eat ON e.id = eat.exam_id
LEFT JOIN exam_answers ea ON eat.id = ea.attempt_id AND ea.question_id = q.id
WHERE q.bank_name = $1
  AND eat.status = 'submitted'
GROUP BY q.id, q.question_text, q.question_type, q.difficulty, q.bank_name
HAVING COUNT(ea.id) > 0
ORDER BY wrong_attempts_count DESC
```

### 3. Type Definitions

**Location:** `/src/types/types.ts`

**New Interface:**
```typescript
export interface QuestionWrongAnswerStats {
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  difficulty: DifficultyLevel;
  bank_name: string;
  wrong_attempts_count: number;
  total_attempts_count: number;
  wrong_percentage: number;
}
```

### 4. UI Component Design

**Location:** `/src/pages/teacher/QuestionBankAnalysis.tsx`

**Component Structure:**
```
QuestionBankAnalysis
├── Header Section
│   ├── Page Title
│   └── Description
├── Filter Section (Card)
│   ├── Question Bank Dropdown
│   ├── Analyze Button
│   └── Export CSV Button
├── Statistics Section (Card)
│   ├── Total Questions Analyzed
│   ├── Questions with Wrong Attempts
│   └── Average Wrong Attempt Rate
└── Results Table (Card)
    ├── Table Headers
    │   ├── S.No
    │   ├── Question Text (truncated)
    │   ├── Question Type
    │   ├── Difficulty
    │   ├── Wrong Attempts
    │   ├── Total Attempts
    │   ├── Wrong %
    │   └── Actions
    └── Table Rows
        ├── Data display
        ├── Color coding (high error = red badge)
        └── View Details button
```

**Features:**
- Loading states during analysis
- Empty state when no data
- Sortable columns
- Responsive design
- Tooltip for full question text
- Color-coded difficulty badges
- Highlight rows with >50% wrong rate

### 5. Routing Configuration

**Location:** `/src/routes.tsx`

**New Route:**
```typescript
{
  name: 'Question Bank Analysis',
  path: '/teacher/question-bank-analysis',
  element: (
    <ProtectedRoute allowedRoles={['teacher']}>
      <QuestionBankAnalysis />
    </ProtectedRoute>
  ),
}
```

### 6. Navigation Update

**Location:** `/src/components/common/Sidebar.tsx`

**Add Menu Item:**
Under Teacher section, add:
```typescript
{ 
  to: '/teacher/question-bank-analysis', 
  label: 'Question Bank Analysis', 
  icon: BarChart3 
}
```

Position: After "Question Bank" or in "Analytics" subsection

---

## Implementation Steps

### Phase 1: Backend (API & Types)
1. ✅ Add `QuestionWrongAnswerStats` interface to types.ts
2. ✅ Create `getQuestionBankWrongAnswerAnalysis()` function in api.ts
3. ✅ Create helper function `getUniqueQuestionBanks()` to fetch all bank names

### Phase 2: Frontend (UI Component)
4. ✅ Create QuestionBankAnalysis.tsx page component
5. ✅ Implement Question Bank dropdown with data fetching
6. ✅ Implement analysis trigger and data display
7. ✅ Create results table with sorting and formatting
8. ✅ Add statistics summary cards
9. ✅ Implement export to CSV functionality

### Phase 3: Integration
10. ✅ Add route to routes.tsx
11. ✅ Add navigation link to Sidebar.tsx
12. ✅ Test functionality end-to-end

### Phase 4: Testing & Validation
13. ✅ Run lint and fix any issues
14. ✅ Test with different Question Banks
15. ✅ Verify data accuracy
16. ✅ Test edge cases (no data, empty bank, etc.)

---

## Estimated Complexity

**Complexity Level:** Medium

**Estimated Actions:** 15-18 actions
- File viewing: 2-3 actions
- Type definitions: 1 action
- API functions: 1-2 actions
- UI component creation: 1 action
- Route configuration: 1 action
- Sidebar update: 1 action
- Testing & lint: 2 actions

**Time Estimate:** 20-30 minutes

---

## User Benefits

1. **Identify Weak Questions**: Quickly spot questions that students struggle with
2. **Improve Question Quality**: Revise or remove poorly performing questions
3. **Data-Driven Decisions**: Make informed choices about question bank content
4. **Performance Tracking**: Monitor question effectiveness over time
5. **Targeted Teaching**: Focus on topics where students need more help

---

## Future Enhancements (Out of Scope)

1. **Time-based Analysis**: Filter by date range
2. **Class/Section Filtering**: Analyze by specific student groups
3. **Question Revision Tracking**: Track improvements after question edits
4. **Comparative Analysis**: Compare multiple question banks
5. **Detailed Drill-down**: View individual student responses per question
6. **Automated Recommendations**: Suggest question improvements based on patterns

---

## Approval Request

**Ready to Implement:** ✅

This plan provides a comprehensive solution for analyzing wrong answers by Question Bank. The implementation will:
- Use existing database schema (no migrations needed)
- Follow established code patterns and conventions
- Provide actionable insights for teachers
- Maintain performance with proper query optimization
- Offer excellent user experience with loading states and error handling

**Please review and approve to proceed with implementation.**

---

## Questions for Clarification

1. Should this feature be available to Principals as well, or only Teachers?
2. Do you want to include "Short Answer" questions in the analysis (they may not have is_correct set)?
3. Should we show questions with 0 wrong attempts, or only those with at least 1 wrong attempt?
4. Any specific threshold for "high error rate" highlighting (currently planning 50%)?
5. Should the export include all data or just the visible columns?

---

**Status:** Awaiting Approval ⏳
