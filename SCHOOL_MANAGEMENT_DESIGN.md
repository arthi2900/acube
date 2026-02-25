# School Management System - Detailed Design Document

## Overview
This document outlines the complete design for implementing School Management functionality in the Online Exam Management System.

---

## 1. Database Schema Design

### 1.1 Schools Table

```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_code TEXT UNIQUE NOT NULL,  -- Auto-generated: SCH001, SCH002, etc.
  school_name TEXT UNIQUE NOT NULL,
  address TEXT,
  contact_number TEXT,
  email TEXT UNIQUE,
  affiliation_board TEXT,  -- State Board, CBSE, ICSE, etc.
  class_from INTEGER,  -- Starting grade (e.g., 1)
  class_to INTEGER,    -- Ending grade (e.g., 12)
  subjects TEXT[],     -- Array of subjects offered
  principal_id UUID REFERENCES profiles(id),  -- Link to principal user
  established_year INTEGER,
  school_type TEXT,    -- Primary, Secondary, Higher Secondary
  status TEXT DEFAULT 'active',  -- active, inactive
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Field Details:**
- **school_code**: Auto-generated unique identifier (e.g., "SCH001", "SCH002")
- **school_name**: Mandatory, unique school name
- **address**: Full school address
- **contact_number**: School contact number
- **email**: School official email (unique)
- **affiliation_board**: Dropdown options: State Board, CBSE, ICSE, IGCSE, IB, etc.
- **class_from/class_to**: Grade range (e.g., 1 to 12, or 6 to 10)
- **subjects**: Array of subjects offered by the school
- **principal_id**: Foreign key linking to a user with 'principal' role
- **status**: Active or Inactive school

### 1.2 Update Profiles Table

**Current Structure:**
```sql
profiles (
  id UUID,
  username TEXT,
  school_name TEXT,  -- Currently just text
  role user_role,
  ...
)
```

**Updated Structure:**
```sql
ALTER TABLE profiles 
DROP COLUMN school_name,
ADD COLUMN school_id UUID REFERENCES schools(id);
```

This creates a proper foreign key relationship between users and schools.

### 1.3 Update Subjects Table (Optional Enhancement)

```sql
ALTER TABLE subjects
ADD COLUMN school_id UUID REFERENCES schools(id);
```

This allows schools to have their own subject lists, or NULL for system-wide subjects.

### 1.4 Update Exams Table

```sql
ALTER TABLE exams
ADD COLUMN school_id UUID REFERENCES schools(id);
```

This ensures exams are associated with specific schools.

---

## 2. System Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                         SYSTEM ADMIN                         │
│  - Manages all schools                                       │
│  - Creates/edits/deletes schools                            │
│  - Assigns principals to schools                            │
│  - Approves user registrations                              │
│  - System-wide reports and analytics                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ manages multiple
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          SCHOOLS                             │
│  Each school has:                                            │
│  - Unique school code (auto-generated)                      │
│  - School details (name, address, contact, etc.)           │
│  - One assigned principal                                   │
│  - Multiple teachers                                        │
│  - Multiple students                                        │
│  - Grade range (class_from to class_to)                    │
│  - Subjects offered                                         │
│  - Affiliation board                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │PRINCIPAL │  │ TEACHERS │  │ STUDENTS │
        │(1 per    │  │(Multiple)│  │(Multiple)│
        │ school)  │  │          │  │          │
        └──────────┘  └──────────┘  └──────────┘
```

### 2.1 Role-Based Access Control

**Admin:**
- Full access to all schools
- Create/Edit/Delete schools
- Assign principals to schools
- View all users across all schools
- System-wide analytics

**Principal:**
- Manage ONE school only (their assigned school)
- View/manage teachers in their school
- View/manage students in their school
- Approve exams created by teachers in their school
- View school-specific reports
- Cannot create/edit school details (only Admin can)

**Teacher:**
- Belongs to ONE school
- Create questions for subjects in their school
- Create exam papers for their school
- View students in their school
- Grade exams and view results

**Student:**
- Belongs to ONE school
- Take exams from their school only
- View their own results
- Cannot see other schools' exams

---

## 3. User Registration Flow with School Selection

### 3.1 Registration Form Updates

**Current Flow:**
1. User fills registration form
2. Enters school name as free text
3. Admin approves

**New Flow:**
1. User fills registration form
2. **Selects school from dropdown** (populated from schools table)
3. School details auto-populate (read-only):
   - School Address
   - Contact Number
   - Email
   - Affiliation Board
4. User completes other fields
5. Admin approves

### 3.2 Registration Form Fields

