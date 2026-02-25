# File Upload Feature for Question Images

## Overview
Teachers can now upload images directly from their local drive in addition to using image URLs. This feature provides a seamless way to add visual content to questions without needing to host images externally.

## Features

### 1. Direct File Upload
- **Upload Button**: Click the "Upload" button next to the image URL field
- **File Selection**: Choose an image file from your local drive
- **Automatic Upload**: File is automatically uploaded to Supabase Storage
- **URL Population**: The public URL is automatically filled in the image URL field
- **Live Preview**: Uploaded image preview appears immediately

### 2. File Validation

#### File Type Validation
- **Allowed Formats**: JPEG, JPG, PNG, GIF, WebP
- **Error Message**: "Please upload an image file (JPEG, PNG, GIF, or WebP)"
- **Validation**: Checked before upload begins

#### File Size Validation
- **Maximum Size**: 1MB (1,048,576 bytes)
- **Error Message**: "Image must be smaller than 1MB. Please choose a smaller file."
- **Validation**: Checked before upload begins
- **Enforcement**: Also enforced at bucket level

#### Filename Validation
- **Restriction**: No Chinese characters allowed in filename
- **Error Message**: "Filename must not contain Chinese characters. Please rename the file."
- **Reason**: Ensures compatibility with storage system and URLs
- **Validation**: Checked before upload begins

### 3. Upload Process

#### Step-by-Step Flow
1. **Click Upload Button**: Opens file picker dialog
2. **Select File**: Choose image from local drive
3. **Validation**: File type, size, and filename are validated
4. **Upload**: File is uploaded to Supabase Storage
5. **URL Generation**: Public URL is generated automatically
6. **Form Update**: Image URL field is populated with the public URL
7. **Preview**: Image preview appears automatically
8. **Success Toast**: "Image uploaded successfully" notification

#### Upload States
- **Idle**: Button shows "Upload"
- **Uploading**: Button shows "Uploading..." and is disabled
- **Success**: Button returns to "Upload" state, URL is populated
- **Error**: Error toast is shown, button returns to "Upload" state

### 4. Storage Details

#### Supabase Storage Bucket
- **Bucket Name**: `app-85wc5xzx8yyp_question_images`
- **Public Access**: Yes (images can be viewed without authentication)
- **File Size Limit**: 1MB (enforced at bucket level)
- **Allowed MIME Types**: image/jpeg, image/jpg, image/png, image/gif, image/webp

#### File Naming
- **Format**: `{timestamp}-{random}.{extension}`
- **Example**: `1703001234567-abc123def.jpg`
- **Purpose**: Ensures unique filenames and prevents conflicts
- **No Collisions**: Random component prevents duplicate names

#### Storage Policies
- **Upload**: Authenticated users can upload images
- **View**: Public access (anyone can view images)
- **Update**: Authenticated users can update their own images
- **Delete**: Authenticated users can delete their own images

## Usage Guide

### Uploading an Image to a New Question

1. Click "Add Question" button
2. Fill in the required fields (Class, Subject, Question Text)
3. In the "Image/Clip Art (Optional)" section:
   - Click the "Upload" button
   - Select an image file from your computer
   - Wait for upload to complete (button shows "Uploading...")
   - Image URL is automatically filled
   - Preview appears below
4. Complete the rest of the form
5. Click "Add Question" to save

### Uploading an Image to an Existing Question

1. Click the edit icon (pencil) on any question
2. In the "Image/Clip Art (Optional)" section:
   - Click the "Upload" button
   - Select an image file from your computer
   - Wait for upload to complete
   - Image URL is automatically filled
   - Preview appears below
3. Click "Update Question" to save changes

### Using Both URL and Upload

You can use either method:
- **URL Input**: Paste an external image URL directly
- **File Upload**: Upload a file from your local drive
- **Switch Methods**: You can replace a URL with an uploaded file or vice versa

## Error Handling

### File Type Error
**Problem**: Selected file is not an image
**Error Message**: "Invalid File Type - Please upload an image file (JPEG, PNG, GIF, or WebP)"
**Solution**: Select a valid image file

### File Size Error
**Problem**: Selected file is larger than 1MB
**Error Message**: "File Too Large - Image must be smaller than 1MB. Please choose a smaller file."
**Solutions**:
1. Compress the image using an image editor
2. Reduce image dimensions
3. Convert to a more efficient format (e.g., WebP)
4. Choose a different image

### Filename Error
**Problem**: Filename contains Chinese characters
**Error Message**: "Invalid Filename - Filename must not contain Chinese characters. Please rename the file."
**Solution**: Rename the file to use only English letters, numbers, and basic symbols

### Upload Error
**Problem**: Upload fails due to network or server issues
**Error Message**: "Upload Failed - Failed to upload image. Please try again."
**Solutions**:
1. Check your internet connection
2. Try uploading again
3. Try a different image
4. Check if the file is corrupted

## Technical Details

### Frontend Implementation

#### File Input Component
```tsx
<input
  type="file"
  id="file-upload"
  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
  onChange={handleFileUpload}
  className="hidden"
  disabled={uploadingImage}
/>
```

#### Upload Button
```tsx
<Button
  type="button"
  variant="outline"
  onClick={() => document.getElementById('file-upload')?.click()}
  disabled={uploadingImage}
>
  <Upload className="w-4 h-4 mr-2" />
  {uploadingImage ? 'Uploading...' : 'Upload'}
</Button>
```

