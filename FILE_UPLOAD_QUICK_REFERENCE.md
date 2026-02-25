# Quick Reference: File Upload for Question Images

## 🚀 Quick Start (3 Steps)

### Method 1: Upload from Local Drive
1. **Click Upload Button** → Opens file picker
2. **Select Image File** → Choose from your computer (under 1MB)
3. **Wait for Upload** → Image URL is automatically filled and preview appears

### Method 2: Use Image URL
1. **Paste URL** → Enter image URL in the text field
2. **Preview Appears** → Image preview shows automatically
3. **Save Question** → URL is saved with the question

---

## 📋 File Requirements

### ✅ Allowed File Types
- **JPEG/JPG** - Best for photos
- **PNG** - Best for graphics with transparency
- **GIF** - For simple animations
- **WebP** - Modern format, good compression

### ❌ Not Allowed
- PDF, Word documents
- Videos (MP4, AVI, etc.)
- Text files
- Other non-image formats

### 📏 File Size
- **Maximum**: 1MB (1,048,576 bytes)
- **Recommended**: 200-500 KB for best balance
- **Tip**: Compress images before uploading

### 📝 Filename Rules
- **Allowed**: English letters, numbers, hyphens, underscores
- **Not Allowed**: Chinese characters, special symbols
- **Examples**:
  - ✅ `cell-diagram.jpg`
  - ✅ `math_graph_01.png`
  - ❌ `细胞图.jpg`
  - ❌ `my photo!@#.jpg`

---

## 💡 Common Tasks

### Upload a New Image
```
1. Click "Add Question" or edit existing question
2. Find "Image/Clip Art (Optional)" section
3. Click [Upload] button
4. Select image file (under 1MB)
5. Wait for "Image uploaded successfully" message
6. Preview appears automatically
7. Continue with rest of form
8. Click "Add Question" or "Update Question"
```

### Replace an Existing Image
```
1. Edit the question
2. Click [Upload] button
3. Select new image file
4. New image replaces old one
5. Click "Update Question"
```

### Remove an Image
```
1. Edit the question
2. Clear the image URL field completely
3. Click "Update Question"
```

### Switch from URL to Upload
```
1. Edit the question
2. Click [Upload] button
3. Select image file
4. Uploaded image URL replaces the old URL
5. Click "Update Question"
```

---

## ⚠️ Error Messages & Solutions

### "Invalid File Type"
**Problem**: Selected file is not an image
**Solution**: Choose a JPEG, PNG, GIF, or WebP file

### "File Too Large"
**Problem**: File is larger than 1MB
**Solutions**:
- Compress the image using online tools (TinyPNG, Compressor.io)
- Reduce image dimensions in an image editor
- Convert to WebP format for better compression
- Choose a different, smaller image

### "Invalid Filename"
**Problem**: Filename contains Chinese characters
**Solution**: Rename the file using only English characters
- Before: `细胞图.jpg`
- After: `cell-diagram.jpg`

### "Upload Failed"
**Problem**: Upload didn't complete
**Solutions**:
- Check your internet connection
- Try uploading again
- Try a different image
- Refresh the page and try again

---

## 🎯 Best Practices

### Before Uploading
1. **Compress Images**: Use tools to reduce file size
2. **Rename Files**: Use descriptive English names
3. **Check Quality**: Ensure image is clear and readable
4. **Test Size**: Make sure file is under 1MB

### Image Preparation Tools

#### Online Tools (Free)
- **TinyPNG** - PNG/JPEG compression
- **Compressor.io** - Multi-format compression
- **Squoosh** - Advanced compression options

#### Desktop Tools
- **Windows**: Paint (Save with lower quality)
- **Mac**: Preview (Export with reduced quality)
- **Cross-platform**: GIMP, Paint.NET

### Compression Tips
```
Original: 2.5 MB → Too large ❌
↓ Reduce dimensions (1920x1080 → 1024x768)
1.2 MB → Still too large ❌
↓ Compress with TinyPNG
600 KB → Perfect! ✅
```

---

## 📊 File Size Guide

### Recommended Sizes by Content Type

**Simple Diagrams** (50-200 KB)
- Line drawings
- Simple charts
- Icons and symbols
- Black and white images

**Standard Photos** (200-500 KB)
- Classroom photos
- Product images
- Compressed photos
- Most educational content

**Detailed Images** (500 KB - 1 MB)
- High-quality photos
- Complex diagrams
- Detailed illustrations
- Multiple elements

**Too Large** (> 1 MB)
- Uncompressed photos
- Very high resolution
- RAW image files
- → Compress before uploading!

---

## 🔄 Upload vs URL Comparison

| Feature | File Upload | URL Input |
|---------|-------------|-----------|
| **Speed** | 2-5 seconds | Instant |
| **Size Limit** | Max 1MB | No limit |
| **Storage** | Supabase | External |
| **Reliability** | Very High | Depends on host |
| **Control** | Full | Limited |
| **Best For** | Production | Testing |

