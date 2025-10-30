# Document Upload Enhancement Wireframes

**Component:** Document Upload & Management
**Priority:** P1
**Affects:** `/projects/[id]/documents`, Mobile & Desktop
**Goal:** Streamline document upload with progress indicators, camera capture, and batch upload

---

## Current State Issues

1. **No upload progress indicator** - Users don't know if upload is working
2. **No mobile camera capture** - Must use file picker (clunky)
3. **No batch upload** - Must upload files one at a time
4. **No drag-and-drop visual feedback** - Unclear if zone is ready
5. **File validation happens after upload** - Wastes time on invalid files

---

## Proposed Solution: Enhanced Upload Experience

### Desktop: Drag & Drop Zone

```
┌──────────────────────────────────────────────────────────────┐
│ Documents (12)                          [Upload] [Filters ▾] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ╔════════════════════════════════════════════════════════╗ │
│  ║                                                        ║ │
│  ║              📤                                        ║ │
│  ║                                                        ║ │
│  ║        Drag files here to upload                      ║ │
│  ║        or click to browse                             ║ │
│  ║                                                        ║ │
│  ║        Supports: PDF, JPG, PNG, HEIC                  ║ │
│  ║        Max file size: 10 MB each                      ║ │
│  ║                                                        ║ │
│  ╚════════════════════════════════════════════════════════╝ │
│                                                              │
│  Recent Documents                                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ [Image]    │  │ [Image]    │  │ [PDF icon] │            │
│  │ Floor Plan │  │ Invoice    │  │ Contract   │            │
│  │ 2 days ago │  │ 1 week ago │  │ 2 weeks    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Features:**

- Large, prominent drag-and-drop zone
- Clear supported file types and size limits
- Hover state shows blue border + background
- Click zone opens file picker dialog
- Shows recent documents below

---

### Desktop: Drag Active State

When user drags files over the zone:

```
┌──────────────────────────────────────────────────────────────┐
│  ╔════════════════════════════════════════════════════════╗ │
│  ║  🎯                                                    ║ │
│  ║                                                        ║ │
│  ║                                                        ║ │
│  ║              Drop files to upload                     ║ │
│  ║                                                        ║ │
│  ║                                                        ║ │
│  ║                                                        ║ │
│  ╚════════════════════════════════════════════════════════╝ │
└──────────────────────────────────────────────────────────────┘
```

**Visual Changes:**

- Background changes to light blue (`bg-blue-50`)
- Border thickens and becomes primary blue (`border-primary border-2`)
- Icon changes to target (🎯)
- Text changes to "Drop files to upload"
- Slight scale animation (`scale-105`)

---

### Desktop: Upload Progress

When files are uploading:

```
┌──────────────────────────────────────────────────────────────┐
│ Uploading Documents...                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✓ Floor_Plan_2024.pdf (2.3 MB)          Uploaded           │
│  ────────────────────────────────── 100%                     │
│                                                              │
│  ⏳ Invoice_ABC_Plumbing.pdf (1.8 MB)    Uploading...       │
│  ███████████████──────────────────── 65%                    │
│                                                              │
│  ⏳ Site_Photo_001.jpg (4.2 MB)          Waiting...          │
│  ────────────────────────────────── 0%                       │
│                                                              │
│  ⏳ Site_Photo_002.jpg (3.9 MB)          Waiting...          │
│  ────────────────────────────────── 0%                       │
│                                                              │
│  Uploading 4 files... 2 of 4 complete                       │
│  [Cancel All]                                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Features:**

- Show all files in queue
- Individual progress bars with percentage
- Status indicators (✓ Uploaded, ⏳ Uploading, ⏳ Waiting)
- File name and size displayed
- Overall progress summary
- Cancel all button

---

### Desktop: Upload Complete with Categorization

After upload completes:

```
┌──────────────────────────────────────────────────────────────┐
│ ✓ 4 Documents Uploaded Successfully                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Add categories to organize your documents:                  │
│                                                              │
│  Floor_Plan_2024.pdf                                         │
│  Category: [Plans & Drawings         ▾]                      │
│                                                              │
│  Invoice_ABC_Plumbing.pdf                                    │
│  Category: [Invoices & Receipts      ▾]                      │
│                                                              │
│  Site_Photo_001.jpg                                          │
│  Category: [Progress Photos          ▾]                      │
│                                                              │
│  Site_Photo_002.jpg                                          │
│  Category: [Progress Photos          ▾]                      │
│                                                              │
│                [Skip]              [Save Categories]          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Features:**

- Success message at top
- Each file has category dropdown
- Smart defaults based on file name/type
- Can skip categorization (do later)
- Batch save all categories at once

---

## Mobile: Camera Capture & File Upload

### Mobile Upload Options

```
┌─────────────────────────────────────┐
│ [← Back]      Upload Documents      │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │         📷                  │   │
│  │                             │   │
│  │      Take Photo             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │         📁                  │   │
│  │                             │   │
│  │   Choose from Library       │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │         📄                  │   │
│  │                             │   │
│  │     Browse Files            │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Options:**

