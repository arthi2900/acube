# A Cube - Visual Design Guide

## Color Palette

### Primary Colors
```
Primary (Purple-Blue):   hsl(250 80% 60%)  #8B5CF6 → #6366F1
Secondary (Deep Blue):   hsl(220 90% 55%)  #3B82F6 → #2563EB
Accent (Purple):         hsl(260 75% 65%)  #A78BFA → #8B5CF6
```

### Background Colors
```
Light Mode Background:   hsl(0 0% 100%)    #FFFFFF
Dark Mode Background:    hsl(240 60% 8%)   #0A0A1A
Dark Mode Card:          hsl(240 50% 12%)  #141428
```

### Semantic Colors
```
Success:  hsl(142 76% 36%)  #22C55E
Warning:  hsl(38 92% 50%)   #F59E0B
Error:    hsl(0 84% 60%)    #EF4444
```

## Typography Scale

### Headings
```
Hero Title:      text-5xl md:text-7xl  (48px → 72px)
Section Title:   text-3xl md:text-4xl  (30px → 36px)
Card Title:      text-xl               (20px)
Subtitle:        text-2xl md:text-3xl  (24px → 30px)
```

### Body Text
```
Large:   text-xl    (20px)
Base:    text-base  (16px)
Small:   text-sm    (14px)
Tiny:    text-xs    (12px)
```

## Spacing System

### Padding
```
Section:     py-16 px-6    (64px vertical, 24px horizontal)
Card:        p-8           (32px all sides)
Hero:        py-20 px-6    (80px vertical, 24px horizontal)
```

### Gaps
```
Large:   gap-8   (32px)
Medium:  gap-6   (24px)
Small:   gap-4   (16px)
Tiny:    gap-2   (8px)
```

## Border Radius

### Sizes
```
Default:  rounded      (0.25rem / 4px)
Medium:   rounded-lg   (0.5rem / 8px)
Large:    rounded-xl   (0.75rem / 12px)
XLarge:   rounded-2xl  (1rem / 16px)
Full:     rounded-full (9999px)
```

### Component Radius
```
Cards:       1rem (16px)
Buttons:     1rem (16px)
Logo:        0.5rem (8px)
Icons:       0.5rem (8px)
```

## Shadow System

### Elegant Shadows
```css
.elegant-shadow {
  box-shadow: 0 10px 30px -10px hsl(250 80% 60% / 0.3),
              0 0 20px hsl(250 80% 60% / 0.1);
}

.elegant-shadow-lg {
  box-shadow: 0 20px 50px -15px hsl(250 80% 60% / 0.4),
              0 0 30px hsl(250 80% 60% / 0.15);
}
```

### Glow Effects
```css
.glow-primary {
  box-shadow: 0 0 20px hsl(250 80% 60% / 0.4),
              0 0 40px hsl(250 80% 60% / 0.2);
}

.glow-secondary {
  box-shadow: 0 0 20px hsl(220 90% 55% / 0.4),
              0 0 40px hsl(220 90% 55% / 0.2);
}

.glow-accent {
  box-shadow: 0 0 20px hsl(260 75% 65% / 0.4),
              0 0 40px hsl(260 75% 65% / 0.2);
}
```

## Gradient Patterns

### Background Gradients
```css
/* Hero Gradient */
.gradient-hero {
  background: linear-gradient(135deg,
    hsl(240 60% 8%),
    hsl(250 70% 15%),
    hsl(220 80% 20%)
  );
}

/* Purple-Blue Gradient */
.gradient-purple-blue {
  background: linear-gradient(135deg,
    hsl(250 80% 60%),
    hsl(220 90% 55%)
  );
}
```

### Text Gradients
```css
.smooth-gradient-text {
  background: linear-gradient(135deg,
    hsl(250 80% 60%),
    hsl(220 90% 55%),
    hsl(260 75% 65%)
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## Glassmorphism

### Glass Card
```css
.glass-card {
  background: linear-gradient(135deg,
    hsl(250 80% 60% / 0.1),
    hsl(220 90% 55% / 0.05)
  );
  backdrop-filter: blur(20px);
  border: 1px solid hsl(250 80% 60% / 0.2);
  box-shadow: 0 8px 32px 0 hsl(250 80% 60% / 0.15);
}
```

### Hover Effects
```css
.glass-card-hover:hover {
  background: linear-gradient(135deg,
    hsl(250 80% 60% / 0.15),
    hsl(220 90% 55% / 0.1)
  );
  box-shadow: 0 12px 40px 0 hsl(250 80% 60% / 0.25);
  transform: translateY(-4px);
}
```

## Component Styles

### Buttons

**Primary Button:**
```tsx
<Button className="bg-primary hover:bg-primary/90 glow-primary">
  Click Me
