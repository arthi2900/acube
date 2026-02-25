# School-Based Isolation Guide

## Overview

The Online Exam Management System implements **school-based isolation** (multi-tenancy) to ensure that users from different schools cannot see or interact with each other. This creates a secure, isolated environment for each school.

---

## How It Works

### Core Principle
**Users can only see and interact with other users from their own school.**

### Role-Based Access

#### 1. **Admin** (System Administrator)
- **Access Level**: Full system access across all schools
- **Can See**: All users from all schools
- **Can Manage**: All schools, all users, all exams
- **Use Case**: System-wide management and oversight

#### 2. **Principal** (School Head)
- **Access Level**: Full access within their assigned school
- **Can See**: Teachers and students from their school
- **Can Manage**: Teachers and students in their school, approve exams
- **Cannot See**: Users from other schools, other principals

#### 3. **Teacher**
- **Access Level**: Limited access within their assigned school
- **Can See**: ONLY students from their school
- **Can Manage**: Create questions, create exams, view student results from their school
- **Cannot See**: Principal, other teachers, users from other schools

#### 4. **Student**
- **Access Level**: Minimal access - own profile only
- **Can See**: Only their own profile and personal data
- **Can Do**: Take exams, view their own results
- **Cannot See**: Other students, teachers, principal, users from other schools

---

## Technical Implementation

### Database Level Security

#### Row Level Security (RLS) Policies
The system uses PostgreSQL Row Level Security to enforce school isolation at the database level:

```sql
-- Principals can view teachers and students from their school
CREATE POLICY "Principals can view teachers and students in their school"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'principal'
    AND p.school_id IS NOT NULL
    AND profiles.school_id = p.school_id
    AND profiles.role IN ('teacher', 'student')
  )
);

-- Teachers can view students from their school only
CREATE POLICY "Teachers can view students in their school"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'teacher'
    AND p.school_id IS NOT NULL
    AND profiles.school_id = p.school_id
    AND profiles.role = 'student'
  )
);

-- Students can only view their own profile
-- Handled by "Users can view own profile" policy
```

#### Helper Functions

**`get_user_school_id()`**
- Returns the school_id of the currently logged-in user
- Used to filter queries automatically

**`is_same_school(user_id)`**
- Checks if a given user belongs to the same school as the current user
- Returns true/false

### Automatic Filtering

All database queries are automatically filtered by school_id:
- When a principal logs in, they only see users with the same school_id
- When a teacher logs in, they only see users with the same school_id
- When a student logs in, they only see users with the same school_id
- Admins bypass this filtering and see all users

---

## User Experience

### Visual Indicators

#### For School Users (Principal, Teacher, Student)
When logged in, users see a **blue banner** at the top of the User Management page:

```
🏫 School Context: [School Name]
You can only view and manage users from your school.
[Role-specific message]
```

#### For Admins
Admins see a **purple banner** indicating full system access:

```
👤 Administrator Access
You have full access to manage users across all schools in the system.
```

### What Users See

#### Principal View
- **Dashboard**: Statistics for their school only
- **User Management**: Teachers and students from their school (not other principals)
- **Exam Management**: Exams created for their school
- **Results**: Results from students in their school

#### Teacher View
- **Question Bank**: Questions they created
- **Exam Creation**: Can create exams for students in their school
- **Student List**: ONLY students from their school (cannot see other teachers or principal)
- **Results**: Only results from their school's students

#### Student View
- **Available Exams**: Only exams scheduled for them
- **Results**: Only their own results
- **Profile**: Only their own profile (cannot see other students, teachers, or principal)

---

## Setup and Configuration

### Assigning Users to Schools

#### During Registration
1. User registers with username, email, password
2. User selects their school from dropdown (using school code)
3. User's profile is created with `school_id` field set
4. Admin approves the user
5. User can now only see others from the same school

#### Admin Assignment
1. Admin creates or edits a user
2. Admin assigns the user to a specific school
3. User is automatically isolated to that school's data

### School Codes
Each school has a unique school code (e.g., "SCH001", "SCH002"):
- Used during registration to identify the school
- Prevents users from accidentally joining wrong school
- Easy to communicate to new users

---

## Security Features

### Database-Level Enforcement
✅ **RLS Policies**: Enforced at PostgreSQL level, cannot be bypassed from frontend  
✅ **Automatic Filtering**: All queries automatically filtered by school_id  
✅ **No Manual Filtering**: Developers don't need to remember to add school_id filters  

