# Enhanced Time Picker - Quick Reference

## Import
```tsx
import { TimePickerEnhanced } from '@/components/ui/time-picker-enhanced';
```

## Basic Usage
```tsx
const [time, setTime] = useState('09:00 AM');

<TimePickerEnhanced
  label="Select Time"
  value={time}
  onChange={setTime}
/>
```

## Props Quick Reference

| Prop | Type | Example |
|------|------|---------|
| `value` | `string` | `"09:30 AM"` or `"14:30"` |
| `onChange` | `function` | `(time) => setTime(time)` |
| `label` | `string` | `"Start Time"` |
| `use24Hour` | `boolean` | `true` or `false` |
| `className` | `string` | `"max-w-md"` |

## Examples

### 12-Hour Format (Default)
```tsx
<TimePickerEnhanced
  label="Exam Time"
  value="09:30 AM"
  onChange={setTime}
/>
```

### 24-Hour Format
```tsx
<TimePickerEnhanced
  label="Meeting Time"
  value="14:30"
  onChange={setTime}
  use24Hour={true}
/>
```

### In a Form
```tsx
<form onSubmit={handleSubmit}>
  <TimePickerEnhanced
    label="Start Time"
    value={formData.startTime}
    onChange={(time) => setFormData({ ...formData, startTime: time })}
  />
  <Button type="submit">Submit</Button>
</form>
```

## Input Methods

### Type Time
- Click input field
- Type: `930` → Auto-formats to `09:30 AM`
- Type: `930p` → Auto-formats to `09:30 PM`

### Scroll Pads
- Scroll or click hours (01-12 or 00-23)
- Scroll or click minutes (00-59)
- Scroll or click period (AM/PM)

## Demo
Visit `/time-picker-demo` to try it live!

## Common Patterns

### With Validation
```tsx
const [time, setTime] = useState('09:00 AM');
const [error, setError] = useState('');

const handleTimeChange = (newTime: string) => {
  setTime(newTime);
  // Add your validation logic
  if (/* invalid */) {
    setError('Invalid time');
  } else {
    setError('');
  }
};

<TimePickerEnhanced
  value={time}
  onChange={handleTimeChange}
/>
{error && <p className="text-destructive">{error}</p>}
```

### Start and End Time
```tsx
const [startTime, setStartTime] = useState('09:00 AM');
const [endTime, setEndTime] = useState('11:00 AM');

<TimePickerEnhanced label="Start" value={startTime} onChange={setStartTime} />
<TimePickerEnhanced label="End" value={endTime} onChange={setEndTime} />
```

## Tips
✅ Always provide a default value  
✅ Use controlled component pattern  
✅ Match format with `use24Hour` prop  
✅ Include a label for accessibility  
✅ Validate time ranges in your logic  

## Troubleshooting
❌ Time not updating? → Add `onChange` handler  
❌ Format error? → Check `use24Hour` matches value format  
❌ Scroll not working? → Ensure component has proper height  