</Button>
```

**Outline Button:**
```tsx
<Button variant="outline" className="glass-card text-white border-white/30 hover:bg-white/10">
  Click Me
</Button>
```

**Large Button:**
```tsx
<Button size="lg" className="glow-primary text-lg px-8 py-6">
  Get Started
</Button>
```

### Cards

**Glassmorphism Card:**
```tsx
<Card className="glass-card glass-card-hover border-primary/20">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

**Stat Card:**
```tsx
<Card className="glass-card elegant-shadow text-center p-8 border-primary/20">
  <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
  <div className="text-4xl font-bold text-primary mb-2">1200+</div>
  <div className="text-lg text-muted-foreground">Students</div>
</Card>
```

### Icons

**Logo Icon:**
```tsx
<div className="w-10 h-10 gradient-purple-blue rounded-lg flex items-center justify-center glow-primary">
  <Box className="w-6 h-6 text-white" />
</div>
```

**Feature Icon:**
```tsx
<div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center glow-primary">
  <Zap className="w-8 h-8 text-primary" />
</div>
```

## Layout Patterns

### Hero Section
```tsx
<section className="gradient-hero py-20 px-6 relative overflow-hidden">
  <div className="max-w-6xl mx-auto text-center space-y-6 relative z-10">
    <h1 className="text-5xl md:text-7xl font-bold text-white">
      A Cube – Online Exam System
    </h1>
    <p className="text-2xl md:text-3xl text-white/90">
      Smart • Secure • Scalable Online Exams
    </p>
  </div>
</section>
```

### Feature Grid
```tsx
<section className="py-16 px-6 bg-background">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 smooth-gradient-text">
      Features
    </h2>
    <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
      {/* Cards */}
    </div>
  </div>
</section>
```

### Stats Section
```tsx
<section className="py-16 px-6 bg-background">
  <div className="max-w-7xl mx-auto">
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {/* Stat Cards */}
    </div>
  </div>
</section>
```

## Animation & Transitions

### Hover Transitions
```css
transition: all 0.3s ease;
```

### Transform Effects
```css
transform: translateY(-4px);  /* Lift on hover */
```

### Smooth Transitions
```css
transition-property: all;
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
transition-duration: 300ms;
```

## Responsive Breakpoints

```
sm:   640px   (Small devices)
md:   768px   (Medium devices)
lg:   1024px  (Large devices)
xl:   1280px  (Extra large devices)
2xl:  1536px  (2X Extra large devices)
```

### Usage Examples
```tsx
// Mobile-first approach
<div className="text-base md:text-lg lg:text-xl">
  Responsive Text
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  Responsive Grid
</div>
```

## Accessibility Guidelines

### Color Contrast
- Text on white: Minimum 4.5:1 ratio
- Text on gradients: Use white or very light colors
- Interactive elements: Clear focus states

### Focus States
```css
focus:ring-2 focus:ring-primary focus:ring-offset-2
```

### Touch Targets
- Minimum size: 44x44px
- Adequate spacing between elements
- Clear hover/active states

## Best Practices

### Do's ✅
- Use semantic color tokens (bg-primary, text-foreground)
- Apply glassmorphism to cards and overlays
- Use glow effects on interactive elements
- Maintain consistent spacing
- Use gradient text for headings
- Apply elegant shadows to elevated elements

### Don'ts ❌
- Don't use direct color values (bg-blue-500)
- Don't overuse glow effects
- Don't mix different shadow styles
- Don't forget responsive design
- Don't ignore accessibility
- Don't use too many gradients

## Quick Reference

### Common Class Combinations

**Hero Title:**
```
text-5xl md:text-7xl font-bold text-white tracking-tight
```

**Section Title:**
```
text-3xl md:text-4xl font-bold text-center mb-12 smooth-gradient-text
```

**Glass Card:**
```
glass-card glass-card-hover border-primary/20 elegant-shadow
```

**Primary Button:**
```
bg-primary hover:bg-primary/90 glow-primary text-lg px-8 py-6
```

**Logo Container:**
```
w-10 h-10 gradient-purple-blue rounded-lg flex items-center justify-center glow-primary
```

---

**Design System**: A Cube EdTech
**Version**: 2.0.0
**Last Updated**: 2025-12-26
**Status**: Production Ready
