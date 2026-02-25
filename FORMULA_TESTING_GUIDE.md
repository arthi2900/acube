# Formula Feature - Testing Guide

## Quick Test Steps

### Test 1: Insert a Simple Formula
1. **Login as Teacher**
2. **Go to Question Bank** (sidebar menu)
3. **Click "Add Question"**
4. **In the Question Text editor**:
   - Click the **"Insert Formula"** button (∫ icon)
   - In the dialog, click on the **"Quadratic Formula"** example
   - The formula `$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$` will be inserted
   - Click **"Insert Formula"** button
5. **Click "Show Preview"** button (eye icon)
   - You should see the quadratic formula rendered beautifully with proper fraction and square root
6. **Complete the question** and save

### Test 2: Create the Velocity Formula (Your Use Case)
1. **In Question Text editor**, click **"Insert Formula"**
2. **Type or paste**:
   ```
   v_0 = \sqrt{5gR + \frac{2qER}{m} + \frac{2W}{m}}
   ```
3. **Watch the live preview** in the dialog - you'll see the formula render in real-time
4. **Click "Insert Formula"**
5. **Click "Show Preview"** - verify the square root extends over all terms
6. **Save the question**

### Test 3: Formula in MCQ Options
1. **Create a new MCQ question**
2. **In Option A**, type some text and click **"Insert Formula"**
3. **Insert**: `$E = mc^2$`
4. **Click "Show Preview"** - verify the formula renders
5. **Repeat for other options** with different formulas
6. **Save the question**

### Test 4: View Formula in Exam
1. **Create an exam** with the questions containing formulas
2. **Schedule the exam** for now
3. **Login as Student**
4. **Take the exam**
5. **Verify**: All formulas render beautifully with extended square roots, proper fractions, etc.

### Test 5: View Formula in Results
1. **Submit the exam** (as student)
2. **Login as Teacher** and grade the exam (if needed)
3. **Login as Student** and view results
4. **Verify**: All formulas still render correctly in the results view

## Expected Results

### ✅ What You Should See:

#### In the Editor (Raw Mode):
```
Question: Find the velocity $v_0 = \sqrt{5gR + \frac{2qER}{m}}$
```

#### In the Preview Panel:
The formula renders with:
- Extended square root covering all terms
- Proper fractions with horizontal bars
- Subscripts and superscripts in correct positions
- Professional mathematical typography

#### In the Exam View:
Students see beautifully rendered formulas, not raw LaTeX code.

#### In the Results View:
Same beautiful rendering as in the exam view.

### ❌ What You Should NOT See:

1. **Raw LaTeX code in exam/results**: `$\sqrt{x}$` should render, not show as text
2. **Unicode symbols**: `√` should not be used - use LaTeX `\sqrt{}`
3. **Broken square roots**: Square root should extend over all terms, not just the first character
4. **Plain text fractions**: `2/3` should be `$\frac{2}{3}$` for proper notation

## Troubleshooting During Testing

### Issue: "I don't see the Insert Formula button"
**Check**: 
- You're in a text editor (Question Text, Option fields)
- The toolbar should show: [Insert Formula ∫] [Symbols ∑] [Show Preview 👁]

### Issue: "Formula shows as plain text in preview"
**Check**:
1. Formula is wrapped in `$...$` delimiters
2. Open browser console (F12) and check for errors
3. Verify LaTeX syntax is correct

### Issue: "Preview button doesn't show anything"
**Check**:
1. You have some content in the editor
2. Click the button again to toggle
3. The preview panel should appear below the editor

### Issue: "Formula renders in preview but not in exam"
**Check**:
1. Save the question after inserting the formula
2. Refresh the exam page
3. Check browser console for errors
4. Verify the question was added to the exam

## Console Debugging

If formulas aren't working, open browser console (F12) and look for:

### Expected Console Messages:
```
Inserting formula: $\sqrt{x^2 + y^2}$
Editor content after insert: Question text with formula...
```

### Error Messages to Watch For:
```
KaTeX rendering error: [error details] Formula: \sqrt{x
```
This means there's a syntax error in your LaTeX.

### Common Errors:
1. **Unmatched braces**: `\sqrt{x` (missing `}`)
2. **Invalid command**: `\squareroot{x}` (should be `\sqrt{x}`)
3. **Missing delimiters**: `\sqrt{x}` without `$...$`

## Advanced Testing

### Test Complex Formulas:
1. **Integral**: `$\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$`
2. **Matrix**: `$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$`
3. **Summation**: `$\sum_{i=1}^{n} i^2 = \frac{n(n+1)(2n+1)}{6}$`
4. **Limit**: `$\lim_{x \to \infty} \frac{1}{x} = 0$`

### Test Edge Cases:
1. **Multiple formulas in one question**: Mix text and formulas
2. **Formula at start of text**: `$E=mc^2$ is Einstein's equation`
3. **Formula at end of text**: `Einstein's equation is $E=mc^2$`
4. **Only formula, no text**: Just `$\sqrt{x^2 + y^2}$`

## Performance Testing

### Large Exams:
1. Create an exam with 50 questions, each containing 2-3 formulas
2. Take the exam as a student
3. Verify: All formulas render quickly without lag
4. Check: Page load time is reasonable

### Complex Formulas:
1. Create questions with very complex formulas (nested fractions, multiple integrals)
2. Verify: They render correctly
3. Check: No browser freezing or slowdown

## Success Criteria

✅ **All tests pass** if:
1. Formulas insert correctly from the dialog
2. Preview shows rendered formulas
3. Formulas save to database
4. Formulas render in exam view
5. Formulas render in results view
6. No console errors (except for intentionally invalid LaTeX)
7. Performance is acceptable
8. User experience is smooth and intuitive

## Reporting Issues

If you find any issues during testing:

1. **Note the exact steps** to reproduce
2. **Check browser console** (F12) for errors
3. **Take a screenshot** of the issue
4. **Note the formula** that's causing the problem
5. **Check the LaTeX syntax** - is it valid?

## Next Steps After Testing

Once testing is complete and successful:
1. ✅ Train teachers on using the formula feature
2. ✅ Share the FORMULA_GUIDE.md with teachers
3. ✅ Create sample questions with formulas
4. ✅ Build a question bank with common formulas
5. ✅ Monitor for any issues in production use
