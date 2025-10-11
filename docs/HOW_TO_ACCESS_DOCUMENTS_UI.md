# How to Access the Documents UI

## Quick Start

The document upload interface is now accessible from any project detail page!

### Step-by-Step Guide

1. **Start the development server** (with Netlify Blobs support):

   ```bash
   netlify dev
   ```

2. **Navigate to Projects**:
   - Go to `http://localhost:3000/projects`
   - Click on any project to view its details

3. **Access Documents**:
   - On the project detail page, look for the **"Documents"** button in the top right
   - Click **"Documents"** to go to the document management page

4. **Upload Files**:
   - Drag and drop files onto the upload zone
   - OR click "Browse" to select files
   - OR on mobile, click the camera icon to take a photo

### Direct URL Access

You can also navigate directly to the documents page:

```
http://localhost:3000/projects/[project-id]/documents
```

Replace `[project-id]` with your actual project ID.

## UI Components Structure

```
Project Detail Page (/projects/[id])
  └─ [Documents Button] → Documents Page (/projects/[id]/documents)
                             └─ DocumentsSection
                                 └─ FileUpload Component
```

### Documents Page Features

✅ **Upload Section** (Working):

- Drag-and-drop file upload
- Click-to-browse file selection
- Mobile camera capture
- File type validation (images, PDFs, documents)
- File size validation (10MB limit)
- Upload progress indication
- Error handling with toast notifications

⏳ **Document List** (Coming in Story 3.2):

- Thumbnail view
- Download functionality
- Delete functionality

## Screenshot of UI Flow

### 1. Project Detail Page

```
┌─────────────────────────────────────────┐
│  ← Back to Projects                     │
│                                          │
│  Project Name              [Active]     │
│                  [Documents] [Edit] [Delete]
│                                          │
│  Project Details...                     │
└─────────────────────────────────────────┘
```

### 2. Documents Page

```
┌─────────────────────────────────────────┐
│  ← Back to Project Name                 │
│                                          │
│  Documents                              │
│  Upload and manage documents            │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ Upload Documents                 │   │
│  ├─────────────────────────────────┤   │
│  │                                  │   │
│  │   Drag & Drop Files Here        │   │
│  │   or click to browse            │   │
│  │                                  │   │
│  │   [Browse] [📷 Camera (mobile)] │   │
│  │                                  │   │
│  └─────────────────────────────────┘   │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ Documents                        │   │
│  ├─────────────────────────────────┤   │
│  │ Document list and thumbnail view │   │
│  │ will be added in Story 3.2       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## File Upload Component

The `FileUpload` component is fully functional with:

### Accepted File Types

- **Images**: JPG, PNG, WebP, HEIC
- **Documents**: PDF, DOCX, XLSX
- **Max Size**: 10MB per file

### Features

- ✅ Multiple file selection
- ✅ Drag and drop support
- ✅ Click to browse
- ✅ Mobile camera capture
- ✅ Client-side validation
- ✅ Upload progress bar
- ✅ Cancel upload
- ✅ Error messages
- ✅ Success notifications

## Testing the Upload

1. **Start with Netlify Blobs**:

   ```bash
   netlify dev
   ```

2. **Navigate to a project's documents page**

3. **Try these test scenarios**:

   **Valid Upload**:
   - Upload a JPG image (< 10MB)
   - Upload a PDF document (< 10MB)
   - Upload multiple files at once

   **Validation Tests**:
   - Try uploading a file > 10MB (should show error)
   - Try uploading .txt or .exe file (should show error)

   **Upload Progress**:
   - Upload a larger file (5-10MB) to see progress bar
   - Try canceling mid-upload

## Netlify Blobs Storage

Uploaded files are stored in:

**Production**: Global Netlify Blobs store (permanent)
**Development**: Deploy-scoped store in `.netlify/blobs/` (temporary)

## Troubleshooting

### Error: "Netlify Blobs is not configured"

**Cause**: Running `npm run dev` instead of `netlify dev`

**Solution**:

```bash
# Stop current server
# Run with Netlify CLI
netlify dev
```

### Document Upload Fails

**Check**:

1. File size < 10MB
2. File type is supported (JPG, PNG, WebP, PDF, DOCX, XLSX)
3. Running with `netlify dev`
4. Check browser console for errors

### Can't Find Documents Button

**Verify**:

1. You're on a project detail page (`/projects/[id]`)
2. Button is in the top right, next to "Edit" button
3. Try refreshing the page

## Next Steps (Story 3.2)

The documents page is currently upload-only. Story 3.2 will add:

- 📸 Document thumbnail generation for images
- 📄 Document list/grid view
- ⬇️ Download functionality
- 🗑️ Delete functionality
- 🔍 Search and filter
- 🏷️ Category filtering

## Related Documentation

- [Netlify Blobs Configuration](./netlify-blobs-configuration.md)
- [Local Development Guide](./local-development-with-netlify.md)
- [Story 3.1 Documentation](./stories/3.1.story.md)
- [Quick Reference](../NETLIFY_BLOBS_README.md)

---

**Status**: ✅ **Document Upload UI is Live!**

Navigate to any project → Click "Documents" button → Start uploading files!
