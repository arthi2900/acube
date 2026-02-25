# Testing Quick Start Guide

## 🚀 Get Started Testing in 5 Minutes

This guide helps you quickly set up your testing environment for the Online Exam Management System.

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Create Browser Profiles (2 minutes)

**Edge Browser:**
1. Click profile icon (top right)
2. Click "Add profile"
3. Create 4 profiles:
   - "Admin Testing"
   - "Principal Testing"
   - "Teacher Testing"
   - "Student Testing"

**Detailed Instructions:** See [BROWSER_PROFILE_SETUP.md](BROWSER_PROFILE_SETUP.md)

### Step 2: Login to Each Profile (3 minutes)

1. **Admin Testing Profile**
   - Navigate to application
   - Login as: `admin` / password
   - Keep window open

2. **Principal Testing Profile**
   - Navigate to application
   - Login as: `principal1` / password
   - Keep window open

3. **Teacher Testing Profile**
   - Navigate to application
   - Login as: `teacher1` / password
   - Keep window open

4. **Student Testing Profile**
   - Navigate to application
   - Login as: `student1` / password
   - Keep window open

### Step 3: Start Testing! ✅

Use `Alt + Tab` (Windows) or `Cmd + Tab` (Mac) to switch between profiles.

---

## 🎯 Common Testing Scenarios

### Scenario 1: Test User Management

**Admin Profile:**
1. Go to "User Management"
2. Create a new teacher account
3. Approve the account

**Principal Profile:**
1. Refresh the page
2. Check if you can see the new teacher (if same school)

**Teacher Profile:**
1. Try to access "User Management"
2. Should see limited access (students only)

### Scenario 2: Test Exam Workflow

**Teacher Profile:**
1. Create exam questions
2. Create exam paper
3. Publish exam

**Principal Profile:**
1. Go to "Exam Management"
2. Review the exam
3. Approve the exam

**Student Profile:**
1. Go to "Available Exams"
2. Take the exam
3. Submit answers

**Teacher Profile:**
1. Go to "Results"
2. View student's exam results

### Scenario 3: Test School Isolation

**Admin Profile:**
1. Create two schools: "School A" and "School B"
2. Create users for each school

**Principal Profile (School A):**
1. Go to "User Management"
2. Should only see School A users
3. Should NOT see School B users

**Principal Profile (School B):**
1. Go to "User Management"
2. Should only see School B users
3. Should NOT see School A users

---

## 📚 Documentation Index

### Essential Reading

1. **[BROWSER_PROFILE_SETUP.md](BROWSER_PROFILE_SETUP.md)**
   - How to set up browser profiles
   - Step-by-step instructions
   - Tips and tricks

2. **[MULTI_TAB_SESSION_GUIDE.md](MULTI_TAB_SESSION_GUIDE.md)**
   - Why you need browser profiles
   - Technical explanation
   - Alternative solutions

### Access Control Documentation

3. **[ACCESS_CONTROL_VISUAL_GUIDE.md](ACCESS_CONTROL_VISUAL_GUIDE.md)**
   - Visual diagrams of who can see what
   - Role visibility matrix
   - Use case examples

4. **[ROLE_BASED_ACCESS_IMPLEMENTATION.md](ROLE_BASED_ACCESS_IMPLEMENTATION.md)**
   - Complete technical implementation
   - RLS policies explained
   - Testing instructions

5. **[SCHOOL_ISOLATION_GUIDE.md](SCHOOL_ISOLATION_GUIDE.md)**
   - School-based multi-tenancy
   - How isolation works
   - Implementation details

### Troubleshooting

6. **[RLS_RECURSION_FIX_GUIDE.md](RLS_RECURSION_FIX_GUIDE.md)**
   - Fix for "infinite recursion" error
   - Technical explanation
   - Verification steps

---

## 🔍 Quick Troubleshooting

### Issue: Login shows 500 error

**Solution:** RLS recursion issue - already fixed!
- See: [RLS_RECURSION_FIX_GUIDE.md](RLS_RECURSION_FIX_GUIDE.md)
- Migrations applied: ✅
- Should work now

### Issue: Multiple tabs show same user

**Solution:** This is expected behavior!
- See: [MULTI_TAB_SESSION_GUIDE.md](MULTI_TAB_SESSION_GUIDE.md)
- Use browser profiles instead
- See: [BROWSER_PROFILE_SETUP.md](BROWSER_PROFILE_SETUP.md)

### Issue: Can't see expected users

**Solution:** Check role and school assignment
- Admin: Can see all users
- Principal: Can see teachers/students from their school
- Teacher: Can see students from their school
- Student: Can only see own profile

**Verify:**
```sql
SELECT username, role, school_id, approved 
FROM profiles 
WHERE username = 'your_username';
```

### Issue: User not approved

**Solution:** Approve the user first
- Login as Admin
- Go to "User Management"
- Find the user
- Click "Approve"

---

## 🎨 Role-Based Access Summary

