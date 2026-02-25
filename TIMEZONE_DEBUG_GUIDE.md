# Timezone Handling and Timer Debug Guide

## Overview

This document explains how timezone handling works in the exam system and how to debug timer issues.

## Timezone Architecture

### Core Principle
**All times are stored in UTC in the database. All calculations are done in UTC. Only display is in IST.**

```
User Input (IST) → Convert to UTC → Store in DB (UTC)
                                        ↓
                                   Calculate in UTC
                                        ↓
                                   Display in IST
```

### Database Storage
- All timestamp columns use `timestamptz` type
- PostgreSQL automatically stores these in UTC
- Times are: `start_time`, `end_time`, `started_at`, `submitted_at`, `created_at`, `updated_at`

## Exam Creation Flow

### Teacher Input (IST)
When a teacher creates an exam:
1. Teacher enters date and time in IST (e.g., "2025-12-25" and "10:00")
2. UI shows these as IST times
3. Before sending to database, `convertISTInputToUTC()` converts to UTC
4. Database stores as UTC (e.g., "2025-12-25T04:30:00.000Z")

### Code Example
```typescript
// In CreateExam.tsx
const startTimeUTC = convertISTInputToUTC(formData.startDate, formData.startTime);
const endTimeUTC = convertISTInputToUTC(formData.endDate, formData.endTime);

// These UTC strings are sent to database
const examData = {
  start_time: startTimeUTC,  // "2025-12-25T04:30:00.000Z"
  end_time: endTimeUTC,
  // ...
};
```

### Conversion Function
```typescript
export function convertISTInputToUTC(dateStr: string, timeStr: string): string {
  // Parse date and time
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Create UTC timestamp treating input as IST
  const istTimestamp = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  
  // Subtract IST offset to get actual UTC time
  // IST is UTC+5:30, so 10:00 IST = 04:30 UTC
  const utcTimestamp = istTimestamp - IST_OFFSET_MS;
  
  return new Date(utcTimestamp).toISOString();
}
```

## Exam Attempt Flow

### Student Takes Exam
When a student starts an exam:
1. System checks if exam has started: `hasExamStarted(exam.start_time)`
2. System checks if exam has ended: `hasExamEnded(exam.end_time)`
3. Creates attempt with current UTC time: `new Date().toISOString()`
4. Calculates remaining time: `getExamRemainingTime(attempt.started_at, exam.duration_minutes)`

### Timer Calculation
```typescript
export function getExamRemainingTime(
  startedAt: string | Date,
  durationMinutes: number
): number {
  const now = new Date(); // Current UTC time
  const started = typeof startedAt === 'string' ? new Date(startedAt) : startedAt;
  
  // Calculate elapsed time in seconds
  const elapsedSeconds = getTimeDifferenceInSeconds(started, now);
  
  // Calculate remaining time
  const totalSeconds = durationMinutes * 60;
  return Math.max(0, totalSeconds - elapsedSeconds);
}
```

## Common Issues and Solutions

### Issue 1: Timer Shows 0 Immediately

**Symptoms:**
- Student starts exam
- Timer immediately shows 0:00:00
- Exam auto-submits instantly
- `started_at` and `submitted_at` are the same time

**Possible Causes:**

1. **Incorrect `started_at` time**
   - Check if `started_at` is being stored correctly in UTC
   - Verify no timezone conversion is happening twice

2. **Incorrect calculation**
   - Check if `getExamRemainingTime` is using correct times
   - Verify both `now` and `started` are in UTC

3. **Duration is 0**
   - Check if `duration_minutes` is set correctly in the exam

