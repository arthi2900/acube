# Access Control Visual Guide

## 🎯 Quick Visual Reference

This guide provides a visual representation of who can see what in the Online Exam Management System.

---

## 📊 Access Control Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN (System-wide)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    🔓 Can See Everything                   │  │
│  │  • All Schools                                             │  │
│  │  • All Principals, Teachers, Students                      │  │
│  │  • All Exams, Questions, Results                           │  │
│  │  • Full Management Rights                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SCHOOL A (Isolated)                         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  PRINCIPAL                                               │    │
│  │  ┌───────────────────────────────────────────────────┐  │    │
│  │  │  🏫 Can See:                                       │  │    │
│  │  │  • Teachers in School A                            │  │    │
│  │  │  • Students in School A                            │  │    │
│  │  │                                                     │  │    │
│  │  │  ❌ Cannot See:                                    │  │    │
│  │  │  • Other Principals                                │  │    │
│  │  │  • Users from School B                             │  │    │
│  │  └───────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  TEACHER 1                    TEACHER 2                  │    │
│  │  ┌─────────────────────┐     ┌─────────────────────┐    │    │
│  │  │ 👨‍🏫 Can See:        │     │ 👨‍🏫 Can See:        │    │    │
│  │  │ • Students in       │     │ • Students in       │    │    │
│  │  │   School A          │     │   School A          │    │    │
│  │  │                     │     │                     │    │    │
│  │  │ ❌ Cannot See:      │     │ ❌ Cannot See:      │    │    │
│  │  │ • Principal         │     │ • Principal         │    │    │
│  │  │ • Other Teachers    │     │ • Other Teachers    │    │    │
│  │  │ • School B users    │     │ • School B users    │    │    │
│  │  └─────────────────────┘     └─────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  STUDENT 1    STUDENT 2    STUDENT 3    STUDENT 4       │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │    │
│  │  │ 🎓 Can  │  │ 🎓 Can  │  │ 🎓 Can  │  │ 🎓 Can  │    │    │
│  │  │ See:    │  │ See:    │  │ See:    │  │ See:    │    │    │
│  │  │ • Self  │  │ • Self  │  │ • Self  │  │ • Self  │    │    │
│  │  │   Only  │  │   Only  │  │   Only  │  │   Only  │    │    │
│  │  │         │  │         │  │         │  │         │    │    │
│  │  │ ❌ No:  │  │ ❌ No:  │  │ ❌ No:  │  │ ❌ No:  │    │    │
│  │  │ • Other │  │ • Other │  │ • Other │  │ • Other │    │    │
│  │  │ Students│  │ Students│  │ Students│  │ Students│    │    │
│  │  │ • Teach │  │ • Teach │  │ • Teach │  │ • Teach │    │    │
│  │  │ • Princ │  │ • Princ │  │ • Princ │  │ • Princ │    │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SCHOOL B (Isolated)                         │
│                                                                   │
│  [Same structure as School A - completely isolated]              │
│  • School B users cannot see School A users                      │
│  • School A users cannot see School B users                      │
│  • Only Admin can see both schools                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Role Visibility Matrix

| Viewer Role | Can See Principal | Can See Teachers | Can See Students | Can See Other Schools |
|-------------|-------------------|------------------|------------------|-----------------------|
| **Admin** | ✅ All | ✅ All | ✅ All | ✅ All Schools |
| **Principal** | ❌ No | ✅ Own School | ✅ Own School | ❌ No |
| **Teacher** | ❌ No | ❌ No | ✅ Own School | ❌ No |
| **Student** | ❌ No | ❌ No | ❌ No (Self Only) | ❌ No |

---

## 🎨 Visual Indicators in UI

### Admin View
```
┌────────────────────────────────────────────────────────────┐
│  User Management                                            │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  🔓 Administrator Access                              │  │
│  │  You have full access to manage users across all     │  │
│  │  schools in the system.                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Purple Banner - bg-purple-50]                             │
│                                                              │
│  Users List:                                                 │
│  • John (Principal, School A)                               │
│  • Mary (Principal, School B)                               │
│  • Alice (Teacher, School A)                                │
│  • Bob (Teacher, School B)                                  │
│  • Student1 (Student, School A)                             │
│  • Student2 (Student, School B)                             │
│  ... (all users from all schools)                           │
└────────────────────────────────────────────────────────────┘
```

