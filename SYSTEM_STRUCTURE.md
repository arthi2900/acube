# Question Bank Management System - Structure

## System Overview
A focused educational management system for creating and organizing questions by subject, class, and difficulty level.

## User Roles & Access

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│    ADMIN     │
└──────┬───────┘
       │
       ├─► User Management (Create, Approve, Suspend users)
       ├─► School Management (Create, Edit schools)
       └─► System Configuration

┌──────────────┐
│  PRINCIPAL   │
└──────┬───────┘
       │
       ├─► Teachers Management (View, Manage teachers)
       ├─► Students Management (View, Manage students)
       ├─► Academic Structure
       │   ├─► Classes (Create, Edit)
       │   ├─► Sections (Create, Edit)
       │   └─► Subjects (Create, Edit, Link to classes)
       ├─► Teacher Assignments (Assign to subjects/classes/sections)
       └─► Student Assignments (Assign to classes/sections)

┌──────────────┐
│   TEACHER    │
└──────┬───────┘
       │
       └─► Question Bank
           ├─► Create Questions (MCQ, True/False, Short Answer)
           ├─► Edit Questions
           ├─► Delete Questions
           ├─► Filter by Class
           └─► Filter by Subject

┌──────────────┐
│   STUDENT    │
└──────┬───────┘
       │
       └─► Dashboard (Welcome page)
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE TABLES                           │
└─────────────────────────────────────────────────────────────┘

profiles
├─ id (uuid, PK)
├─ username (text, unique)
├─ full_name (text)
├─ email (text)
├─ phone (text)
├─ school_id (uuid, FK → schools)
├─ role (user_role: admin, principal, teacher, student)
├─ approved (boolean)
└─ suspended (boolean)

schools
├─ id (uuid, PK)
├─ school_name (text)
├─ school_code (text, unique)
├─ school_address (text)
├─ contact_number (text)
├─ email (text)
├─ affiliation_board (text)
├─ class_range_from (integer)
├─ class_range_to (integer)
├─ subjects_offered (text[])
└─ principal_id (uuid, FK → profiles)

classes
├─ id (uuid, PK)
├─ school_id (uuid, FK → schools)
├─ class_name (text)
└─ class_number (integer)

sections
├─ id (uuid, PK)
├─ school_id (uuid, FK → schools)
├─ class_id (uuid, FK → classes)
└─ section_name (text)

subjects
├─ id (uuid, PK)
├─ school_id (uuid, FK → schools)
├─ class_id (uuid, FK → classes)
├─ subject_name (text)
├─ subject_code (text)
└─ description (text)

questions ⭐ CORE TABLE
├─ id (uuid, PK)
├─ subject_id (uuid, FK → subjects)
├─ question_text (text)
├─ question_type (question_type: mcq, true_false, short_answer)
├─ options (jsonb, for MCQ)
├─ correct_answer (text)
├─ marks (integer)
├─ difficulty (difficulty_level: easy, medium, hard)
├─ created_by (uuid, FK → profiles)
└─ created_at (timestamptz)

teacher_assignments
├─ id (uuid, PK)
├─ teacher_id (uuid, FK → profiles)
├─ school_id (uuid, FK → schools)
├─ class_id (uuid, FK → classes)
├─ section_id (uuid, FK → sections)
└─ subject_id (uuid, FK → subjects)

student_class_sections
├─ id (uuid, PK)
├─ student_id (uuid, FK → profiles)
├─ school_id (uuid, FK → schools)
├─ class_id (uuid, FK → classes)
└─ section_id (uuid, FK → sections)
```

## Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND PAGES                            │
└─────────────────────────────────────────────────────────────┘

Public Pages
├─ / (Home)
├─ /login (Login)
├─ /register (Register)
├─ /forgot-password (Forgot Password)
└─ /reset-password (Reset Password)

Admin Pages
├─ /admin (Dashboard)
├─ /admin/users (User Management)
└─ /admin/schools (School Management)

Principal Pages
├─ /principal (Dashboard)
├─ /principal/teachers (Teachers List)
├─ /principal/students (Students List)
└─ /principal/academics (Academic Management)
    ├─ Classes Tab
    ├─ Sections Tab
    ├─ Subjects Tab
    ├─ Teacher Assignments Tab
    └─ Student Assignments Tab

Teacher Pages
├─ /teacher (Dashboard)
└─ /teacher/questions (Question Bank) ⭐

Student Pages
└─ /student (Dashboard)
```