**Debug Steps:**
1. Check console logs (we've added debug logging)
2. Look for "=== EXAM TIMER DEBUG ===" in console
3. Verify all times are in UTC format (ending with 'Z')
4. Check if `elapsedSeconds` is reasonable (should be small, like 0-5 seconds)

### Issue 2: Exam Shows "Not Started" When It Should Be Available

**Symptoms:**
- Teacher creates exam for current time
- Student tries to access
- Gets "Exam has not started yet" error

**Possible Causes:**

1. **Timezone mismatch in start time**
   - Teacher entered IST time but it wasn't converted to UTC
   - Or conversion happened twice (double shift)

2. **Server time is different**
   - Server might be in different timezone
   - Check server's current time vs expected time

**Debug Steps:**
1. Check `exam.start_time` in database (should be UTC)
2. Check current server time: `new Date().toISOString()`
3. Compare the two - start_time should be <= current time

### Issue 3: Timer Counts Down Too Fast or Too Slow

**Symptoms:**
- Timer doesn't match wall clock time
- Exam ends earlier or later than expected

**Possible Causes:**

1. **Incorrect elapsed time calculation**
   - `started_at` might be in wrong timezone
   - Calculation might be using local time instead of UTC

2. **Timer interval issues**
   - setInterval might be running at wrong frequency
   - Multiple timers might be running

**Debug Steps:**
1. Check console logs for elapsed seconds
2. Verify `started_at` is in UTC
3. Check if multiple useEffect timers are running

## Debug Logging

We've added comprehensive debug logging to help diagnose timer issues.

### In TakeExam.tsx
```typescript
console.log('=== EXAM TIMER DEBUG ===');
console.log('Current UTC time:', new Date().toISOString());
console.log('Attempt started_at (from DB):', startedAtTime);
console.log('Exam duration (minutes):', examData.duration_minutes);
console.log('Calculated remaining seconds:', remainingSeconds);
console.log('Exam start_time (from DB):', examData.start_time);
console.log('Exam end_time (from DB):', examData.end_time);
console.log('========================');
```

### In timezone.ts (getExamRemainingTime)
```typescript
console.log('getExamRemainingTime calculation:');
console.log('  now (UTC):', now.toISOString());
console.log('  started (UTC):', started.toISOString());
console.log('  elapsedSeconds:', elapsedSeconds);
console.log('  totalSeconds:', totalSeconds);
console.log('  remaining:', remaining);
```

### How to Use Debug Logs

1. **Open browser console** (F12 → Console tab)
2. **Start an exam** as a student
3. **Look for debug logs** with "===" markers
4. **Verify the following:**
   - All times end with 'Z' (UTC format)
   - `elapsedSeconds` is small (0-10 seconds typically)
   - `totalSeconds` matches exam duration
   - `remaining` is close to `totalSeconds`

### Example Good Log
```
=== EXAM TIMER DEBUG ===
Current UTC time: 2025-12-25T03:27:12.000Z
Attempt started_at (from DB): 2025-12-25T03:27:12.000Z
Exam duration (minutes): 60
Calculated remaining seconds: 3600
Exam start_time (from DB): 2025-12-25T03:00:00.000Z
Exam end_time (from DB): 2025-12-25T04:00:00.000Z
========================

getExamRemainingTime calculation:
  now (UTC): 2025-12-25T03:27:12.000Z
  started (UTC): 2025-12-25T03:27:12.000Z
  elapsedSeconds: 0
  totalSeconds: 3600
  remaining: 3600
```

### Example Bad Log (Timer Issue)
```
=== EXAM TIMER DEBUG ===
Current UTC time: 2025-12-25T03:27:12.000Z
Attempt started_at (from DB): 2025-12-24T21:57:12.000Z  ← Wrong! Too old
Exam duration (minutes): 60
Calculated remaining seconds: 0  ← Problem! Should be 3600
Exam start_time (from DB): 2025-12-25T03:00:00.000Z
Exam end_time (from DB): 2025-12-25T04:00:00.000Z
========================

getExamRemainingTime calculation:
  now (UTC): 2025-12-25T03:27:12.000Z
  started (UTC): 2025-12-24T21:57:12.000Z  ← 5.5 hours ago!
  elapsedSeconds: 19800  ← Way too much!
  totalSeconds: 3600
  remaining: 0  ← Timer expired immediately
```

## Testing Checklist

### Before Deploying
- [ ] Create exam with IST time
- [ ] Verify `start_time` in database is UTC (5.5 hours earlier than IST)
- [ ] Student starts exam
- [ ] Check console logs - all times should be UTC
- [ ] Verify `elapsedSeconds` is small (0-10)
- [ ] Verify `remaining` equals `totalSeconds` minus `elapsedSeconds`
- [ ] Timer counts down correctly (1 second per second)
- [ ] Exam auto-submits when timer reaches 0

### After Deployment
- [ ] Monitor console logs for any timezone errors
- [ ] Check if students report timer issues
- [ ] Verify exam results show correct start/submit times
- [ ] Confirm times display correctly in IST for users

## Key Functions Reference

### convertISTInputToUTC(dateStr, timeStr)
- **Purpose:** Convert teacher's IST input to UTC for storage
- **Input:** Date string ("2025-12-25") and time string ("10:00")
- **Output:** UTC ISO string ("2025-12-25T04:30:00.000Z")
- **Used in:** CreateExam.tsx

### hasExamStarted(startTime)
- **Purpose:** Check if exam has started
- **Input:** UTC timestamp (string or Date)
- **Output:** boolean
- **Logic:** `now >= startTime` (both in UTC)

### hasExamEnded(endTime)
- **Purpose:** Check if exam has ended
- **Input:** UTC timestamp (string or Date)
- **Output:** boolean
- **Logic:** `now >= endTime` (both in UTC)

### getExamRemainingTime(startedAt, durationMinutes)
- **Purpose:** Calculate remaining exam time in seconds
- **Input:** Attempt start time (UTC) and exam duration
- **Output:** Remaining seconds (0 or positive)
- **Logic:** `totalSeconds - elapsedSeconds`

### formatISTDateTime(date)
- **Purpose:** Display UTC time in IST format
- **Input:** UTC timestamp
- **Output:** Formatted IST string
- **Used in:** UI display only

## Best Practices

1. **Never mix timezones in calculations**
   - Always use UTC for all time math
   - Only convert to IST for display

2. **Always use ISO strings for storage**
   - Use `.toISOString()` when creating timestamps
   - This ensures UTC format with 'Z' suffix

3. **Test with different timezones**
   - Test with browser in different timezones
   - Verify behavior is consistent

4. **Log liberally during development**
   - Add console.log for all time-related operations
   - Remove or comment out before production

5. **Validate input times**
   - Ensure end time > start time
   - Ensure start time is not in the past (if required)
   - Validate duration is positive

## Troubleshooting Commands

### Check Database Times
```sql
-- Check exam times (should be UTC)
SELECT id, title, start_time, end_time, duration_minutes
FROM exams
ORDER BY created_at DESC
LIMIT 5;

-- Check attempt times (should be UTC)
SELECT id, exam_id, started_at, submitted_at, status
FROM exam_attempts
ORDER BY created_at DESC
LIMIT 5;
```

### Check Current Server Time
```typescript
console.log('Server UTC time:', new Date().toISOString());
console.log('Server local time:', new Date().toString());
```

### Verify Timezone Conversion
```typescript
const testDate = "2025-12-25";
const testTime = "10:00";
const utc = convertISTInputToUTC(testDate, testTime);
console.log('IST input:', testDate, testTime);
console.log('UTC output:', utc);
// Should show: 2025-12-25T04:30:00.000Z
```

## Summary

- **Storage:** Always UTC (timestamptz in PostgreSQL)
- **Calculations:** Always UTC (Date objects in JavaScript)
- **Display:** Convert to IST only for UI
- **Debug:** Use console logs to verify all times are UTC
- **Test:** Verify timer behavior with real exams

## Related Files

- `src/utils/timezone.ts` - All timezone utility functions
- `src/pages/teacher/CreateExam.tsx` - Exam creation with IST input
- `src/pages/student/TakeExam.tsx` - Exam taking with timer
- `supabase/migrations/00023_*.sql` - Database schema with timestamptz

---

**Last Updated:** December 25, 2024
**Status:** Debug logging added, ready for testing