### Principal View
```
┌────────────────────────────────────────────────────────────┐
│  User Management                                            │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  🏫 School Context: ABC High School                   │  │
│  │  As a Principal, you can view and manage all         │  │
│  │  teachers and students in your school.                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Blue Banner - bg-blue-50]                                 │
│                                                              │
│  Users List:                                                 │
│  • Alice (Teacher, ABC High School)                         │
│  • Carol (Teacher, ABC High School)                         │
│  • Student1 (Student, ABC High School)                      │
│  • Student2 (Student, ABC High School)                      │
│  • Student3 (Student, ABC High School)                      │
│  ... (only teachers and students from ABC High School)      │
└────────────────────────────────────────────────────────────┘
```

### Teacher View
```
┌────────────────────────────────────────────────────────────┐
│  User Management                                            │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  🏫 School Context: ABC High School                   │  │
│  │  As a Teacher, you can view students from your       │  │
│  │  school. You cannot view other teachers or the       │  │
│  │  principal.                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Blue Banner - bg-blue-50]                                 │
│                                                              │
│  Users List:                                                 │
│  • Student1 (Student, ABC High School)                      │
│  • Student2 (Student, ABC High School)                      │
│  • Student3 (Student, ABC High School)                      │
│  • Student4 (Student, ABC High School)                      │
│  ... (only students from ABC High School)                   │
└────────────────────────────────────────────────────────────┘
```

### Student View
```
┌────────────────────────────────────────────────────────────┐
│  User Management                                            │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  🏫 School Context: ABC High School                   │  │
│  │  As a Student, you can only view your own profile.   │  │
│  │  Other students and teachers are not visible to you. │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Blue Banner - bg-blue-50]                                 │
│                                                              │
│  Users List:                                                 │
│  • Student1 (Student, ABC High School) [YOU]                │
│  ... (only your own profile)                                │
└────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Flow Diagram

```
User Login
    ↓
┌───────────────────────────────────────┐
│  Authentication (Supabase Auth)       │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│  Get User Profile                     │
│  • user_id                            │
│  • role (admin/principal/teacher/     │
│    student)                           │
│  • school_id                          │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│  RLS Policy Check                     │
│  (PostgreSQL Row Level Security)      │
└───────────────────────────────────────┘
    ↓
    ├─── Is Admin? ──→ YES ──→ Show All Users
    │                           (All Schools)
    │
    ├─── Is Principal? ──→ YES ──→ Show Teachers & Students
    │                               (Own School Only)
    │
    ├─── Is Teacher? ──→ YES ──→ Show Students
    │                             (Own School Only)
    │
    └─── Is Student? ──→ YES ──→ Show Self Only
                                  (Own Profile)
```

---

## 📋 Permission Comparison Table

### Data Access Permissions

| Data Type | Admin | Principal | Teacher | Student |
|-----------|-------|-----------|---------|---------|
| **All Schools** | ✅ Full | ❌ No | ❌ No | ❌ No |
| **Own School** | ✅ Full | ✅ Full | ✅ Limited | ❌ No |
| **Principals** | ✅ All | ❌ None | ❌ None | ❌ None |
| **Teachers** | ✅ All | ✅ Own School | ❌ None | ❌ None |
| **Students** | ✅ All | ✅ Own School | ✅ Own School | ❌ Self Only |
| **Exams** | ✅ All | ✅ Own School | ✅ Own School | ✅ Assigned |
| **Results** | ✅ All | ✅ Own School | ✅ Students | ✅ Self Only |

### Management Permissions

| Action | Admin | Principal | Teacher | Student |
|--------|-------|-----------|---------|---------|
| **Create Users** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Approve Users** | ✅ All | ✅ Own School | ❌ No | ❌ No |
| **Suspend Users** | ✅ All | ✅ Own School | ❌ No | ❌ No |
| **Delete Users** | ✅ All | ❌ No | ❌ No | ❌ No |
| **Create Exams** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Approve Exams** | ✅ All | ✅ Own School | ❌ No | ❌ No |
| **Create Questions** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Take Exams** | ❌ No | ❌ No | ❌ No | ✅ Yes |
| **View All Results** | ✅ Yes | ✅ Own School | ✅ Students | ❌ No |
| **View Own Results** | N/A | N/A | N/A | ✅ Yes |

---

## 🎯 Use Case Examples

### Example 1: Multi-School System
```
System has 3 schools:
• ABC High School (School A)
• XYZ Academy (School B)
• PQR Institute (School C)