## API Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    API FUNCTIONS                             │
└─────────────────────────────────────────────────────────────┘

profileApi
├─ getCurrentProfile()
├─ getAllProfiles()
├─ getTeachersBySchoolId()
├─ getStudentsBySchoolId()
├─ updateProfile()
├─ approveUser()
└─ suspendUser()

schoolApi
├─ getAllSchools()
├─ getSchoolById()
├─ createSchool()
├─ updateSchool()
└─ deleteSchool()

subjectApi
├─ getAllSubjects()
├─ getSubjectById()
├─ getSubjectsBySchoolId()
├─ createSubject()
├─ updateSubject()
└─ deleteSubject()

questionApi ⭐ CORE API
├─ getAllQuestions()
├─ getQuestionById()
├─ getQuestionsBySubjectId()
├─ createQuestion()
├─ updateQuestion()
└─ deleteQuestion()

academicApi
├─ Class APIs (CRUD)
├─ Section APIs (CRUD)
├─ Subject APIs (CRUD)
├─ Teacher Assignment APIs (CRUD)
└─ Student Assignment APIs (CRUD)
```

## Key Features

### Question Bank Management ⭐
- **Question Types**: MCQ, True/False, Short Answer
- **Difficulty Levels**: Easy, Medium, Hard
- **Organization**: By Subject, Class, and Teacher
- **Validation**: Required fields, minimum options for MCQ
- **Dynamic Forms**: Add/remove options for MCQ questions

### User Management
- **Role-Based Access**: Admin, Principal, Teacher, Student
- **Approval Workflow**: Admin approves new users
- **Search & Filter**: By username, name, email, school, role
- **Suspension**: Admin can suspend users

### Academic Structure
- **Hierarchical**: School → Class → Section → Subject
- **Flexible**: Multiple classes, sections, subjects per school
- **Assignments**: Teachers assigned to specific subjects/classes/sections
- **Student Tracking**: Students assigned to specific classes/sections

## Security

### Authentication
- Username + Password authentication via Supabase Auth
- Session management with JWT tokens
- Protected routes with role-based access control

### Row Level Security (RLS)
- School-based data isolation
- Role-based permissions
- Teachers see only their assigned classes/subjects
- Students see only their class data
- Principals see only their school data

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Routing**: React Router v6
- **State Management**: React Context + Hooks
- **Icons**: Lucide React

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Supabase Client (REST)
- **Real-time**: Supabase Realtime (available)

### Development
- **Build Tool**: Vite
- **Linting**: Biome + ESLint
- **Type Checking**: TypeScript 5
- **Package Manager**: pnpm

## Design System

### Colors
- **Primary**: Blue (#2563EB) - Trust and education
- **Secondary**: Green (#10B981) - Success and positive actions
- **Accent**: Red (#EF4444) - Warnings and errors
- **Background**: White/Dark mode support
- **Text**: Foreground colors with proper contrast

### Layout
- **Card-based**: Clean, organized content blocks
- **Responsive**: Mobile-first design
- **Grid System**: Flexbox and CSS Grid
- **Spacing**: Consistent padding and margins
- **Typography**: Clear hierarchy with proper font sizes

## Future Enhancements

### Phase 1: Enhanced Question Management
- Advanced search with filters
- Question tagging system
- Bulk import/export
- Question templates
- Rich text editor

### Phase 2: Learning Materials
- Study guides linked to questions
- Practice question sets
- Student self-assessment
- Progress tracking

### Phase 3: Collaboration
- Question sharing between teachers
- Peer review workflow
- Quality ratings
- Comments and feedback

### Phase 4: Analytics
- Question usage statistics
- Subject-wise distribution
- Teacher contribution metrics
- Difficulty analysis