#### Upload Handler
```typescript
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    // Show error toast
    return;
  }

  // Validate file size (max 1MB)
  const maxSize = 1 * 1024 * 1024;
  if (file.size > maxSize) {
    // Show error toast
    return;
  }

  // Validate filename (no Chinese characters)
  const chineseRegex = /[\u4e00-\u9fa5]/;
  if (chineseRegex.test(file.name)) {
    // Show error toast
    return;
  }

  setUploadingImage(true);

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('app-85wc5xzx8yyp_question_images')
      .upload(fileName, file);

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('app-85wc5xzx8yyp_question_images')
      .getPublicUrl(data.path);

    // Update form data
    setFormData({ ...formData, image_url: urlData.publicUrl });

    // Show success toast
  } catch (error) {
    // Show error toast
  } finally {
    setUploadingImage(false);
  }
};
```

### Database Migration

#### Migration File: `00019_create_question_images_bucket.sql`
```sql
-- Create storage bucket for question images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-85wc5xzx8yyp_question_images',
  'app-85wc5xzx8yyp_question_images',
  true,
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for upload, view, update, delete
```

## Best Practices

### Image Preparation
1. **Optimize Before Upload**: Compress images before uploading to stay under 1MB
2. **Appropriate Dimensions**: Use images with reasonable dimensions (e.g., 800x600 or 1024x768)
3. **File Format**: Use JPEG for photos, PNG for graphics with transparency
4. **Filename**: Use descriptive English filenames (e.g., `cell-diagram.jpg`, `math-graph.png`)

### File Management
1. **Delete Unused Images**: Remove images that are no longer needed
2. **Reuse Images**: If the same image is used in multiple questions, upload once and copy the URL
3. **Backup Important Images**: Keep local copies of important images
4. **Test Before Saving**: Always check the preview before saving the question

### Performance
1. **Compress Images**: Use image compression tools to reduce file size
2. **Appropriate Quality**: Balance quality and file size
3. **Avoid Large Files**: Stay well under the 1MB limit for faster uploads
4. **Stable Connection**: Upload on a stable internet connection

## Comparison: URL vs Upload

| Feature | URL Input | File Upload |
|---------|-----------|-------------|
| **Source** | External URL | Local file |
| **Speed** | Instant | Depends on file size |
| **Storage** | External | Supabase Storage |
| **Control** | Limited | Full control |
| **Reliability** | Depends on external host | Reliable (Supabase) |
| **File Size** | No limit | Max 1MB |
| **Validation** | URL format only | Type, size, filename |
| **Best For** | Quick testing, external resources | Production use, permanent storage |

## Troubleshooting

### Upload Button Not Working
**Problem**: Clicking upload button does nothing
**Solutions**:
1. Check if you're logged in
2. Refresh the page
3. Check browser console for errors
4. Try a different browser

### Upload Stuck at "Uploading..."
**Problem**: Upload never completes
**Solutions**:
1. Check your internet connection
2. Wait a bit longer (large files take time)
3. Cancel and try again
4. Try a smaller file
5. Refresh the page

### Image Not Appearing After Upload
**Problem**: Upload succeeds but image doesn't show
**Solutions**:
1. Check if the URL was populated
2. Try refreshing the preview
3. Check browser console for errors
4. Try uploading again

### "Failed to Upload" Error
**Problem**: Generic upload failure
**Solutions**:
1. Check file format (must be image)
2. Check file size (must be under 1MB)
3. Check filename (no Chinese characters)
4. Check internet connection
5. Try again later

## Security Considerations

### Authentication
- **Upload Requires Login**: Only authenticated users can upload
- **Public Viewing**: Anyone can view uploaded images (for question display)
- **Owner Control**: Users can only update/delete their own uploads

### File Validation
- **Type Checking**: Only image files allowed
- **Size Limiting**: Maximum 1MB enforced
- **Filename Sanitization**: No special characters that could cause issues
- **MIME Type Validation**: Server-side validation of file types

### Storage Security
- **Bucket Isolation**: Images stored in dedicated bucket
- **Policy Enforcement**: Row Level Security policies control access
- **Public URLs**: Images accessible via public URLs (required for display)
- **No Sensitive Data**: Only educational images should be uploaded

## Future Enhancements

### Planned Features
1. **Image Editing**: Basic cropping and resizing before upload
2. **Drag & Drop**: Drag and drop files directly into the form
3. **Multiple Images**: Support for multiple images per question
4. **Image Library**: Browse and reuse previously uploaded images
5. **Bulk Upload**: Upload multiple images at once
6. **Progress Bar**: Visual progress indicator for large uploads
7. **Image Optimization**: Automatic compression and optimization
8. **Format Conversion**: Automatic conversion to optimal format

### Integration Possibilities
1. **AI Image Generation**: Generate diagrams using AI
2. **Image Search**: Search for educational images within the app
3. **Collaborative Library**: Share images across teachers
4. **Image Annotations**: Add labels and arrows to uploaded images
5. **Version History**: Track changes to uploaded images

## Summary

The file upload feature provides a convenient way for teachers to add images to questions without needing external hosting. With comprehensive validation, error handling, and a user-friendly interface, teachers can easily enhance their questions with visual content.

**Key Benefits**:
- ✅ Easy to use - just click and select
- ✅ Automatic upload and URL generation
- ✅ Comprehensive validation (type, size, filename)
- ✅ Live preview of uploaded images
- ✅ Reliable storage on Supabase
- ✅ Works alongside URL input method
- ✅ Secure with proper authentication
- ✅ Production-ready implementation

**Quick Start**:
1. Click "Upload" button
2. Select image file (under 1MB)
3. Wait for upload to complete
4. Preview appears automatically
5. Save your question!
