# Time Picker - Tab Navigation Guide

## Quick Reference

### Tab Navigation Flow
```
┌─────────────────────────────────────────────────────────┐
│  🕐 Enter Time                                          │
│                                                         │
│  ┌──────┐   ┌──────┐   ┌──────┐                       │
│  │  09  │ : │  30  │   │ AM ▼ │                       │
│  └──────┘   └──────┘   └──────┘                       │
│    [1]        [2]        [3]                           │
│                                                         │
│  Use Tab to navigate between fields                    │
├─────────────────────────────────────────────────────────┤
│   Hour    │   Minute   │   Period                      │
│    07     │     28     │                                │
│    08     │     29     │                                │
│  ► 09  ◄  │  ► 30  ◄   │  ► AM ◄                       │
│    10     │     31     │                                │
│    11     │     32     │     PM                         │
│    [4]        [5]        [6]                           │
└─────────────────────────────────────────────────────────┘

Tab Order: [1] → [2] → [3] → [4] → [5] → [6]
```

## Keyboard Navigation

### Tab Key (Forward)
```
Press Tab:
  Hour Input [1]
    ↓ Tab
  Minute Input [2]
    ↓ Tab
  Period Select [3]
    ↓ Tab
  Hour Scroll Pad [4]
    ↓ Tab
  Minute Scroll Pad [5]
    ↓ Tab
  Period Buttons [6]
```

### Shift+Tab (Backward)
```
Press Shift+Tab:
  Period Buttons [6]
    ↑ Shift+Tab
  Minute Scroll Pad [5]
    ↑ Shift+Tab
  Hour Scroll Pad [4]
    ↑ Shift+Tab
  Period Select [3]
    ↑ Shift+Tab
  Minute Input [2]
    ↑ Shift+Tab
  Hour Input [1]
```

## Usage Examples

### Example 1: Pure Keyboard Entry
```
1. Click "Select time" button (or press Enter when focused)
2. Type "9" in Hour input
3. Press Tab → moves to Minute input
4. Type "30" in Minute input
5. Press Tab → moves to Period select
6. Press Arrow Down → selects PM
7. Press Escape or click outside → closes popover
   Result: 09:30 PM selected
```

### Example 2: Mixed Input (Type + Scroll)
```
1. Click "Select time" button
2. Type "11" in Hour input
3. Press Tab → moves to Minute input
4. Press Tab again → skip to Period select
5. Click on scroll pad to select minute "45"
6. Minute input automatically shows "45"
   Result: 11:45 AM selected
```

### Example 3: Quick Hour Entry
```
1. Click "Select time" button
2. Type "2" in Hour input
3. Press Enter → jumps directly to Minute input
4. Type "15"
5. Press Enter → applies time
   Result: 02:15 AM selected
```

### Example 4: Navigate to Scroll Pads
```
1. Click "Select time" button
2. Press Tab → Hour input
3. Press Tab → Minute input
4. Press Tab → Period select
5. Press Tab → Hour scroll pad (first button focused)
6. Use Arrow keys to navigate scroll pad
7. Press Enter to select
```

## Keyboard Shortcuts Summary

| Key | Context | Action |
|-----|---------|--------|
| **Tab** | Any field | Move to next field |
| **Shift+Tab** | Any field | Move to previous field |
| **Enter** | Hour input | Jump to Minute input |
| **Enter** | Minute input | Apply time and blur |
| **Enter** | Period select | Confirm selection |
| **Enter** | Scroll pad button | Select value |
| **Arrow Up/Down** | Period select | Navigate options |
| **Arrow Up/Down** | Scroll pad | Navigate values |
| **Escape** | Popover open | Close popover |
| **0-9** | Hour/Minute input | Type digit |

## Field-Specific Behavior

### Hour Input [1]
- **Focus**: Auto-selects existing value
- **Type**: Only accepts digits 0-9
- **Max Length**: 2 characters
- **Valid Range**: 1-12
- **Tab**: Moves to Minute input
- **Enter**: Jumps to Minute input
- **Auto-format**: "9" → "09" on blur

### Minute Input [2]
- **Focus**: Auto-selects existing value
- **Type**: Only accepts digits 0-9
- **Max Length**: 2 characters
- **Valid Range**: 0-59
- **Tab**: Moves to Period select
- **Enter**: Applies time and blurs
- **Auto-format**: "5" → "05" on blur

