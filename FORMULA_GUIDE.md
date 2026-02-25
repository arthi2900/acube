# Mathematical Formula Support - User Guide

## Overview
The Online Exam Management System now supports **LaTeX mathematical formulas** for creating complex equations with proper mathematical notation, including extended square roots, fractions, integrals, and more.

## Quick Start

### See Your Formulas Rendered
1. After inserting a formula, click the **"Show Preview"** button (eye icon) in the toolbar
2. The preview panel will show exactly how your formulas will appear to students
3. This helps you verify that formulas are correct before saving

## Two Ways to Add Math Content

### 1. **Insert Formula** Button (For Complex Equations)
Use this for formulas that require proper mathematical notation like extended square roots.

#### How to Use:
1. Click the **"Insert Formula"** button (∫ icon) above the text editor
2. A dialog will open with:
   - **LaTeX Input Field**: Enter your formula code
   - **Live Preview**: See how your formula will look
   - **Common Examples**: Click any example to use it
   - **Quick Reference**: LaTeX syntax guide

#### Example: Creating Extended Square Root
To create: v₀ = √(5gR + 2qER/m + 2W/m)

**LaTeX Code:**
```latex
v_0 = \sqrt{5gR + \frac{2qER}{m} + \frac{2W}{m}}
```

**Steps:**
1. Click "Insert Formula"
2. Type or paste the LaTeX code above
3. See the preview update in real-time
4. Click "Insert Formula" button to add it to your text

### 2. **Symbols** Button (For Quick Characters)
Use this for single mathematical symbols like ÷, ×, √, π, etc.

#### How to Use:
1. Click the **"Symbols"** button (∑ icon)
2. Browse categories:
   - Arithmetic Operations (÷, ×, ±, √, ∛, ∜, ∞)
   - Comparison & Relations (≠, ≈, ≤, ≥)
   - Algebra (∑, ∏, ∫, ∂)
   - Geometry (°, ∠, ⊥, ∥, △)
   - Greek Letters (α, β, γ, π, θ, ω)
   - Physics (℃, ℉, Å)
   - Chemistry (⇌, →, ↑, ↓)
   - Fractions (½, ⅓, ¼, ¾)
   - Superscripts (⁰¹²³⁴⁵⁶⁷⁸⁹)
   - Subscripts (₀₁₂₃₄₅₆₇₈₉)
3. Click any symbol to insert it at cursor position

## Common LaTeX Formulas

### Square Roots
```latex
\sqrt{x}                    → √x
\sqrt{x^2 + y^2}           → √(x² + y²)
\sqrt{5gR + \frac{2W}{m}}  → √(5gR + 2W/m)
```

### Fractions
```latex
\frac{a}{b}                → a/b (as proper fraction)
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}  → Quadratic formula
```

### Subscripts and Superscripts
```latex
x_0                        → x₀
x^2                        → x²
x_{subscript}              → x with subscript
x^{superscript}            → x with superscript
```

### Greek Letters
```latex
\alpha, \beta, \gamma      → α, β, γ
\pi, \theta, \omega        → π, θ, ω
\Delta, \Sigma, \Omega     → Δ, Σ, Ω
```

### Operators
```latex
\sum_{i=1}^{n}             → Summation from i=1 to n
\int_{a}^{b}               → Integral from a to b
\prod_{i=1}^{n}            → Product from i=1 to n
```

### Relations
```latex
\leq, \geq                 → ≤, ≥
\neq, \approx              → ≠, ≈
\times, \div, \pm          → ×, ÷, ±
```

## Complete Example

### Question Text:
"Calculate the escape velocity using the formula:"

### Formula (using Insert Formula):
```latex
v_0 = \sqrt{5gR + \frac{2qER}{m} + \frac{2W}{m}}
```

### Result:
The formula will render beautifully with:
- Extended square root covering all terms
- Proper fractions with horizontal bars
- Subscripts (v₀)
- Professional mathematical typography

## Tips for Best Results

1. **Use Insert Formula for:**
   - Extended square roots over multiple terms
   - Fractions with numerator and denominator
   - Complex equations with multiple operators
   - Summations, integrals, products
   - Any formula requiring proper mathematical layout

2. **Use Symbols for:**
   - Single characters (√, ÷, ×, π)
   - Quick insertion without typing LaTeX
   - Simple subscripts/superscripts (₀, ²)

3. **Preview Before Inserting:**
   - Always check the preview in the formula dialog
   - Ensure the formula looks correct before inserting
   - Use examples as templates for similar formulas

4. **Common Mistakes to Avoid:**
   - ❌ Using √ symbol alone: √5gR+2W/m (only covers first character)
   - ✅ Using LaTeX: $\sqrt{5gR+2W/m}$ (covers entire expression)
   
   - ❌ Using / for fractions: 2qER/m (looks like inline text)
   - ✅ Using LaTeX: $\frac{2qER}{m}$ (proper fraction notation)

## Where Formulas Work

Mathematical formulas are supported in:
- ✅ Question text
- ✅ MCQ options
- ✅ Multiple response options
- ✅ True/False questions
- ✅ Short answer questions
- ✅ All text editing areas

Formulas will automatically render correctly when:
- Students take exams
- Viewing exam results
- Previewing question papers
- Reviewing question bank

## Troubleshooting

### "I inserted a formula but don't see it rendered in the editor"
**Solution**: This is normal! The editor shows the raw LaTeX code (e.g., `$\sqrt{x}$`). To see how it will look:
1. Click the **"Show Preview"** button (eye icon) in the toolbar
2. The preview panel below will show the rendered formula
3. When students take the exam, they will see the beautifully rendered formula

### "The formula appears as plain text like $\sqrt{x}$ instead of a square root"
**Possible causes**:
1. **Missing $ delimiters**: Ensure your formula is wrapped in `$...$`
   - ✅ Correct: `$\sqrt{x^2 + y^2}$`
   - ❌ Wrong: `\sqrt{x^2 + y^2}` (missing $ signs)

2. **Check the preview**: Click "Show Preview" to verify the formula renders correctly

3. **Browser console**: Open browser developer tools (F12) and check for any KaTeX errors

### "The square root only covers the first character"
**Solution**: You're using the Unicode √ symbol instead of LaTeX. Use the **Insert Formula** button:
- ❌ Wrong: `√5gR+2W/m` (Unicode symbol)
- ✅ Correct: `$\sqrt{5gR+2W/m}$` (LaTeX formula)

### "How do I edit a formula I already inserted?"
1. In the editor, you'll see the formula as text: `$\sqrt{x}$`
2. Simply edit the text directly
3. Click "Show Preview" to see the updated rendering
4. Or click "Insert Formula" to create a new formula and replace the old one

### "The preview shows an error in red"
**Solution**: There's a syntax error in your LaTeX code. Common issues:
- Unmatched braces: `\sqrt{x` (missing closing `}`)
- Invalid commands: `\squareroot{x}` (should be `\sqrt{x}`)
- Check the Quick Reference in the Formula Dialog for correct syntax

## Need Help?

### Quick Reference in Dialog
The formula dialog includes a built-in quick reference with common LaTeX syntax.

### Common Examples Provided
Click any example in the dialog to see the LaTeX code and use it as a template.

### LaTeX Resources
For advanced formulas, search online for "LaTeX math symbols" or "LaTeX equations" for comprehensive guides.
