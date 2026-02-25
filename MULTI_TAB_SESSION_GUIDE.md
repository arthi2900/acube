# Multi-Tab Session Management Guide

## Issue Description

**Problem:** When opening multiple tabs in the same browser and logging in with different users, only one user can be logged in at a time. Logging in with a new user in one tab logs out the previous user in all other tabs.

**Example Scenario:**
1. Tab 1: Login as "Teacher1" ✅
2. Tab 2: Login as "Student1" ✅
3. Result: Tab 1 now shows "Student1" instead of "Teacher1" ❌

---

## Why This Happens

### Root Cause: Shared Browser Storage

Supabase Auth (and most authentication systems) store the session in the browser's **localStorage**, which is **shared across all tabs** for the same domain.

```
Browser Storage Architecture:
┌─────────────────────────────────────────────────────────┐
│  Browser (Edge/Chrome/Firefox)                          │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Tab 1     │  │   Tab 2     │  │   Tab 3     │     │
│  │  Teacher1   │  │  Student1   │  │  Admin1     │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │              │
│         └────────────────┼────────────────┘              │
│                          │                               │
│                          ▼                               │
│         ┌────────────────────────────────┐              │
│         │   Shared localStorage          │              │
│         │   Key: supabase.auth.token     │              │
│         │   Value: [Latest Session]      │              │
│         └────────────────────────────────┘              │
│                                                           │
│  When Tab 2 logs in, it overwrites the session          │
│  All tabs now read the same (new) session               │
└─────────────────────────────────────────────────────────┘
```

### Technical Details

**Supabase Client Initialization:**
```typescript
// src/db/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

By default, this creates a client that:
1. Stores session in `localStorage` under key `sb-<project-ref>-auth-token`
2. Shares this storage across all tabs
3. Broadcasts auth state changes to all tabs via `BroadcastChannel`

**Auth State Listener:**
```typescript
// src/hooks/useAuth.ts
supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);
  // This fires in ALL tabs when ANY tab changes auth state
});
```

When you login in Tab 2:
1. Tab 2 writes new session to localStorage
2. Supabase broadcasts "SIGNED_IN" event to all tabs
3. Tab 1 receives the event and updates its state
4. Tab 1 now shows the new user

---

## This is Expected Behavior

**Important:** This is **not a bug** - it's the standard behavior for web applications!

### Why Most Apps Work This Way

1. **Security**: Prevents session confusion and potential security issues
2. **Data Consistency**: Ensures all tabs show the same user's data
3. **Simplicity**: Easier to manage single session per browser
4. **User Experience**: Users typically don't want to be logged in as multiple users simultaneously

### Industry Standard Examples

- **Gmail**: Can't be logged in as two different users in the same browser
- **Facebook**: Logging in with a new account logs out the previous one
- **Twitter/X**: Same behavior - one user per browser
- **Banking Apps**: Strictly enforce single session per browser

---

## Solutions

### Solution 1: Browser Profiles (Recommended for Testing)

**Best for:** Testing multiple user roles simultaneously

**How to use:**

#### Edge Browser:
1. Click your profile icon (top right)
2. Click "Add profile"
3. Create profiles: "Teacher Profile", "Student Profile", "Admin Profile"
4. Each profile has separate storage
5. Login with different users in different profiles

#### Chrome Browser:
1. Click your profile icon (top right)
2. Click "Add"
3. Create separate profiles for each user type

**Advantages:**
- ✅ Complete isolation between sessions
- ✅ Can run simultaneously
- ✅ Each profile has separate cookies, cache, extensions
- ✅ No code changes needed

**Disadvantages:**
- ❌ Requires manual profile switching
- ❌ Only practical for testing, not production use

---

### Solution 2: Incognito/Private Windows

**Best for:** Quick testing with 2-3 users

**How to use:**

1. **Normal Window**: Login as User 1
2. **Incognito Window 1**: Login as User 2
3. **Incognito Window 2**: Login as User 3

**Edge/Chrome Shortcuts:**
- `Ctrl + Shift + N` (Windows/Linux)
- `Cmd + Shift + N` (Mac)

**Advantages:**
- ✅ Quick and easy
- ✅ No setup required
- ✅ Separate storage per window
- ✅ No code changes needed

**Disadvantages:**
- ❌ Limited number of sessions (usually 1 normal + 1-2 incognito)
- ❌ Incognito windows share storage with each other in some browsers
- ❌ Not practical for production use

---

### Solution 3: Different Browsers

**Best for:** Testing 2-3 users simultaneously

**How to use:**

1. **Edge**: Login as Teacher
2. **Chrome**: Login as Student
3. **Firefox**: Login as Admin

**Advantages:**
- ✅ Complete isolation
- ✅ Easy to switch between
- ✅ No code changes needed

**Disadvantages:**
- ❌ Need multiple browsers installed
- ❌ Limited to number of browsers available
- ❌ Not practical for production use

---

### Solution 4: Custom Session Storage (Advanced)

**Best for:** Special use cases requiring multiple simultaneous sessions

**⚠️ Warning:** This is complex and not recommended for most applications!

**Implementation:**

```typescript
// src/db/supabase.ts
import { createClient } from "@supabase/supabase-js";