### Period Select [3]
- **Focus**: Shows dropdown indicator
- **Click**: Opens dropdown menu
- **Arrow Keys**: Navigate AM/PM
- **Enter/Space**: Select option
- **Tab**: Moves to Hour scroll pad
- **Options**: AM, PM

### Hour Scroll Pad [4]
- **Focus**: First button or selected hour
- **Arrow Keys**: Navigate up/down
- **Enter/Space**: Select hour
- **Click**: Select hour
- **Tab**: Moves to Minute scroll pad

### Minute Scroll Pad [5]
- **Focus**: First button or selected minute
- **Arrow Keys**: Navigate up/down
- **Enter/Space**: Select minute
- **Click**: Select minute
- **Tab**: Moves to Period buttons

### Period Buttons [6]
- **Focus**: AM or PM button
- **Arrow Keys**: Toggle between AM/PM
- **Enter/Space**: Select period
- **Click**: Select period
- **Tab**: Cycles back to Hour input

## Accessibility Features

### Screen Reader Announcements
```
Hour Input:
  "Hour, text input, 2 characters maximum, 09"

Minute Input:
  "Minute, text input, 2 characters maximum, 30"

Period Select:
  "Period, dropdown, AM selected"

Helper Text:
  "Use Tab to navigate between fields"
```

### Focus Indicators
- **Visible Focus Ring**: Blue outline on focused element
- **High Contrast**: Works in high contrast mode
- **Keyboard Only**: Focus visible only for keyboard users

### ARIA Labels
- All inputs have proper labels
- Scroll pads have role="button"
- Popover has role="dialog"
- Helper text linked with aria-describedby

## Tips for Users

### For Fast Entry
1. Use Tab to move between fields quickly
2. Use Enter in Hour input to skip directly to Minute
3. Type single digits (auto-formats on blur)
4. Use Arrow keys in Period select (faster than clicking)

### For Precise Selection
1. Type approximate time in inputs
2. Use scroll pads for fine-tuning
3. Both methods stay synchronized
4. Visual feedback in scroll pads

### For Accessibility
1. Full keyboard navigation support
2. No mouse required
3. Screen reader friendly
4. Clear focus indicators

## Common Issues & Solutions

### Issue: Tab doesn't move to next field
**Solution**: Make sure you're inside the popover. Click "Select time" first.

### Issue: Can't type in Hour/Minute input
**Solution**: Click directly in the input field to focus it.

### Issue: Enter key closes popover
**Solution**: Use Enter in Hour input (jumps to Minute) or Minute input (applies time). Use Escape to close popover.

### Issue: Scroll pads don't update when typing
**Solution**: Type valid values (Hour: 1-12, Minute: 0-59). Invalid values are ignored.

### Issue: Can't navigate to scroll pads with Tab
**Solution**: Tab through all three input fields first (Hour → Minute → Period), then Tab will reach scroll pads.

## Browser Support

| Browser | Tab Navigation | Enter Shortcuts | Arrow Keys | Focus Indicators |
|---------|----------------|-----------------|------------|------------------|
| Chrome | ✅ | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ | ✅ |
| Safari | ✅ | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ | ✅ |
| Mobile Safari | ✅ | ✅ | ⚠️ (touch) | ✅ |
| Mobile Chrome | ✅ | ✅ | ⚠️ (touch) | ✅ |

⚠️ = Limited support (touch devices use on-screen keyboard)

## Testing Checklist

### ✅ Tab Navigation
- [ ] Tab moves from Hour to Minute
- [ ] Tab moves from Minute to Period
- [ ] Tab moves from Period to scroll pads
- [ ] Shift+Tab moves backward
- [ ] Tab order is logical and consistent

### ✅ Enter Key Shortcuts
- [ ] Enter in Hour jumps to Minute
- [ ] Enter in Minute applies time
- [ ] Enter in Period confirms selection
- [ ] Enter in scroll pad selects value

### ✅ Focus Management
- [ ] Focus indicators are visible
- [ ] Focus doesn't get trapped
- [ ] Focus returns to trigger button on close
- [ ] Focus order is predictable

### ✅ Keyboard-Only Usage
- [ ] Can open popover with keyboard
- [ ] Can navigate all fields with keyboard
- [ ] Can select time without mouse
- [ ] Can close popover with keyboard

---

**Last Updated**: 2025-12-11  
**Component**: `src/components/ui/time-picker.tsx`  
**Accessibility**: WCAG 2.1 AA Compliant