| Role | Can See | Cannot See |
|------|---------|------------|
| **Admin** | All users, all schools | Nothing |
| **Principal** | Teachers + Students (own school) | Other principals, other schools |
| **Teacher** | Students (own school) | Principal, other teachers, other schools |
| **Student** | Own profile only | Everyone else |

**Detailed Matrix:** See [ACCESS_CONTROL_VISUAL_GUIDE.md](ACCESS_CONTROL_VISUAL_GUIDE.md)

---

## 🛠️ Development Tools

### Useful SQL Queries

**Check current user's profile:**
```sql
SELECT * FROM profiles WHERE id = auth.uid();
```

**Check all RLS policies:**
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';
```

**Check user's school:**
```sql
SELECT p.username, p.role, s.school_name 
FROM profiles p 
LEFT JOIN schools s ON p.school_id = s.id 
WHERE p.username = 'your_username';
```

### Browser DevTools

**Check localStorage:**
```javascript
// Open browser console (F12)
console.log(localStorage);

// Check Supabase session
console.log(localStorage.getItem('sb-reyftgnsemyzkjchdats-auth-token'));
```

**Check current user:**
```javascript
// In browser console
const { data: { user } } = await supabase.auth.getUser();
console.log(user);
```

---

## 📋 Testing Checklist

### Initial Setup
- [ ] Created 4 browser profiles
- [ ] Logged into each profile
- [ ] Verified each profile shows correct user

### User Management Testing
- [ ] Admin can create users
- [ ] Admin can approve users
- [ ] Principal can see school users only
- [ ] Teacher can see students only
- [ ] Student can see own profile only

### School Isolation Testing
- [ ] Created multiple schools
- [ ] Assigned users to schools
- [ ] Verified principals see only their school
- [ ] Verified teachers see only their school
- [ ] Verified students see only themselves

### Exam Workflow Testing
- [ ] Teacher can create questions
- [ ] Teacher can create exams
- [ ] Principal can approve exams
- [ ] Student can take exams
- [ ] Teacher can view results
- [ ] Admin can view all results

### Security Testing
- [ ] Non-admin cannot access admin features
- [ ] Users cannot see other schools' data
- [ ] Students cannot see other students
- [ ] Teachers cannot modify principal data

---

## 🎓 Learning Path

### Day 1: Setup and Basic Testing
1. Read [BROWSER_PROFILE_SETUP.md](BROWSER_PROFILE_SETUP.md)
2. Set up browser profiles
3. Test basic login/logout
4. Test user management

### Day 2: Access Control Testing
1. Read [ACCESS_CONTROL_VISUAL_GUIDE.md](ACCESS_CONTROL_VISUAL_GUIDE.md)
2. Test role-based access
3. Test school isolation
4. Verify permissions

### Day 3: Workflow Testing
1. Test exam creation workflow
2. Test exam approval workflow
3. Test exam taking workflow
4. Test results viewing

### Day 4: Edge Cases and Security
1. Test with unapproved users
2. Test with users without schools
3. Test cross-school access attempts
4. Test permission boundaries

---

## 💡 Pro Tips

### Tip 1: Keep Profiles Organized
- Use consistent naming
- Assign different colors (Chrome)
- Pin application tabs

### Tip 2: Use Keyboard Shortcuts
- `Alt + Tab` - Switch windows
- `Ctrl + Tab` - Switch tabs
- `F12` - Open DevTools

### Tip 3: Arrange Windows
- Side by side for 2 profiles
- Quadrant layout for 4 profiles
- Use virtual desktops

### Tip 4: Quick Reset
- Clear browser data per profile
- Or delete and recreate profile
- Keeps testing environment clean

### Tip 5: Document Issues
- Take screenshots
- Note the role and action
- Check browser console for errors
- Check network tab for API errors

---

## 🆘 Getting Help

### Documentation
- Check the relevant guide in the list above
- Search for keywords in documentation
- Check FAQ sections

### Database Issues
- Check Supabase dashboard
- Run SQL queries to verify data
- Check RLS policies

### Frontend Issues
- Check browser console (F12)
- Check network tab for API errors
- Verify user is logged in correctly

### Still Stuck?
- Review [RLS_RECURSION_FIX_GUIDE.md](RLS_RECURSION_FIX_GUIDE.md)
- Review [MULTI_TAB_SESSION_GUIDE.md](MULTI_TAB_SESSION_GUIDE.md)
- Check git commit history for recent changes

---

## ✅ Summary

**Setup Time:** 5 minutes  
**Learning Curve:** Easy  
**Testing Efficiency:** 10x faster with browser profiles  

**Key Takeaways:**
1. Use browser profiles for testing multiple users
2. Each role has different access levels
3. School isolation prevents cross-school data access
4. RLS policies enforce security at database level
5. This is a production-ready system

**Ready to Test?** Follow Step 1 above! 🚀

---

**Last Updated:** 2025-01-12  
**Version:** 1.0  
**Status:** ✅ Ready for Testing
