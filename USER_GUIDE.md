# Online Exam Management System - User Guide

## System Overview

The Online Exam Management System is a comprehensive platform designed for educational institutions to conduct and manage online exams efficiently. The system supports four user roles with specific permissions and capabilities.

## User Roles

### 1. Admin
**Responsibilities:**
- Complete system administration
- School management (create, edit, view schools)
- User account creation and management
- Role-based access control setup
- System configurations
- Cross-school visibility and management

**Key Features:**
- Manage all schools and users across the entire system
- Approve new user registrations
- Suspend or activate user accounts
- Force delete exams when necessary
- View system-wide analytics

### 2. Principal
**Responsibilities:**
- Academic management within assigned school
- Teacher and student management
- Question bank oversight
- Exam approval workflow
- School-level reporting

**Key Features:**
- Create and manage academic structure (classes, sections, subjects, lessons)
- Assign teachers to subjects and sections
- Assign students to classes and sections
- View and manage question bank
- Approve school-level exams created by teachers
- Create exams directly without approval
- View student allocation lists and exam results
- Monitor teacher performance

**School Isolation:** Can only view and manage users from their assigned school

### 3. Teacher
**Responsibilities:**
- Question bank management
- Question paper preparation
- Exam creation and management
- Student assessment
- Result analysis

**Key Features:**
- Create questions for assigned subjects (MCQ, True/False, Short Answer)
- Prepare question papers with shuffle functionality
- Create two types of exams:
  - **Practice Exams**: No approval required, published immediately
  - **School-Level Exams**: Requires Principal approval
- Monitor student participation in real-time
- View student results and performance analysis
- Manually grade subjective questions

**Important:** Teachers can only view students from their assigned sections

### 4. Student
**Responsibilities:**
- Take assigned exams
- View results and performance analysis

**Key Features:**
- View assigned online exams (practice and school-level)
- Take exams with timer and question palette
- Submit answers before deadline
- View auto-evaluated results
- View pass/fail status based on 35% passing threshold
- Review correct answers (if enabled by teacher)

## Key Features

### Automatic Passing Marks Calculation ⭐
**Critical Feature:** The system automatically calculates passing marks as **35% of the total marks** for every exam.

- **Formula**: Passing Marks = 35% of Total Marks (rounded up)
- **Examples**:
  - Total Marks: 100 → Passing Marks: 35
  - Total Marks: 80 → Passing Marks: 28
  - Total Marks: 50 → Passing Marks: 18
  - Total Marks: 33 → Passing Marks: 12

**How it works:**
1. When a teacher creates an exam and selects a question paper
2. The system automatically retrieves the total marks from the question paper
3. Passing marks are calculated and displayed (read-only field)
4. Teachers cannot manually edit the passing marks
5. The calculation is transparent and visible during exam creation

### Question Bank Management
- Create questions with multiple types (MCQ, True/False, Short Answer)
- Organize questions by class, subject, and lesson
- Add images and clip arts to questions
- Switch between Row View and Card View
- Edit questions in both views
- Track question difficulty levels

### Question Paper Preparation
- Select questions from question bank
- Shuffle questions and MCQ options
- Preview before finalizing
- Save as draft or generate final paper
- Export as PDF and print
- Create multiple shuffled versions (Shuffled A, B, C, etc.)
- View question paper history

### Online Exam Conduct
- Two exam types:
  - **Practice Exam**: For student practice, no approval needed
  - **School-Level Exam**: Official exams requiring Principal approval
- Set exam duration, start time, and end time
- Configure negative marking (optional)
- Automatic submission when time expires
- Real-time student participation monitoring
- Student allocation list with attendance status

### Automatic Grading System
- Instant grading for MCQ and True/False questions
- Manual grading for Short Answer questions
- Automatic pass/fail determination based on 35% threshold
- Detailed performance analysis
- Question-wise performance tracking

### Student Exam Interface
- Clean, distraction-free exam interface
- Question palette panel for easy navigation
- Timer display with auto-submit
- Mark for review functionality
- Submit confirmation dialog

### Results and Analytics
- Individual student exam results
- Question-wise performance analysis
- Pass/fail status display
- Percentage calculation
- Marks obtained vs. total marks
- Identify correct and incorrect answers

## Design System

### Color Scheme
- **Primary Color**: Blue (#2563EB) - Trust and educational professionalism
- **Secondary Color**: Green (#10B981) - Success and positive actions
- **Warning Color**: Red (#EF4444) - Errors and warnings

### Visual Design
- Soft rounded corners (8px radius) - Modern and friendly appearance
- Light shadow effects - Depth and hierarchy
- Clear borders - Content separation
- Card-based design - Information grouping
- Responsive grid layout - Multiple screen sizes
- Clear navigation menu - Easy access

## School-Based Data Isolation

### Isolation Principle
- Users from the same school form an isolated group
- Within each school, users can only see and interact based on role-specific visibility rules
- Admin has cross-school visibility

### Visibility Rules

**Admin:**
- ✅ Can view all users from all schools
- ✅ Full management rights across the system

**Principal:**
- ✅ Can view teachers and students from assigned school
- ✅ Can view question papers and exams created by teachers in their school
- ❌ Cannot view users from other schools

**Teacher:**
- ✅ Can view students from assigned sections
- ✅ Can view own question papers and exams
- ❌ Cannot view Principal or other teachers
- ❌ Cannot view users from other schools

**Student:**
- ✅ Can view only their own profile and exam results
- ❌ Cannot view other students, teachers, or Principal

## Getting Started

### For Admins
1. Log in with admin credentials
2. Create schools in School Management
3. Create user accounts and assign roles
4. Approve new user registrations
5. Monitor system usage and analytics

### For Principals
1. Log in with principal credentials
2. Set up academic structure (classes, sections, subjects, lessons)
3. Assign teachers to subjects and sections
4. Assign students to classes and sections
5. Review and approve school-level exams
6. Monitor exam participation and results

### For Teachers
1. Log in with teacher credentials
2. Create questions in Question Bank
3. Prepare question papers
4. Create exams (practice or school-level)
5. Monitor student participation
6. Grade subjective questions
7. View and analyze results

### For Students
1. Log in with student credentials
2. View assigned exams
3. Take exams within the scheduled time
4. Submit answers before deadline
5. View results and performance analysis

## Important Notes

1. **Passing Marks**: Always calculated as 35% of total marks - cannot be manually changed
2. **Exam Types**: Practice exams are published immediately; school-level exams require Principal approval
3. **School Isolation**: Users can only interact with data from their assigned school (except Admin)
4. **Auto-Submit**: Exams are automatically submitted when time expires
5. **Question Paper Selection**: Only finalized question papers can be used for exams
6. **Result Visibility**: Students can view results only after teacher publishes them

## Support and Troubleshooting

### Common Issues

**Cannot create exam:**
- Ensure you have selected a finalized question paper
- Verify the question paper has questions (total marks > 0)
- Check that end time is after start time

**Cannot view students:**
- Teachers: Verify you are assigned to the student's section
- Principal: Ensure students are from your school

**Passing marks seem incorrect:**
- Passing marks are automatically calculated as 35% of total marks
- This is a system-wide policy and cannot be changed per exam

## System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- Minimum screen resolution: 1024x768

## Security Features

- Role-based access control
- School-based data isolation
- Secure authentication
- Password reset functionality
- Session management
- Data encryption

---

For additional support or questions, please contact your system administrator.
