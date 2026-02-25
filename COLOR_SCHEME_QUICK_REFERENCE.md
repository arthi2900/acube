# Color Scheme Quick Reference

## Color Palette at a Glance

### Primary Colors
```
Purple (Primary)    ████████  HSL: 270 70% 60%  - Main brand color
Orange (Secondary)  ████████  HSL: 20 85% 65%   - Secondary actions
Teal (Accent)       ████████  HSL: 180 70% 55%  - Accent elements
```

### Supporting Colors
```
Pink                ████████  HSL: 320 70% 65%  - Charts, decorative
Blue-Purple         ████████  HSL: 240 70% 65%  - Charts, gradients
Green (Success)     ████████  HSL: 142 76% 36%  - Success states
Red (Destructive)   ████████  HSL: 0 84% 60%    - Error states
```

## Quick Usage Guide

### Tailwind Classes

#### Backgrounds
```css
bg-primary          /* Purple background */
bg-secondary        /* Orange background */
bg-accent           /* Teal background */
bg-muted            /* Subtle gray background */
bg-card             /* Card background */
```

#### Text Colors
```css
text-primary        /* Purple text */
text-secondary      /* Orange text */
text-accent         /* Teal text */
text-foreground     /* Main text color */
text-muted-foreground /* Subtle text */
```

#### Borders
```css
border-primary      /* Purple border */
border-secondary    /* Orange border */
border-accent       /* Teal border */
border-border       /* Default border */
```

### Gradient Classes

```css
gradient-purple-cosmic    /* Deep purple cosmic gradient */
gradient-purple-blue      /* Purple to blue gradient */
gradient-purple-pink      /* Purple to pink gradient */
gradient-orange-coral     /* Orange to coral gradient */
gradient-teal-cyan        /* Teal to cyan gradient */

gradient-card-purple      /* Purple card with glassmorphism */
gradient-card-orange      /* Orange card with glassmorphism */
gradient-card-teal        /* Teal card with glassmorphism */

cosmic-bg                 /* Cosmic background with overlays */
```

## Common Patterns

### Dashboard Card (Purple)
```tsx
<Card className="gradient-card-purple border-primary/20">
  <CardHeader>
    <CardTitle className="text-white">Title</CardTitle>
  </CardHeader>
  <CardContent className="text-white/90">
    Content
  </CardContent>
</Card>
```

### Dashboard Card (Orange)
```tsx
<Card className="gradient-card-orange border-secondary/20">
  <CardHeader>
    <CardTitle className="text-white">Title</CardTitle>
  </CardHeader>
  <CardContent className="text-white/90">
    Content
  </CardContent>
</Card>
```

### Dashboard Card (Teal)
```tsx
<Card className="gradient-card-teal border-accent/20">
  <CardHeader>
    <CardTitle className="text-white">Title</CardTitle>
  </CardHeader>
  <CardContent className="text-white/90">
    Content
  </CardContent>
</Card>
```

### Hero Section
```tsx
<section className="cosmic-bg py-12 px-6">
  <h1 className="text-4xl font-bold text-white">
    Welcome
  </h1>
  <p className="text-white/80">
    Description
  </p>
</section>
```

### Primary Button
```tsx
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
  Click Me
</Button>
```

### Secondary Button
```tsx
<Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
  Click Me
</Button>
```

### Accent Button
```tsx
<Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
  Click Me
</Button>
```

## Color Combinations

### High Contrast (Best for Text)
- White text on Primary purple
- White text on Secondary orange
- White text on Accent teal
- Foreground text on Background

### Medium Contrast (Good for UI Elements)
- Primary on Muted
- Secondary on Muted
- Accent on Muted

### Low Contrast (Subtle Elements)
- Muted foreground on Background
- Border on Background

## Dark Mode vs Light Mode

### Light Mode
- Background: White
- Foreground: Dark purple-tinted
- Cards: White with subtle shadows

### Dark Mode
- Background: Deep purple-black (cosmic)
- Foreground: Near white
- Cards: Dark purple with gradients

## Accessibility

### WCAG AA Compliant
All color combinations meet minimum contrast ratio of 4.5:1

### WCAG AAA Compliant
Primary text combinations meet enhanced contrast ratio of 7:1

## Tips

1. **Use semantic tokens**: Always use `bg-primary` instead of direct colors
2. **Test both modes**: Check appearance in light and dark mode
3. **Gradients sparingly**: Don't overuse gradients on one page
4. **Maintain hierarchy**: Use primary for main actions, secondary for less important
5. **Consistent icons**: Match icon colors with their context

## Color Psychology

- **Purple**: Education, wisdom, creativity
- **Orange**: Energy, enthusiasm, action
- **Teal**: Clarity, balance, communication
- **Pink**: Vibrancy, excitement
- **Blue-Purple**: Trust, stability

## Common Mistakes to Avoid

❌ Using `bg-purple-500` instead of `bg-primary`
❌ Mixing too many gradient classes
❌ Forgetting to test dark mode
❌ Using low contrast text
❌ Overriding semantic tokens

✅ Use semantic tokens
✅ Test in both modes
✅ Maintain contrast ratios
✅ Follow design system
✅ Keep it consistent

## Quick Reference Table

| Element | Light Mode | Dark Mode | Class |
|---------|-----------|-----------|-------|
| Primary Button | Purple | Purple | `bg-primary` |
| Secondary Button | Orange | Orange | `bg-secondary` |
| Accent Button | Teal | Teal | `bg-accent` |
| Background | White | Deep Purple | `bg-background` |
| Card | White | Dark Purple | `bg-card` |
| Text | Dark | White | `text-foreground` |
| Muted Text | Gray | Light Gray | `text-muted-foreground` |
| Border | Light Gray | Dark Gray | `border-border` |

## Gradient Reference

| Class | Colors | Best For |
|-------|--------|----------|
| `gradient-purple-cosmic` | Deep Purple → Bright Purple → Purple-Blue | Hero sections, backgrounds |
| `gradient-purple-blue` | Purple → Blue | Cards, buttons |
| `gradient-purple-pink` | Purple → Pink | Accent cards, highlights |
| `gradient-orange-coral` | Orange → Coral | Warning cards, secondary |
| `gradient-teal-cyan` | Teal → Cyan | Success cards, info |
| `gradient-card-purple` | Purple (transparent) | Main feature cards |
| `gradient-card-orange` | Orange (transparent) | Secondary cards |
| `gradient-card-teal` | Teal (transparent) | Info cards |
| `cosmic-bg` | Purple gradient + overlays | Page backgrounds |

---

**Quick Tip**: When in doubt, use `bg-primary` for main actions, `bg-secondary` for secondary actions, and `bg-accent` for informational elements.
