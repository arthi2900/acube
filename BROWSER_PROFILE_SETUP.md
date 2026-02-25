# Browser Profile Setup Guide

## Quick Start: Testing Multiple Users Simultaneously

This guide shows you how to set up browser profiles to test multiple user roles at the same time.

---

## Why Use Browser Profiles?

✅ **Test multiple users simultaneously** - Admin, Principal, Teacher, Student all logged in  
✅ **No code changes needed** - Works with existing application  
✅ **Complete isolation** - Each profile has separate cookies, storage, cache  
✅ **Stay logged in** - Each profile maintains its session independently  
✅ **Easy switching** - Click to switch between profiles  

---

## Microsoft Edge Setup

### Step 1: Create New Profile

1. **Open Edge browser**
2. **Click your profile icon** (top right corner, next to the three dots)
3. **Click "Add profile"**
4. **Choose "Add"** (not "Add without signing in" is fine too)
5. **Name the profile**: e.g., "Admin Testing", "Teacher Testing", etc.
6. **Click "Add"**

### Step 2: Repeat for Each Role

Create 4 profiles:
- **Profile 1**: "Admin Testing"
- **Profile 2**: "Principal Testing"
- **Profile 3**: "Teacher Testing"
- **Profile 4**: "Student Testing"

### Step 3: Login to Each Profile

1. **Switch to "Admin Testing" profile**
   - Click profile icon → Select "Admin Testing"
   - Navigate to your application
   - Login as admin user
   - Leave this window open

2. **Switch to "Principal Testing" profile**
   - Click profile icon → Select "Principal Testing"
   - Navigate to your application
   - Login as principal user
   - Leave this window open

3. **Repeat for Teacher and Student profiles**

### Step 4: Switch Between Profiles

**Method 1: Profile Icon**
- Click profile icon (top right)
- Select the profile you want to switch to
- New window opens with that profile

**Method 2: Windows Taskbar**
- Each profile creates a separate Edge window
- Use Alt+Tab to switch between windows
- Each window shows the profile name in the title bar

---

## Google Chrome Setup

### Step 1: Create New Profile

1. **Open Chrome browser**
2. **Click your profile icon** (top right corner)
3. **Click "Add"**
4. **Choose "Continue without an account"** (or sign in if you prefer)
5. **Name the profile**: e.g., "Admin Testing"
6. **Choose a color and icon** (optional)
7. **Click "Done"**

### Step 2: Repeat for Each Role

Create 4 profiles:
- **Profile 1**: "Admin Testing" (Red icon)
- **Profile 2**: "Principal Testing" (Blue icon)
- **Profile 3**: "Teacher Testing" (Green icon)
- **Profile 4**: "Student Testing" (Yellow icon)

### Step 3: Login to Each Profile

Same as Edge - login to each profile with the appropriate user.

### Step 4: Switch Between Profiles

**Method 1: Profile Icon**
- Click profile icon (top right)
- Select the profile you want

**Method 2: Chrome Menu**
- Click three dots (top right)
- Hover over "Profiles"
- Select the profile you want

---

## Visual Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  Your Desktop                                                    │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Edge Window 1   │  │  Edge Window 2   │                    │
│  │  Admin Testing   │  │  Principal Test  │                    │
│  │  ┌────────────┐  │  │  ┌────────────┐  │                    │
│  │  │ Logged in  │  │  │  │ Logged in  │  │                    │
│  │  │ as: admin  │  │  │  │ as: prin1  │  │                    │
│  │  └────────────┘  │  │  └────────────┘  │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Edge Window 3   │  │  Edge Window 4   │                    │
│  │  Teacher Testing │  │  Student Testing │                    │
│  │  ┌────────────┐  │  │  ┌────────────┐  │                    │
│  │  │ Logged in  │  │  │  │ Logged in  │  │                    │
│  │  │ as: teach1 │  │  │  │ as: stud1  │  │                    │
│  │  └────────────┘  │  │  └────────────┘  │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                   │
│  Use Alt+Tab or click taskbar to switch between windows         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing Workflow Example

### Scenario: Test Exam Creation and Taking

**Step 1: Create Exam (Teacher Profile)**
1. Switch to "Teacher Testing" window
2. Navigate to "Create Exam" page
3. Create a new exam with questions
4. Publish the exam

**Step 2: Approve Exam (Principal Profile)**
1. Switch to "Principal Testing" window
2. Navigate to "Exam Management"
3. See the newly created exam
4. Approve the exam

**Step 3: Take Exam (Student Profile)**
1. Switch to "Student Testing" window
2. Navigate to "Available Exams"
3. See the approved exam
4. Take the exam

**Step 4: View Results (Teacher Profile)**
1. Switch back to "Teacher Testing" window
2. Navigate to "Results"
3. See the student's exam results

