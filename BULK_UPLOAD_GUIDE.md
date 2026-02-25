# Question Bank Bulk Upload Guide

## Overview
The bulk upload feature allows teachers to upload multiple questions at once using an Excel template. The template includes dropdown menus to prevent input errors and ensure data consistency.

## Template Structure (3 Sheets)

The Excel template contains three sheets, each serving a specific purpose:

### 1. **Questions Sheet** (Your Work Area)
- **Purpose**: This is where you enter your questions
- **Content**: Empty sheet with only column headers
- **Features**: All dropdown fields are pre-configured with data validation
- **Usage**: Simply click on a cell to see the dropdown arrow and select values

### 2. **Options Sheet** (Reference Data)
- **Purpose**: Contains all available values for dropdown menus
- **Content**: Lists of classes, subjects, lessons, question types, and difficulty levels
- **Important**: Do NOT modify or delete this sheet - it's used for dropdown validation

### 3. **Reference Sheet** (Examples)
- **Purpose**: Provides sample questions for guidance
- **Content**: 5 example questions demonstrating each question type
- **Usage**: Use as a reference when creating your own questions

## Dropdown Fields

The Questions sheet includes dropdown menus for the following fields:
- **Class Name**: Select from available classes in your system
- **Subject Name**: Select from available subjects in your system
- **Lesson Name**: Select from available lessons (optional)
- **Question Type**: Choose from 5 question types
  - `mcq` - Multiple Choice Questions
  - `true_false` - True/False Questions
  - `short_answer` - Short Answer Questions
  - `match_following` - Match the Following
  - `multiple_response` - Multiple Response Questions
- **Difficulty**: Choose from 3 difficulty levels
  - `easy`
  - `medium`
  - `hard`

## How to Use

### Step 1: Download the Template
1. Click the **"Bulk Upload"** button in the Question Bank page
2. Click **"Download Template"** button
3. The file `question_bank_template.xlsx` will be downloaded

### Step 2: Open and Review the Template
1. Open the downloaded Excel file
2. Review the **"Reference"** sheet to see example questions
3. Check the **"Options"** sheet to see all available dropdown values
4. Go to the **"Questions"** sheet to start entering your questions

### Step 3: Fill in Your Questions
1. In the **"Questions"** sheet, start from row 2 (row 1 has headers)
2. For each question row:
   - **Question Text**: Type your question
   - **Class Name**: Click the cell and select from dropdown ⬇️
   - **Subject Name**: Click the cell and select from dropdown ⬇️
   - **Lesson Name**: (Optional) Click the cell and select from dropdown ⬇️
   - **Question Type**: Click the cell and select from dropdown ⬇️
   - **Difficulty**: Click the cell and select from dropdown ⬇️
   - **Marks**: Enter the marks for the question
   - **Negative Marks**: Enter negative marks (0 for no negative marking)
   - Fill in type-specific fields (see below)

### Step 4: Type-Specific Fields

#### For MCQ Questions
- Fill **Option A**, **Option B**, **Option C**, **Option D**
- Enter the correct answer text in **Correct Answer** (e.g., "Paris")

#### For True/False Questions
- Leave options blank
- Enter **"True"** or **"False"** in **Correct Answer**

#### For Short Answer Questions
- Leave options blank
- Enter sample/expected answer in **Correct Answer**

#### For Match Following Questions
- Leave options blank
- Fill **Match Left 1-4** and **Match Right 1-4** with pairs
- Leave **Correct Answer** blank

#### For Multiple Response Questions
- Fill **Option A**, **Option B**, **Option C**, **Option D**
- Enter correct answer letters in **Correct Answer** (e.g., "A,C")
- Fill **Answer Option 1-4** with answer choices (e.g., "A and C only")

### Step 5: Upload the File
1. Click **"Choose File"** or drag and drop your filled Excel file
2. The system will validate all questions
3. If there are errors, they will be displayed with row numbers
4. Fix any errors and upload again
5. Once validated, questions will be uploaded automatically

## Validation Rules

The system validates:
- ✅ All required fields are filled
- ✅ Class and Subject names exist in the system
- ✅ Question type is valid
- ✅ Difficulty level is valid
- ✅ Marks are greater than 0
- ✅ Type-specific requirements (e.g., MCQ has options)

## Tips for Success

1. **Use Dropdown Menus**: Always use the dropdown menus instead of typing manually to avoid spelling errors
2. **Check the Reference Sheet**: Review the "Reference" sheet to see examples of each question type
3. **Don't Modify Options Sheet**: The "Options" sheet is used for validation - don't delete or modify it
4. **Start Small**: Test with a few questions first before uploading a large batch
5. **Keep Template Format**: Don't modify column headers or sheet names
6. **One File, All Types**: You can mix different question types in the same file
7. **Work in Questions Sheet**: Only enter data in the "Questions" sheet

## Error Prevention

The dropdown menus prevent common errors:
- ❌ Typos in class names (e.g., "Class 10" vs "Class10")
- ❌ Typos in subject names (e.g., "Mathematics" vs "Maths")
- ❌ Invalid question types (e.g., "multiple_choice" instead of "mcq")
- ❌ Invalid difficulty levels (e.g., "normal" instead of "medium")

## Example Questions in Reference Sheet

The Reference sheet includes 5 sample questions demonstrating each question type:
1. **MCQ**: "What is the capital of France?" - Shows how to fill options and correct answer
2. **True/False**: "The Earth revolves around the Sun." - Shows True/False format
3. **Short Answer**: "Explain the process of photosynthesis." - Shows descriptive answer format
4. **Match Following**: "Match countries with capitals" - Shows how to use Match Left/Right columns
5. **Multiple Response**: "Which are prime numbers?" - Shows multiple correct answers format

## Troubleshooting

### "No Data Available" Error
- **Cause**: No classes or subjects exist in the system
- **Solution**: Create classes and subjects first before downloading the template

### "Class not found in system" Error
- **Cause**: The class name doesn't match any existing class
- **Solution**: Use the dropdown menu to select the class name from the Questions sheet

### "Subject not found in system" Error
- **Cause**: The subject name doesn't match any existing subject
- **Solution**: Use the dropdown menu to select the subject name from the Questions sheet

### Dropdown Not Showing
- **Cause**: Excel file might be corrupted or opened in incompatible software
- **Solution**: Download the template again and open in Microsoft Excel or compatible software

### "Options Sheet Missing" Error
- **Cause**: The Options sheet was deleted or renamed
- **Solution**: Download a fresh template - do not modify sheet names

## Best Practices

1. **Before Starting**:
   - Review all three sheets to understand the structure
   - Check the Reference sheet for examples
   - Verify the Options sheet has your classes and subjects

2. **While Working**:
   - Always use dropdown menus for validated fields
   - Keep the Questions sheet clean and organized
   - Don't delete or modify the Options or Reference sheets

3. **Before Uploading**:
   - Double-check all required fields are filled
   - Verify question-type-specific fields are correct
   - Test with a small batch first

4. **After Upload**:
   - Review validation errors if any
   - Fix errors in the Excel file and re-upload
   - Verify questions appear correctly in the system

## Support

If you encounter any issues:
1. Check the validation error messages - they include row numbers and specific issues
2. Verify that all dropdown selections are from the provided options
3. Ensure the "Options" sheet is not deleted or modified
4. Review the "Reference" sheet for correct formatting examples
5. Try downloading a fresh template if dropdowns are not working