1. **Take Photo** - Opens device camera for instant capture
2. **Choose from Library** - Opens photo/file picker
3. **Browse Files** - Opens file browser for PDFs, documents

**Touch Targets:**

- Each button: 80px height (very thumb-friendly)
- Icon + text for clarity
- Large tap zones

---

### Mobile: Camera Capture

When "Take Photo" tapped:

```
┌─────────────────────────────────────┐
│ [✕]                         [Flash] │
│                                     │
│                                     │
│        [Camera Viewfinder]          │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│            [○ Capture]              │
│                                     │
└─────────────────────────────────────┘
```

After capture, show preview:

```
┌─────────────────────────────────────┐
│ [✕ Retake]              [✓ Use]     │
│                                     │
│                                     │
│        [Photo Preview]              │
│                                     │
│                                     │
│                                     │
│  Document Type:                     │
│  [Progress Photos           ▾]      │
│                                     │
│  Add Note (Optional):               │
│  [Foundation pour, west side]       │
│                                     │
└─────────────────────────────────────┘
```

**Features:**

- Preview captured photo before uploading
- Retake if not satisfied
- Add category and note immediately
- Upload button confirms

---

### Mobile: Upload Progress

```
┌─────────────────────────────────────┐
│ Uploading Document...               │
├─────────────────────────────────────┤
│                                     │
│  📷 Site_Photo_Nov_3.jpg            │
│                                     │
│  ████████████████──────── 68%       │
│                                     │
│  Uploaded 2.8 MB of 4.1 MB          │
│                                     │
│  [Cancel Upload]                    │
│                                     │
└─────────────────────────────────────┘
```

**Features:**

- Prominent progress bar
- Percentage and data transferred shown
- Cancel option if needed
- Blocks navigation until complete or cancelled

---

## Batch Upload Enhancement

### Multi-File Selection (Desktop)

When user selects multiple files (Ctrl/Cmd + Click):

```
┌──────────────────────────────────────────────────────────────┐
│ 5 Files Selected                                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Apply category to all files:                                │
│  ┌────────────────────────────────────────────────┐         │
│  │ Progress Photos                          ▾     │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  Or set individually:                                        │
│                                                              │
│  ☑ Site_Photo_001.jpg (3.2 MB)  [Progress Photos    ▾]      │
│  ☑ Site_Photo_002.jpg (2.9 MB)  [Progress Photos    ▾]      │
│  ☑ Site_Photo_003.jpg (4.1 MB)  [Progress Photos    ▾]      │
│  ☑ Invoice_5432.pdf (1.2 MB)    [Invoices & Receipts ▾]     │
│  ☑ Contract_Rev2.pdf (856 KB)   [Contracts & Agmt ▾]        │
│                                                              │
│  Total size: 12.3 MB                                         │
│                                                              │
│                 [Cancel]          [Upload 5 Files]           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Features:**

- Apply same category to all (batch action)
- Or set individually for each file
- Checkboxes to deselect unwanted files
- Total size shown (validation before upload)
- Upload all at once

---

### Parallel Upload with Queue

```
┌──────────────────────────────────────────────────────────────┐
│ Uploading 5 Documents...                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✓ Site_Photo_001.jpg (3.2 MB)       Complete               │
│  ✓ Site_Photo_002.jpg (2.9 MB)       Complete               │
│  ⏳ Site_Photo_003.jpg (4.1 MB)      Uploading... 45%        │
│  ████████████──────────────────── 45%                        │
│  ⏳ Invoice_5432.pdf (1.2 MB)        Uploading... 12%        │
│  ███───────────────────────────── 12%                        │
│  ⏳ Contract_Rev2.pdf (856 KB)       Waiting...              │
│                                                              │
│  Overall: 2 of 5 complete (6.1 MB / 12.3 MB uploaded)       │
│                                                              │
│  [Pause]  [Cancel All]                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Features:**

- Upload 2 files in parallel (faster)
- Queue remaining files
- Show overall progress
- Pause or cancel all option

---

## Client-Side Validation

### File Type Validation

Before upload starts, validate:

```
┌──────────────────────────────────────────────────────────────┐
│ ⚠️ Some Files Cannot Be Uploaded                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  These files are not supported:                              │
│                                                              │
│  ✗ Document.docx (Word documents not supported)             │
│  ✗ Spreadsheet.xlsx (Excel files not supported)             │
│                                                              │
│  Supported formats: PDF, JPG, PNG, HEIC                      │
│  Convert these files to PDF and try again.                   │
│                                                              │
│                                                              │
│  These files are ready to upload:                            │
│                                                              │
│  ✓ Invoice.pdf (1.2 MB)                                      │
│  ✓ Photo.jpg (3.4 MB)                                        │
│                                                              │
│               [Cancel]          [Upload 2 Files]             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Features:**

- Validation happens before upload (instant feedback)
- Clear explanation of why files rejected
- Guidance on how to fix (convert to PDF)
- Can proceed with valid files

---

### File Size Validation

```
┌──────────────────────────────────────────────────────────────┐
│ ⚠️ File Too Large                                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Site_Blueprint.pdf (15.2 MB)                                │
│                                                              │
│  This file exceeds the 10 MB limit.                          │
│                                                              │
│  Suggestions:                                                │
│  • Compress the PDF using Adobe Acrobat                      │
│  • Split into multiple smaller files                         │
│  • Reduce image quality in the PDF                           │
│                                                              │
│                      [Try Another File]                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Drag & Drop Component