### When to Use File Upload
- ✅ Permanent questions
- ✅ Important content
- ✅ Production environment
- ✅ Full control needed
- ✅ Reliable storage required

### When to Use URL Input
- ✅ Quick testing
- ✅ External resources
- ✅ Temporary content
- ✅ Large files (> 1MB)
- ✅ Already hosted images

---

## 🎓 Example Workflows

### Workflow 1: Creating Science Question with Diagram
```
1. Click "Add Question"
2. Select Class: "Class 10"
3. Select Subject: "Biology"
4. Enter Question: "Label the parts of this cell"
5. Click [Upload] button
6. Select file: "cell-diagram.jpg" (450 KB)
7. Wait 2 seconds for upload
8. ✅ Preview appears
9. Select Type: "Short Answer"
10. Set Marks: 5
11. Click "Add Question"
12. ✅ Question saved with image!
```

### Workflow 2: Batch Upload Multiple Questions
```
1. Prepare all images in advance:
   - Compress to under 1MB
   - Rename with English names
   - Organize in a folder

2. For each question:
   - Click "Add Question"
   - Fill in details
   - Upload image
   - Save question

3. Class and Subject stay selected
4. Quick to add multiple questions
```

### Workflow 3: Updating Existing Question Image
```
1. Find question in list
2. Click edit icon (✏️)
3. Click [Upload] button
4. Select new image file
5. New image replaces old one
6. Preview updates automatically
7. Click "Update Question"
8. ✅ Image updated!
```

---

## 🛡️ Security & Privacy

### What's Secure
- ✅ Login required to upload
- ✅ Files stored in dedicated bucket
- ✅ Unique filenames prevent conflicts
- ✅ File type validation
- ✅ File size limits enforced

### What's Public
- ⚠️ Uploaded images are publicly viewable
- ⚠️ Anyone with the URL can see the image
- ⚠️ Images appear in questions for all users

### Best Practices
- ✅ Only upload educational content
- ✅ Don't upload personal photos
- ✅ Don't upload sensitive information
- ✅ Use appropriate, school-safe images
- ✅ Respect copyright and licensing

---

## 📱 Mobile Usage

### Mobile Upload Steps
```
1. Tap "Add Question"
2. Scroll to "Image/Clip Art"
3. Tap [Upload] button
4. Choose source:
   - Take Photo (camera)
   - Choose from Gallery
   - Browse Files
5. Select or capture image
6. Wait for upload
7. Preview appears
8. Continue with form
9. Tap "Add Question"
```

### Mobile Tips
- 📷 Take photos directly with camera
- 🖼️ Choose from photo gallery
- 📁 Access files from cloud storage
- ⚡ Works same as desktop
- 📱 Responsive design

---

## ⚡ Quick Troubleshooting

### Upload Button Not Working
1. Check if you're logged in
2. Refresh the page
3. Try a different browser
4. Clear browser cache

### Upload Stuck at "Uploading..."
1. Check internet connection
2. Wait a bit longer (large files take time)
3. Cancel and try again
4. Try a smaller file

### Image Not Showing After Upload
1. Check if URL was populated
2. Refresh the preview
3. Check browser console for errors
4. Try uploading again

### "Failed to Upload" Error
1. Check file format (must be image)
2. Check file size (must be under 1MB)
3. Check filename (no Chinese characters)
4. Check internet connection
5. Try again later

---

## 📞 Quick Help

### Common Questions

**Q: Can I upload multiple images?**
A: Currently one image per question. Multiple images feature coming soon!

**Q: Where are uploaded images stored?**
A: In Supabase Storage, a secure cloud storage service.

**Q: Can I delete uploaded images?**
A: Yes, remove the image URL from the question to delete the reference.

**Q: What if I need larger than 1MB?**
A: Compress the image or use URL input for external hosting.

**Q: Can students upload images?**
A: No, only teachers can upload images to questions.

**Q: Are uploaded images backed up?**
A: Yes, Supabase Storage includes automatic backups.

---

## ✅ Success Checklist

Before uploading:
- [ ] Image is under 1MB
- [ ] File format is JPEG, PNG, GIF, or WebP
- [ ] Filename uses only English characters
- [ ] Image is clear and readable
- [ ] Content is appropriate for education
- [ ] You're logged in as a teacher

After uploading:
- [ ] "Image uploaded successfully" message appeared
- [ ] Image URL is filled in the field
- [ ] Preview shows the correct image
- [ ] Image looks good in preview
- [ ] Ready to save the question

---

## 🎉 You're Ready!

**Quick Recap:**
1. ✅ Click [Upload] button
2. ✅ Select image file (under 1MB)
3. ✅ Wait for upload to complete
4. ✅ Preview appears automatically
5. ✅ Save your question!

**Remember:**
- Maximum file size: 1MB
- Allowed formats: JPEG, PNG, GIF, WebP
- Filename: English characters only
- Compress images before uploading
- Check preview before saving

**Happy Teaching! 🎓**
