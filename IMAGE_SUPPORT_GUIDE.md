# Image/Clip Art Support for Questions

## Overview
Teachers can now add images and clip art to questions in the Question Bank, making questions more engaging and suitable for visual learning. This feature works seamlessly in both Row View and Card View.

## Features

### 1. Image URL Input
- **Location**: Available in both "Add Question" and "Edit Question" dialogs
- **Field**: Optional text input for image URL
- **Supports**: 
  - External image URLs (e.g., https://example.com/image.jpg)
  - Supabase Storage URLs (for future file upload integration)
  - Any publicly accessible image URL

### 2. Live Image Preview
- **Real-time Preview**: As you type the URL, the image preview updates automatically
- **Error Handling**: If the URL is invalid or image fails to load, an error message is displayed
- **Size Constraints**: Preview images are limited to a maximum height of 192px (12rem) to maintain dialog usability

### 3. Image Display in Views

#### Row View (Table)
- Images appear below the question text
- Thumbnail size: Maximum width 128px, maximum height 80px
- Maintains aspect ratio with object-contain
- Rounded corners with border for visual clarity

#### Card View (Grid)
- Images appear below the question title within the card header
- Responsive width: Full card width
- Maximum height: 160px (10rem)
- Background color: Muted background for better visibility
- Rounded corners with border

### 4. Edit Functionality
- When editing a question, the existing image URL is loaded into the form
- Teachers can:
  - Update the image URL to change the image
  - Clear the URL to remove the image
  - Keep the existing image unchanged

## Usage Guide

### Adding an Image to a New Question

1. Click the "Add Question" button
2. Fill in the required fields (Class, Subject, Question Text, etc.)
3. In the "Image/Clip Art (Optional)" field, paste the image URL
4. Preview the image to ensure it loads correctly
5. If the image doesn't load, check the URL and try again
6. Complete the rest of the form and click "Add Question"

### Adding an Image to an Existing Question

1. Click the edit icon (pencil) on any question
2. Scroll to the "Image/Clip Art (Optional)" field
3. Paste the image URL or modify the existing URL
4. Preview the image to ensure it loads correctly
5. Click "Update Question" to save changes

### Removing an Image

1. Edit the question
2. Clear the "Image/Clip Art (Optional)" field completely
3. Click "Update Question" to save changes

## Use Cases

### Science Questions
- Add diagrams of scientific processes
- Include labeled illustrations of anatomy
- Show experimental setups
- Display chemical structures

### Mathematics
- Include geometric figures
- Show graphs and charts
- Display number lines
- Add visual representations of word problems

### Language Learning
- Add pictures for vocabulary questions
- Include cultural images
- Show scenes for comprehension questions
- Display visual prompts for writing exercises

### General Education
- Add historical photographs
- Include maps and geographical images
- Show artwork for art history questions
- Display infographics for data interpretation

## Technical Details

### Database Schema
- **Table**: `questions`
- **Column**: `image_url` (text, nullable)
- **Migration**: `00018_add_question_images.sql`

### TypeScript Interface
```typescript
export interface Question {
  id: string;
  subject_id: string;
  lesson_id: string | null;
  question_text: string;
  question_type: QuestionType;
  options: string[] | MatchPair[] | null;
  correct_answer: string;
  marks: number;
  difficulty: DifficultyLevel;
  bank_name: string | null;
  image_url: string | null;  // New field
  created_by: string | null;
  created_at: string;
}
```

### Image Validation
- **Client-side**: 
  - Real-time preview with error handling
  - onError event hides broken images
  - onLoad event shows successful images
- **Server-side**: 
  - Accepts any valid text string
  - Trims whitespace
  - Converts empty strings to null

### Performance Considerations
- Images are loaded lazily by the browser
- Failed images don't break the UI (hidden automatically)
- Thumbnail sizes in Row View minimize bandwidth usage
- Object-contain ensures images don't distort

## Best Practices

### Image URL Selection
1. **Use Reliable Hosts**: Choose image hosting services with high uptime
2. **Check Accessibility**: Ensure images are publicly accessible (no authentication required)
3. **Optimize Size**: Use appropriately sized images (not too large)
4. **Use HTTPS**: Prefer secure URLs for better compatibility

### Image Quality
1. **Resolution**: Use images with sufficient resolution for clarity
2. **Aspect Ratio**: Consider how images will display in both views
3. **File Format**: PNG, JPG, GIF, and WebP are all supported
4. **File Size**: Keep images reasonably sized for faster loading

### Accessibility
1. **Alt Text**: The system automatically provides "Question" as alt text
2. **Contrast**: Ensure images are visible against the background
3. **Clarity**: Use clear, high-contrast images for better readability

## Future Enhancements

### Planned Features
1. **File Upload**: Direct file upload to Supabase Storage
2. **Image Library**: Built-in clip art and diagram library
3. **Image Editor**: Basic cropping and resizing tools
4. **Multiple Images**: Support for multiple images per question
5. **Image Annotations**: Add labels and arrows to images
6. **Drag & Drop**: Drag and drop image upload

### Integration Possibilities
1. **AI Image Generation**: Generate diagrams using AI
2. **Image Search**: Search for educational images within the app
3. **Image Templates**: Pre-designed templates for common question types
4. **Collaborative Library**: Share images across teachers

## Troubleshooting

### Image Not Displaying
**Problem**: Image URL is entered but image doesn't show
**Solutions**:
1. Check if the URL is correct and accessible
2. Ensure the URL starts with http:// or https://
3. Verify the image file exists at the URL
4. Try opening the URL in a new browser tab
5. Check if the hosting service allows hotlinking

### Image Too Large/Small
**Problem**: Image appears too large or too small
**Solutions**:
1. The system automatically constrains image sizes
2. In Row View: Max 128px wide, 80px tall
3. In Card View: Full width, max 160px tall
4. Images maintain aspect ratio automatically

### Preview Shows Error
**Problem**: "Failed to load image" message appears
**Solutions**:
1. Verify the URL is correct
2. Check if the image requires authentication
3. Ensure the image format is supported
4. Try a different image URL
5. Check your internet connection

## Examples

### Example 1: Science Diagram
```
Question: Label the parts of the human heart shown in the diagram.
Image URL: https://example.com/heart-diagram.jpg
Type: Short Answer
```

### Example 2: Math Graph
```
Question: What is the slope of the line shown in the graph?
Image URL: https://example.com/linear-graph.png
Type: Multiple Choice
Options: A) 2, B) -2, C) 1/2, D) -1/2
```

### Example 3: Language Learning
```
Question: What is this object called in English?
Image URL: https://example.com/vocabulary/apple.jpg
Type: Short Answer
```

## Summary

The image support feature enhances the Question Bank by allowing teachers to create more engaging, visual questions. With support for both Row and Card views, live previews, and easy editing, teachers can quickly add visual elements to their questions without any technical complexity.

**Key Benefits**:
- ✅ Easy to use - just paste a URL
- ✅ Live preview - see images before saving
- ✅ Works in both views - consistent experience
- ✅ Fully editable - change or remove images anytime
- ✅ Error handling - graceful fallback for broken images
- ✅ Responsive design - looks good on all screen sizes