// Create a unique storage key per tab
const tabId = sessionStorage.getItem('tabId') || crypto.randomUUID();
sessionStorage.setItem('tabId', tabId);

// Custom storage implementation
const customStorage = {
  getItem: (key: string) => {
    return localStorage.getItem(`${tabId}-${key}`);
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(`${tabId}-${key}`, value);
  },
  removeItem: (key: string) => {
    localStorage.removeItem(`${tabId}-${key}`);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**Advantages:**
- ✅ Allows multiple sessions in same browser
- ✅ Each tab maintains independent session

**Disadvantages:**
- ❌ Complex implementation
- ❌ Breaks expected user behavior
- ❌ Can cause confusion (which user am I?)
- ❌ Potential security issues
- ❌ Difficult to manage session lifecycle
- ❌ May break other features (password reset links, etc.)
- ❌ Not recommended by Supabase

---

## Recommended Approach

### For Development/Testing

**Use Browser Profiles:**

1. Create profiles for each role:
   - Profile 1: "Admin Testing"
   - Profile 2: "Principal Testing"
   - Profile 3: "Teacher Testing"
   - Profile 4: "Student Testing"

2. Keep each profile logged in with the appropriate user

3. Switch between profiles to test different roles

### For Production

**Educate users that this is normal behavior:**

1. Add a note on the login page:
   ```
   Note: Logging in will sign out any other user in this browser.
   To use multiple accounts, use different browser profiles or browsers.
   ```

2. Most users won't need multiple simultaneous sessions

3. If they do, they can use:
   - Different browsers
   - Browser profiles
   - Different devices

---

## Testing Workflow

### Recommended Testing Setup

```
Browser Profile Setup:
┌─────────────────────────────────────────────────────────┐
│  Edge Profile 1: "Admin Testing"                        │
│  - Login: admin                                          │
│  - Always logged in                                      │
│  - Use for admin testing                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Edge Profile 2: "Principal Testing"                    │
│  - Login: principal1                                     │
│  - Always logged in                                      │
│  - Use for principal testing                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Edge Profile 3: "Teacher Testing"                      │
│  - Login: teacher1                                       │
│  - Always logged in                                      │
│  - Use for teacher testing                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Edge Profile 4: "Student Testing"                      │
│  - Login: student1                                       │
│  - Always logged in                                      │
│  - Use for student testing                               │
└─────────────────────────────────────────────────────────┘
```

### Quick Testing (2 users)

```
Setup:
- Normal Window: User 1
- Incognito Window: User 2

Example:
- Normal: Teacher creating exam
- Incognito: Student taking exam
```

---

## FAQ

### Q: Is this a bug in the application?
**A:** No, this is standard behavior for web applications. Most apps work this way.

### Q: Can I fix this by changing code?
**A:** You can implement custom storage (Solution 4), but it's not recommended. Use browser profiles instead.

### Q: Why don't other apps have this issue?
**A:** They do! Try logging into Gmail with two different accounts in two tabs - the same thing happens.

### Q: Will production users face this issue?
**A:** Most users won't notice because they typically only use one account. If they need multiple accounts, they'll use different browsers or devices.

### Q: Should I implement Solution 4 (custom storage)?
**A:** No, unless you have a very specific use case. Use browser profiles for testing instead.

### Q: What about mobile apps?
**A:** Mobile apps typically only allow one user at a time anyway. This is a non-issue on mobile.

### Q: Can I detect when another tab logs in?
**A:** Yes, the `onAuthStateChange` listener already does this. You could show a notification, but logging out is the correct behavior.

---

## Summary

✅ **This is expected behavior** - not a bug  
✅ **Industry standard** - all major apps work this way  
✅ **Use browser profiles** for testing multiple users  
✅ **Don't implement custom storage** unless absolutely necessary  
✅ **Educate users** if they encounter this in production  

**For Testing:**
- Create separate browser profiles for each role
- Use incognito windows for quick tests
- Use different browsers if needed

**For Production:**
- This is normal and expected
- Most users won't be affected
- Add a note on login page if needed

---

## Related Documentation

- **Supabase Auth Documentation**: https://supabase.com/docs/guides/auth
- **Browser Storage API**: https://developer.mozilla.org/en-US/docs/Web/API/Storage
- **Browser Profiles Guide**: Search "how to create browser profile" for your browser

---

**Last Updated:** 2025-01-12  
**Status:** ✅ Working as Designed  
**Recommendation:** Use browser profiles for testing