### Role-Based Access Control
✅ **Admin Override**: Admins can manage all schools  
✅ **School Isolation**: Non-admin users cannot access other schools  
✅ **Immutable Assignment**: Users cannot change their own school_id  

### Data Privacy
✅ **Complete Isolation**: Users cannot see data from other schools  
✅ **Secure Queries**: All API calls respect school boundaries  
✅ **Audit Trail**: All access is logged and traceable  

---

## Common Scenarios

### Scenario 1: New School Onboarding
1. Admin creates a new school in School Management
2. Admin creates a principal account and assigns to the school
3. Principal logs in and sees empty user list (only their school)
4. Teachers and students register, selecting the school code
5. Principal approves teachers and students
6. Everyone can now see each other (within the school only)

### Scenario 2: Teacher Transfer
If a teacher moves to a different school:
1. Admin updates the teacher's `school_id` to the new school
2. Teacher immediately loses access to old school's data
3. Teacher gains access to new school's data
4. Old school cannot see the teacher anymore

### Scenario 3: Multi-School Principal
If a principal manages multiple schools:
- **Option 1**: Create separate principal accounts for each school
- **Option 2**: Give the principal an admin role (not recommended for security)
- **Recommended**: Use Option 1 for better security and isolation

---

## Troubleshooting

### "I can't see any users"
**Possible Causes:**
1. You don't have a school assigned (`school_id` is null)
2. No other users are registered in your school yet
3. Your school_id doesn't match any existing school

**Solution:**
- Contact admin to verify your school assignment
- Check if other users have registered for your school
- Verify school code during registration

### "I can see users from other schools"
**This should never happen unless:**
1. You are an admin (this is expected behavior)
2. Multiple users were incorrectly assigned the same school_id

**Solution:**
- Verify your role (admins see all schools)
- Contact system administrator if you're not an admin

### "I need to access data from another school"
**This is by design for security.**

**Options:**
1. Request admin access (if you need to manage multiple schools)
2. Create separate accounts for each school
3. Contact admin to export/share specific data

---

## Best Practices

### For Admins
✅ **Verify school assignments** before approving users  
✅ **Use unique school codes** that are easy to communicate  
✅ **Don't give admin access** unless absolutely necessary  
✅ **Regularly audit** user-school assignments  

### For Principals
✅ **Verify new users** belong to your school before approving  
✅ **Communicate school code** clearly to new teachers/students  
✅ **Report suspicious accounts** to admin immediately  

### For Teachers
✅ **Verify student list** matches your actual students  
✅ **Report missing students** to principal  
✅ **Don't share school code** publicly  

### For Students
✅ **Use correct school code** during registration  
✅ **Verify you see your classmates** after approval  
✅ **Contact teacher** if you can't see your school's exams  

---

## Technical Details

### Database Schema

```sql
-- profiles table includes school_id
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  username text UNIQUE NOT NULL,
  full_name text,
  email text,
  phone text,
  role user_role NOT NULL,
  school_id uuid REFERENCES schools(id),  -- Links user to school
  approved boolean DEFAULT false,
  suspended boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### API Behavior

All API calls automatically respect school isolation:

```typescript
// Frontend calls this
const users = await profileApi.getAllProfiles();

// Database automatically filters by school_id
// Principal sees only their school's users
// Teacher sees only their school's users
// Student sees only their school's users
// Admin sees all users
```

### Migration Applied

Migration: `20240112000006_add_school_isolation.sql`
- Creates helper functions
- Updates RLS policies
- Enforces school-based filtering

---

## FAQ

**Q: Can a user belong to multiple schools?**  
A: No, each user can only belong to one school at a time. If needed, create separate accounts.

**Q: Can admins see which school a user belongs to?**  
A: Yes, admins can see all user details including school assignments.

**Q: What happens if a user's school is deleted?**  
A: The user's `school_id` becomes invalid. Admin should reassign users before deleting schools.

**Q: Can teachers from different schools collaborate?**  
A: Not directly through the system. Admins can facilitate data sharing if needed.

**Q: Is school isolation enforced in the frontend or backend?**  
A: Both. Frontend shows appropriate UI, but backend (database RLS) enforces security.

**Q: Can I temporarily disable school isolation for testing?**  
A: No, this is a security feature and cannot be disabled. Use admin account for testing.

---

## Support

For issues related to school isolation:
1. Verify your school assignment with your admin
2. Check the school context banner on User Management page
3. Contact your system administrator
4. Review this guide for common scenarios

---

## Related Documentation
- User Management Guide
- Role-Based Access Control Guide
- School Management Guide
- Security Best Practices