```
┌─────────────────────────────────────────────────────────┐
│              User Registration Form                      │
├─────────────────────────────────────────────────────────┤
│ Username: [________________]                            │
│ Full Name: [________________]                           │
│ Email: [________________]                               │
│ Phone: [________________]                               │
│ Password: [________________]                            │
│                                                          │
│ Role: [Dropdown: Student/Teacher/Principal]             │
│                                                          │
│ School Name: [Dropdown: Select School ▼]  *MANDATORY   │
│                                                          │
│ ┌─────────────────────────────────────────────────┐   │
│ │ School Details (Auto-populated, Read-only)      │   │
│ │ Address: [Auto-filled from school]              │   │
│ │ Contact: [Auto-filled from school]              │   │
│ │ Email: [Auto-filled from school]                │   │
│ │ Board: [Auto-filled from school]                │   │
│ └─────────────────────────────────────────────────┘   │
│                                                          │
│ [Register Button]                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 4. School Management Interface (Admin Only)

### 4.1 School Management Page Features

**Page: `/admin/schools`**

**Features:**
1. **List All Schools** (Table View)
   - School Code
   - School Name
   - Principal Name
   - Affiliation Board
   - Total Teachers
   - Total Students
   - Status (Active/Inactive)
   - Actions (Edit, View Details, Delete)

2. **Add New School** (Dialog/Form)
   - School Name (text input, mandatory)
   - Address (textarea)
   - Contact Number (text input)
   - Email (email input, unique validation)
   - Affiliation Board (dropdown: State Board, CBSE, ICSE, IGCSE, IB, Other)
   - Class From (number input: 1-12)
   - Class To (number input: 1-12)
   - Subjects (multi-select or tags input)
   - Principal (dropdown: select from users with 'principal' role)
   - Established Year (number input)
   - School Type (dropdown: Primary, Secondary, Higher Secondary, All)
   - School Code: **Auto-generated** (displayed after creation)

3. **Edit School** (Dialog/Form)
   - Same fields as Add, but school_code is read-only
   - Can change principal assignment

4. **View School Details** (Detailed View)
   - All school information
   - List of teachers in this school
   - List of students in this school
   - Recent exams conducted
   - Statistics (total users, exams, etc.)

5. **Delete School**
   - Confirmation dialog
   - Check if school has users/exams
   - Option to transfer users to another school or delete

### 4.2 School Code Auto-Generation Logic

```typescript
// Generate school code like: SCH001, SCH002, SCH003, etc.
async function generateSchoolCode(): Promise<string> {
  // Get the latest school code
  const { data } = await supabase
    .from('schools')
    .select('school_code')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (!data) {
    return 'SCH001'; // First school
  }
  
  // Extract number from last code (e.g., "SCH005" -> 5)
  const lastNumber = parseInt(data.school_code.replace('SCH', ''));
  const nextNumber = lastNumber + 1;
  
  // Format with leading zeros (e.g., 6 -> "006")
  return `SCH${nextNumber.toString().padStart(3, '0')}`;
}
```

---

## 5. Additional Details Required in Hierarchy

### 5.1 School Level
- ✅ School Code (auto-generated)
- ✅ School Name (mandatory)
- ✅ Address
- ✅ Contact Number
- ✅ Email
- ✅ Affiliation Board
- ✅ Class From/To
- ✅ Subjects
- ✅ Principal Assignment
- ➕ **Established Year** (optional)
- ➕ **School Type** (Primary/Secondary/Higher Secondary)
- ➕ **Status** (Active/Inactive)
- ➕ **School Logo** (optional, future enhancement)
- ➕ **Total Capacity** (optional)

### 5.2 User-School Relationship
- ✅ Each user belongs to ONE school (via school_id foreign key)
- ✅ One school can have ONE principal
- ✅ One school can have MULTIPLE teachers
- ✅ One school can have MULTIPLE students
- ✅ Admin can manage ALL schools

### 5.3 Data Isolation Rules
- **Principals** can only see/manage users from their school
- **Teachers** can only see students from their school
- **Students** can only see exams from their school
- **Admin** has global access to all schools

### 5.4 Subject Management
**Option A: School-Specific Subjects**
- Each school defines its own subjects
- Stored in schools.subjects array
- More flexible but requires more management

**Option B: System-Wide Subjects with School Association**
- Subjects table has school_id (nullable)
- NULL school_id = available to all schools
- Specific school_id = only for that school
- **Recommended approach**

### 5.5 Exam Management
- Exams must be associated with a school (school_id)
- Teachers can only create exams for their school
- Students can only see/take exams from their school
- Principal can approve exams from their school
- Admin can see all exams across all schools

---

## 6. Implementation Checklist

### Phase 1: Database Setup
- [ ] Create schools table with all fields
- [ ] Create auto-increment function for school_code
- [ ] Update profiles table (add school_id, remove school_name)
- [ ] Add school_id to subjects table
- [ ] Add school_id to exams table
- [ ] Create RLS policies for school-based access
- [ ] Migrate existing data (if any)

### Phase 2: School Management UI (Admin)
- [ ] Create School Management page (`/admin/schools`)
- [ ] Add School list view with table
- [ ] Create "Add School" dialog with form
- [ ] Implement school code auto-generation
- [ ] Create "Edit School" dialog
- [ ] Create "View School Details" page
- [ ] Add principal assignment dropdown (filter users by role='principal')
- [ ] Implement delete school with confirmation

### Phase 3: Update User Management
- [ ] Update User Management to show school name (from relationship)
- [ ] Add school filter dropdown
- [ ] Update user edit form to include school selection

### Phase 4: Update Registration Flow
- [ ] Update registration form with school dropdown
- [ ] Fetch schools list from database
- [ ] Auto-populate school details (read-only)
- [ ] Update signup API to use school_id instead of school_name

### Phase 5: Access Control & Filtering
- [ ] Update all queries to filter by school context
- [ ] Implement RLS policies for school-based access
- [ ] Update Principal dashboard to show only their school data
- [ ] Update Teacher dashboard to show only their school data
- [ ] Update Student dashboard to show only their school exams

### Phase 6: Testing
- [ ] Test school creation and code generation
- [ ] Test principal assignment
- [ ] Test user registration with school selection
- [ ] Test access control (Principal can't see other schools)
- [ ] Test exam creation and visibility by school

---

## 7. API Functions Required

```typescript
// School Management APIs
export const schoolApi = {
  // Get all schools (Admin only)
  async getAllSchools(): Promise<School[]>
  
  // Get school by ID
  async getSchoolById(id: string): Promise<School | null>
  
  // Create new school (Admin only)
  async createSchool(school: CreateSchoolInput): Promise<School>
  
  // Update school (Admin only)
  async updateSchool(id: string, updates: Partial<School>): Promise<School>
  
  // Delete school (Admin only)
  async deleteSchool(id: string): Promise<void>
  
  // Get schools for dropdown (all users during registration)
  async getSchoolsForDropdown(): Promise<Array<{id: string, name: string}>>
  
  // Assign principal to school (Admin only)
  async assignPrincipal(schoolId: string, principalId: string): Promise<School>
  
  // Get available principals (not assigned to any school)
  async getAvailablePrincipals(): Promise<Profile[]>
  
  // Get school statistics
  async getSchoolStats(schoolId: string): Promise<SchoolStats>
}
```

---

## 8. TypeScript Interfaces

```typescript
export interface School {
  id: string;
  school_code: string;
  school_name: string;
  address: string | null;
  contact_number: string | null;
  email: string | null;
  affiliation_board: string | null;
  class_from: number | null;
  class_to: number | null;
  subjects: string[] | null;
  principal_id: string | null;
  established_year: number | null;
  school_type: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateSchoolInput {
  school_name: string;
  address?: string;
  contact_number?: string;
  email?: string;
  affiliation_board?: string;
  class_from?: number;
  class_to?: number;
  subjects?: string[];
  principal_id?: string;
  established_year?: number;
  school_type?: string;
}

export interface SchoolWithDetails extends School {
  principal?: Profile;
  teacher_count?: number;
  student_count?: number;
  exam_count?: number;
}

export interface SchoolStats {
  total_teachers: number;
  total_students: number;
  total_exams: number;
  active_exams: number;
  completed_exams: number;
}
```

---

## 9. UI Mockup - School Management Page

```
┌────────────────────────────────────────────────────────────────────┐
│  School Management                                    [+ Add School]│
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Search: [_________________]  Filter: [All ▼]  Status: [Active ▼] │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Code  │ School Name      │ Principal    │ Board │ Teachers │ │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ SCH001│ ABC High School  │ John Doe     │ CBSE  │ 25      │ │ │
│  │ SCH002│ XYZ Public School│ Jane Smith   │ State │ 18      │ │ │
│  │ SCH003│ PQR Academy      │ Not Assigned │ ICSE  │ 30      │ │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Actions: [Edit] [View Details] [Delete]                          │
└────────────────────────────────────────────────────────────────────┘
```

---

## 10. Summary

### What We're Building:
1. **Schools Table** - Central repository of all schools
2. **School Management Page** - Admin interface to manage schools
3. **School-User Relationship** - Link users to schools via foreign key
4. **School Dropdown in Registration** - Users select school during signup
5. **Access Control** - Role-based filtering by school context
6. **Auto-Generated School Codes** - Unique identifiers (SCH001, SCH002, etc.)

### Key Benefits:
- ✅ Proper data normalization (no duplicate school names)
- ✅ Easy school information updates (change once, reflects everywhere)
- ✅ Clear hierarchy and access control
- ✅ Scalable for multiple schools
- ✅ Better reporting and analytics per school
- ✅ Principal assignment and management

### Next Steps:
1. Review and approve this design
2. Implement database migrations
3. Build School Management UI
4. Update User Registration flow
5. Implement access control policies
6. Test thoroughly

---

**Questions to Confirm:**
1. Should principals be able to edit their school details, or only Admin?
   - **Recommendation**: Only Admin can edit school details
2. Can a principal be assigned to multiple schools?
   - **Recommendation**: No, one principal per school (one-to-one relationship)
3. Should we allow users to request school addition if not in list?
   - **Recommendation**: Yes, add a "Request New School" option that notifies Admin
4. What happens to users if a school is deleted?
   - **Recommendation**: Prevent deletion if school has users, or transfer users first
5. Should subjects be school-specific or system-wide?
   - **Recommendation**: System-wide with optional school association

Please review and let me know if you'd like me to proceed with implementation!