```tsx
function DragDropZone({ onFilesSelected }: Props) {
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const validFiles = validateFiles(files)
    onFilesSelected(validFiles)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragActive(true)
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-12 text-center transition-all",
        isDragActive
          ? "border-primary bg-blue-50 scale-105"
          : "border-slate-300 hover:border-slate-400"
      )}
    >
      {isDragActive ? (
        <>
          <Target className="h-12 w-12 mx-auto text-primary" />
          <p className="mt-4 text-lg font-medium">Drop files to upload</p>
        </>
      ) : (
        <>
          <Upload className="h-12 w-12 mx-auto text-slate-400" />
          <p className="mt-4 text-lg font-medium">Drag files here to upload</p>
          <p className="mt-2 text-sm text-slate-600">or click to browse</p>
          <p className="mt-4 text-xs text-slate-500">
            Supports: PDF, JPG, PNG, HEIC • Max 10 MB each
          </p>
        </>
      )}
    </div>
  )
}
```

---

### Upload Progress Tracking

```tsx
function UploadProgress({ files }: Props) {
  const [uploads, setUploads] = useState<UploadState[]>([])

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    // Upload with progress tracking
    return axios.post("/api/documents/upload", formData, {
      onUploadProgress: (progressEvent) => {
        const percentComplete = Math.round((progressEvent.loaded * 100) / progressEvent.total)

        setUploads((prev) =>
          prev.map((upload) =>
            upload.id === file.name ? { ...upload, progress: percentComplete } : upload
          )
        )
      },
    })
  }

  return (
    <div className="space-y-4">
      {uploads.map((upload) => (
        <div key={upload.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{upload.name}</span>
            <span className="text-sm text-slate-600">
              {upload.status === "complete" ? "Uploaded" : `${upload.progress}%`}
            </span>
          </div>
          <Progress value={upload.progress} />
        </div>
      ))}
    </div>
  )
}
```

---

### Mobile Camera Capture

```tsx
function MobileCameraCapture({ onCapture }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCameraClick = () => {
    // Mobile devices: Opens camera
    // Desktop: Opens file picker
    fileInputRef.current?.click()
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment" // Use rear camera
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onCapture(file)
        }}
        className="hidden"
      />

      <Button
        size="lg"
        variant="outline"
        onClick={handleCameraClick}
        className="w-full h-20 text-lg"
      >
        <Camera className="mr-3 h-6 w-6" />
        Take Photo
      </Button>
    </>
  )
}
```

---

## Accessibility Requirements

### Keyboard Navigation

- Tab to drag-and-drop zone activates file picker
- Enter/Space on zone also opens file picker
- Progress bars have `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

### Screen Reader

- Drag zone: `aria-label="Upload document files"`
- Progress: Announce completion with `aria-live="polite"`
- File list: Use semantic `<ul>` with proper labels

### Mobile

- Camera button: Minimum 48px touch target
- Large, clear buttons for upload options
- Progress visible and cancellable

---

## Before & After Comparison

### Before (Current State)

**Pain Points:**

- No progress indicator (user unsure if upload working)
- No mobile camera capture (must use file picker)
- No batch upload (one file at a time)
- Validation after upload (wasted time)
- No drag-and-drop visual feedback

**Time to upload 5 photos:** 5-7 minutes

---

### After (Proposed State)

**Improvements:**

- Progress bars with percentage (always informed)
- Camera capture on mobile (instant photo upload)
- Batch upload up to 20 files (parallel processing)
- Client-side validation (instant rejection of invalid files)
- Drag-and-drop with hover states (clear feedback)

**Time to upload 5 photos:**

- Mobile with camera: **1-2 minutes** ⚡
- Desktop with drag & drop: **30-60 seconds** ⚡

**Expected Impact:**

- ✅ 70% time savings for mobile users
- ✅ 80% time savings for desktop users with drag & drop
- ✅ Reduced frustration (instant validation)
- ✅ Higher upload success rate
- ✅ Better on-site UX (camera capture)

---

## Implementation Estimate

- Drag & drop zone: **2 days**
- Upload progress tracking: **2 days**
- Mobile camera capture: **1 day**
- Batch upload: **2 days**
- Client-side validation: **1 day**
- Upload queue management: **1 day**
- Testing & refinement: **1 day**

**Total: 10 days**

---

## Related Issues from Audit

- ✅ Fixes P1: No upload progress indicators
- ✅ Fixes P1: Document upload no mobile optimization
- ✅ Fixes P2: No batch document upload
- ✅ Fixes P2: File upload doesn't validate types early

---

**Next Steps:**

1. Review wireframes with product owner
2. Test drag-and-drop UX with users
3. Implement desktop drag & drop first
4. Implement mobile camera capture
5. Add batch upload capability
6. Measure time savings and user satisfaction