Admin logs in:
→ Sees all users from all 3 schools
→ Can manage all schools

Principal of ABC High School logs in:
→ Sees only ABC High School teachers and students
→ Cannot see XYZ Academy or PQR Institute users
→ Cannot see other principals

Teacher at ABC High School logs in:
→ Sees only ABC High School students
→ Cannot see ABC High School principal
→ Cannot see other ABC High School teachers
→ Cannot see any users from XYZ or PQR

Student at ABC High School logs in:
→ Sees only their own profile
→ Cannot see other ABC High School students
→ Cannot see ABC High School teachers or principal
→ Cannot see any users from other schools
```

### Example 2: Teacher Creating Exam
```
Teacher Alice (ABC High School) creates an exam:
1. Alice logs in
2. Creates exam questions
3. Selects students for exam
4. Student list shows ONLY ABC High School students
5. Cannot assign exam to XYZ Academy students
6. Cannot see XYZ Academy students in the list
```

### Example 3: Principal Reviewing Results
```
Principal John (ABC High School) reviews results:
1. John logs in
2. Views exam results dashboard
3. Sees results for ABC High School students only
4. Sees performance of ABC High School teachers
5. Cannot see XYZ Academy results
6. Cannot see system-wide statistics (admin only)
```

---

## 🚀 Quick Testing Guide

### Test 1: Principal Access
```bash
1. Create 2 schools: School A, School B
2. Create Principal A (assigned to School A)
3. Create Principal B (assigned to School B)
4. Create 2 teachers in each school
5. Create 5 students in each school

Login as Principal A:
✅ Should see: 2 teachers + 5 students from School A
❌ Should NOT see: Principal B, School B teachers, School B students

Login as Principal B:
✅ Should see: 2 teachers + 5 students from School B
❌ Should NOT see: Principal A, School A teachers, School A students
```

### Test 2: Teacher Access
```bash
Login as Teacher from School A:
✅ Should see: 5 students from School A
❌ Should NOT see: Principal A, other teachers, School B users

Login as Teacher from School B:
✅ Should see: 5 students from School B
❌ Should NOT see: Principal B, other teachers, School A users
```

### Test 3: Student Access
```bash
Login as Student 1 from School A:
✅ Should see: Own profile only
❌ Should NOT see: Other students, teachers, principal, any School B users

Login as Student 2 from School B:
✅ Should see: Own profile only
❌ Should NOT see: Other students, teachers, principal, any School A users
```

### Test 4: Admin Access
```bash
Login as Admin:
✅ Should see: ALL users from ALL schools
✅ Should see: All principals, all teachers, all students
✅ Can manage: All users, all schools
```

---

## 📚 Related Documentation

- **ROLE_BASED_ACCESS_IMPLEMENTATION.md** - Complete technical implementation
- **SCHOOL_ISOLATION_GUIDE.md** - Comprehensive school isolation guide
- **SCHOOL_ISOLATION_SUMMARY.md** - Quick reference summary

---

## ✅ Implementation Status

**Status:** ✅ Complete and Tested  
**Security Level:** Maximum  
**Database Enforcement:** PostgreSQL RLS  
**UI Indicators:** Implemented  
**Documentation:** Complete  

---

**Last Updated:** 2025-01-12  
**Version:** 1.0  
**Migrations Applied:** 2