**Step 5: Review Overall Performance (Admin Profile)**
1. Switch to "Admin Testing" window
2. Navigate to "Reports"
3. See system-wide statistics

---

## Tips and Tricks

### Tip 1: Keep Profiles Organized

**Use consistent naming:**
- ✅ "Admin Testing"
- ✅ "Principal Testing"
- ✅ "Teacher Testing"
- ✅ "Student Testing"

**Not:**
- ❌ "Profile 1"
- ❌ "Test"
- ❌ "New Profile"

### Tip 2: Use Different Colors/Icons

In Chrome, assign different colors to each profile:
- 🔴 Admin = Red
- 🔵 Principal = Blue
- 🟢 Teacher = Green
- 🟡 Student = Yellow

This makes it easy to identify which window is which.

### Tip 3: Pin Application Tabs

In each profile window:
1. Navigate to your application
2. Right-click the tab
3. Select "Pin tab"
4. The tab stays open and is easy to find

### Tip 4: Use Keyboard Shortcuts

**Windows/Linux:**
- `Alt + Tab` - Switch between windows
- `Ctrl + Tab` - Switch between tabs in current window
- `Ctrl + Shift + Tab` - Switch tabs backwards

**Mac:**
- `Cmd + Tab` - Switch between windows
- `Cmd + Option + →` - Switch tabs forward
- `Cmd + Option + ←` - Switch tabs backward

### Tip 5: Arrange Windows

**Side by Side (2 profiles):**
- Drag Window 1 to left edge (snaps to left half)
- Drag Window 2 to right edge (snaps to right half)
- See both profiles simultaneously

**Quadrant Layout (4 profiles):**
- Use Windows PowerToys or similar tool
- Arrange windows in 2x2 grid
- See all 4 profiles at once

---

## Troubleshooting

### Issue: Can't Find Profile Icon

**Edge:**
- Look for circular icon in top right corner
- If not visible, click three dots (⋯) → Settings → Profiles

**Chrome:**
- Look for circular icon in top right corner
- If not visible, click three dots (⋮) → Settings → You and Google

### Issue: Profiles Keep Logging Out

**Check:**
- Make sure you're not using "Guest" or "Incognito" mode
- Regular profiles should stay logged in
- Check if "Clear cookies on exit" is enabled (disable it)

### Issue: Can't Switch Between Profiles

**Solution:**
- Each profile opens in a separate window
- Use Alt+Tab (Windows) or Cmd+Tab (Mac) to switch
- Or click the profile icon and select different profile

### Issue: Too Many Windows Open

**Solution:**
- Close profiles you're not currently testing
- Use virtual desktops (Windows 10/11):
  - Press `Win + Tab`
  - Create new desktop for testing
  - Move profile windows to that desktop

---

## Alternative: Quick Testing with Incognito

If you only need to test 2 users quickly:

### Edge/Chrome:

1. **Normal Window**: Login as User 1
2. **Press `Ctrl + Shift + N`**: Opens incognito window
3. **Incognito Window**: Login as User 2

**Limitations:**
- Only 2 sessions (normal + incognito)
- Incognito session is lost when you close the window
- Not suitable for extended testing

---

## Profile Management

### Deleting a Profile

**Edge:**
1. Click profile icon
2. Click gear icon (⚙️) next to profile name
3. Select "Delete"
4. Confirm deletion

**Chrome:**
1. Click profile icon
2. Click gear icon (⚙️)
3. Click three dots next to profile
4. Select "Delete"
5. Confirm deletion

### Renaming a Profile

**Edge:**
1. Click profile icon
2. Click gear icon (⚙️)
3. Click "Edit" next to profile name
4. Enter new name
5. Click "Save"

**Chrome:**
1. Click profile icon
2. Click gear icon (⚙️)
3. Click pencil icon next to profile name
4. Enter new name
5. Press Enter

---

## Summary

✅ **Create 4 browser profiles** - One for each role  
✅ **Login to each profile** - With appropriate user  
✅ **Keep windows open** - Sessions stay active  
✅ **Switch with Alt+Tab** - Quick switching between profiles  
✅ **Test workflows** - Simulate real user interactions  

**Time to Setup:** 5-10 minutes  
**Benefit:** Test all user roles simultaneously without logging in/out  
**Recommended for:** Development, Testing, QA  

---

## Related Documentation

- **MULTI_TAB_SESSION_GUIDE.md** - Detailed explanation of why this is needed
- **ROLE_BASED_ACCESS_IMPLEMENTATION.md** - Access control details
- **ACCESS_CONTROL_VISUAL_GUIDE.md** - Visual reference for permissions

---

**Last Updated:** 2025-01-12  
**Recommended Setup Time:** 10 minutes  
**Difficulty:** Easy ⭐
