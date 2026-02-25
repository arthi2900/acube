# Time Format Quick Reference

## Display Formats

### ✅ Correct (12-Hour with AM/PM)
```
09:30 AM
11:45 PM
02:15 PM
12:00 AM (midnight)
12:00 PM (noon)
```

### ❌ Incorrect (24-Hour)
```
09:30
23:45
14:15
00:00
12:00
```

## Code Examples

### Full Date-Time Display
```typescript
// Format: "Dec 11, 2025, 09:30 AM"
new Date(dateString).toLocaleString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,  // ← REQUIRED
});
```

### Time Only Display
```typescript
// Format: "09:30 AM"
new Date(timeString).toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,  // ← REQUIRED
});
```

### Time with Seconds
```typescript
// Format: "09:30:45 AM"
new Date(timeString).toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,  // ← REQUIRED
});
```

## Where to Find Time Displays

### Teacher Pages
- **Manage Exams**: Exam start/end times
- **Live Monitoring**: Last updated, exam times, student attempt times
- **Student Analysis**: Attempt timestamps
- **Exam Results**: Last updated timestamp
- **Exam Analysis**: Chart time labels

### Principal Pages
- **Exam Approvals**: Approval timestamps
- **Live Monitoring**: Same as teacher
- **Student Analysis**: Performance timestamps
- **Exam Analysis**: Chart time labels

### Admin Pages
- **Storage Monitoring**: Last calculated times
- **Login History**: Login timestamps (already correct)
- **Active Users**: Session times (already correct)

### Student Pages
- **Available Exams**: Uses timezone utility (already correct)
- **Take Exam**: Timer display (already correct)
- **Results**: Submission times (already correct)

## Common Patterns

### Time Range Display
```typescript
// Format: "09:30 AM - 11:00 AM"
{new Date(exam.start_time).toLocaleTimeString('en-US', { 
  hour: '2-digit', 
  minute: '2-digit', 
  hour12: true 
})} - {new Date(exam.end_time).toLocaleTimeString('en-US', { 
  hour: '2-digit', 
  minute: '2-digit', 
  hour12: true 
})}
```

### Conditional Time Display
```typescript
// Format: "Started: 09:30 AM" or "Not started"
{attempt.started_at && (
  <span>
    Started: {new Date(attempt.started_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })}
  </span>
)}
```

### Last Updated Display
```typescript
// Format: "Last updated: 09:30:45 AM"
Last updated: {lastRefreshTime.toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
})}
```

## Timezone Utilities

### Already Correct Functions
```typescript
// src/utils/timezone.ts

// Returns: "11 December 2025, 09:30 AM"
formatISTDateTime(date)

// Returns: { date: "11-12-2025", time: "at 09:30 AM" }
formatISTDateTimeSeparate(date)
```

### Usage Example
```typescript
import { formatISTDateTime } from '@/utils/timezone';

// Display exam time
<p>{formatISTDateTime(exam.start_time)}</p>
```

## Time Picker Component

### Already Correct
The time picker component (`src/components/ui/time-picker.tsx`) already:
- ✅ Displays in 12-hour format
- ✅ Shows AM/PM selector
- ✅ Accepts 12-hour input
- ✅ Converts to UTC for storage

### Usage
```typescript
<TimePicker
  value={formData.startTime}  // UTC format
  onChange={(value) => setFormData({ ...formData, startTime: value })}
/>
// Displays: "09:30 AM" button
// Stores: "04:00:00Z" (UTC)
```

## Testing Checklist

### Visual Check
- [ ] All times show AM or PM
- [ ] No times show in 24-hour format (e.g., 14:30)
- [ ] Midnight shows as 12:00 AM (not 00:00)
- [ ] Noon shows as 12:00 PM (not 12:00)

### Functional Check
- [ ] Time picker accepts 12-hour input
- [ ] Time picker displays 12-hour format
- [ ] All exam times show with AM/PM
- [ ] All monitoring times show with AM/PM
- [ ] All analysis times show with AM/PM

### Edge Cases
- [ ] 12:00 AM (midnight) displays correctly
- [ ] 12:00 PM (noon) displays correctly
- [ ] 11:59 PM displays correctly
- [ ] 12:01 AM displays correctly

## Common Mistakes to Avoid

### ❌ Mistake 1: Missing hour12 option
```typescript
// Wrong
new Date(time).toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
});
// Shows: "09:30" (no AM/PM)
```

### ✅ Correct
```typescript
new Date(time).toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,  // ← Add this
});
// Shows: "09:30 AM"
```

### ❌ Mistake 2: No locale specified
```typescript
// Wrong
new Date(time).toLocaleTimeString();
// May show different format based on browser locale
```

### ✅ Correct
```typescript
new Date(time).toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});
// Consistent format across all browsers
```

### ❌ Mistake 3: Using date-fns without AM/PM
```typescript
// Wrong
import { format } from 'date-fns';
format(new Date(time), 'HH:mm');
// Shows: "09:30" (24-hour format)
```

### ✅ Correct
```typescript
import { format } from 'date-fns';
format(new Date(time), 'hh:mm a');
// Shows: "09:30 AM"
```

## Browser DevTools Check

### Console Test
```javascript
// Test in browser console
const testTime = new Date('2025-12-11T09:30:00Z');

// Should show "09:30 AM" (or equivalent based on timezone)
console.log(testTime.toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
}));
```

## Accessibility

### Screen Reader Friendly
```typescript
// Good: Screen reader announces "9:30 AM"
<time dateTime="09:30">
  {new Date(time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })}
</time>
```

### ARIA Labels
```typescript
// Good: Provides context
<span aria-label={`Exam starts at ${startTime}`}>
  {new Date(startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })}
</span>
```

## Performance Tips

### Memoization for Repeated Displays
```typescript
import { useMemo } from 'react';

const formattedTime = useMemo(() => {
  return new Date(time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}, [time]);
```

### Utility Function
```typescript
// Create a reusable function
export const formatTime12Hour = (time: string | Date) => {
  return new Date(time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Usage
<p>{formatTime12Hour(exam.start_time)}</p>
```

## Summary

### Key Points
1. ✅ Always use `hour12: true` option
2. ✅ Use `'en-US'` locale for consistency
3. ✅ Include AM/PM in all time displays
4. ✅ Test edge cases (midnight, noon)
5. ✅ Use timezone utilities for IST conversion

### Quick Checklist
- [ ] Added `hour12: true` to all time formatting
- [ ] Tested in browser (visual check)
- [ ] Verified AM/PM displays correctly
- [ ] Checked edge cases (12:00 AM/PM)
- [ ] Ran `npm run lint` (no errors)

---

**Last Updated**: 2025-12-11  
**Status**: ✅ Production Ready
