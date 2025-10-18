"use client"

import React, { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, X, Camera, File, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/trpc/client"

/**
 * Supported MIME types for file uploads
 */
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
]

/**
 * Maximum file size: 10MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Upload status for each file
 */
type UploadStatus = "pending" | "uploading" | "success" | "error"

/**
 * File upload state
 */
interface FileUploadState {
  file: File
  progress: number
  status: UploadStatus
  error?: string
  documentId?: string
  categoryId: string
}

/**
 * FileUpload component props
 */
interface FileUploadProps {
  projectId: string
  onSuccess?: (documentId: string) => void
  onError?: (error: string) => void
  disabled?: boolean
}

/**
 * Validate file size and type
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size must be under 10MB" }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "File type not supported. Please upload images, PDFs, or documents.",
    }
  }

  return { valid: true }
}

/**
 * Auto-suggest category based on MIME type
 */
function suggestCategory(mimeType: string): string {
  // Images default to photos (plural to match predefined categories)
  if (mimeType.startsWith("image/")) {
    return "photos"
  }

  // PDFs suggest receipts (user can override)
  if (mimeType === "application/pdf") {
    return "receipts"
  }

  // Documents suggest contracts
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "contracts"
  }

  // Default fallback
  return "photos"
}

/**
 * FileUpload Component
 *
 * Provides file upload functionality with drag-and-drop, click-to-browse,
 * and mobile camera capture. Validates file types and sizes, shows upload
 * progress, and handles errors gracefully.
 *
 * Features:
 * - Drag and drop file upload
 * - Click to browse file selection
 * - Mobile camera capture
 * - Multiple file selection
 * - File type and size validation
 * - Upload progress indication
 * - Cancel upload functionality
 * - Accessible keyboard navigation
 *
 * @param props - Component props
 */
export function FileUpload({ projectId, onSuccess, onError, disabled = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploads, setUploads] = useState<FileUploadState[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())

  // tRPC mutation for uploading documents
  const uploadMutation = api.documents.upload.useMutation()

  // Detect mobile device
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  /**
   * Handle file selection and upload
   */
  const handleFiles = async (files: File[]) => {
    if (disabled) return

    // Validate and add files to upload queue
    const validFiles: FileUploadState[] = []
    const invalidFiles: { file: File; error: string }[] = []

    files.forEach((file) => {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push({
          file,
          progress: 0,
          status: "pending",
          categoryId: suggestCategory(file.type), // Auto-suggest category
        })
      } else {
        invalidFiles.push({ file, error: validation.error! })
      }
    })

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ file, error }) => {
        onError?.(`${file.name}: ${error}`)
      })
    }

    // Add valid files to upload state
    if (validFiles.length > 0) {
      setUploads((prev) => [...prev, ...validFiles])

      // Upload each file
      validFiles.forEach((fileState) => {
        uploadFile(fileState)
      })
    }
  }

  /**
   * Upload a single file
   */
  const uploadFile = async (fileState: FileUploadState) => {
    const fileId = `${fileState.file.name}-${Date.now()}`
    const abortController = new AbortController()
    abortControllersRef.current.set(fileId, abortController)

    // Update status to uploading
    setUploads((prev) =>
      prev.map((upload) =>
        upload.file === fileState.file ? { ...upload, status: "uploading" as UploadStatus } : upload
      )
    )

    try {
      // Convert file to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(fileState.file)
      })

      const base64Data = await base64Promise

      // Simulate progress updates
      // In a real implementation, this would be tied to the actual upload progress
      const progressInterval = setInterval(() => {
        setUploads((prev) =>
          prev.map((upload) => {
            if (upload.file === fileState.file && upload.progress < 90) {
              return { ...upload, progress: upload.progress + 10 }
            }
            return upload
          })
        )
      }, 200)

      // Upload file via tRPC
      const result = await uploadMutation.mutateAsync({
        projectId,
        categoryId: fileState.categoryId,
        file: {
          name: fileState.file.name,
          size: fileState.file.size,
          type: fileState.file.type,
          data: base64Data,
        },
      })

      clearInterval(progressInterval)

      // Update to success
      setUploads((prev) =>
        prev.map((upload) =>
          upload.file === fileState.file
            ? {
                ...upload,
                progress: 100,
                status: "success" as UploadStatus,
                documentId: result.id,
              }
            : upload
        )
      )

      // Call success callback
      onSuccess?.(result.id)
    } catch (error) {
      // Update to error
      const errorMessage = error instanceof Error ? error.message : "Upload failed"
      setUploads((prev) =>
        prev.map((upload) =>
          upload.file === fileState.file
            ? { ...upload, status: "error" as UploadStatus, error: errorMessage }
            : upload
        )
      )
      onError?.(errorMessage)
    } finally {
      abortControllersRef.current.delete(fileId)
    }
  }

  /**
   * Update category for a pending upload
   */
  const updateCategory = (fileState: FileUploadState, categoryId: string) => {
    setUploads((prev) =>
      prev.map((upload) => (upload.file === fileState.file ? { ...upload, categoryId } : upload))
    )
  }

  /**
   * Cancel an upload
   */
  const cancelUpload = (fileState: FileUploadState) => {
    const fileId = `${fileState.file.name}-${Date.now()}`
    const controller = abortControllersRef.current.get(fileId)
    controller?.abort()

    // Remove from uploads
    setUploads((prev) => prev.filter((upload) => upload.file !== fileState.file))
  }

  /**
   * Remove a completed upload from the list
   */
  const removeUpload = (fileState: FileUploadState) => {
    setUploads((prev) => prev.filter((upload) => upload.file !== fileState.file))
  }

  /**
   * Handle drag events
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  /**
   * Handle drop event
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
    // Reset input value to allow same file selection again
    e.target.value = ""
  }

  /**
   * Trigger file input click
   */
  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  /**
   * Trigger camera input click
   */
  const handleCameraClick = () => {
    cameraInputRef.current?.click()
  }

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <Card
        className={cn(
          "border-2 border-dashed p-8 text-center transition-colors",
          dragActive && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <Upload className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Drag and drop files here, or click to browse</p>
            <p className="text-xs text-muted-foreground">
              Supports: Images (JPG, PNG, WebP), PDFs, and Documents (DOCX, XLSX)
            </p>
            <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleBrowseClick}
              disabled={disabled}
              aria-label="Upload files"
            >
              <Upload className="mr-2 h-4 w-4" />
              Browse Files
            </Button>
            {isMobile && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCameraClick}
                disabled={disabled}
                aria-label="Take photo with camera"
              >
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
            )}
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          className="hidden"
          aria-label="File input"
        />
        {isMobile && (
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Camera input"
          />
        )}
      </Card>

      {/* Upload list */}
      {uploads.length > 0 && (
        <div className="space-y-2" role="status" aria-live="polite">
          {uploads.map((upload, index) => (
            <Card key={`${upload.file.name}-${index}`} className="p-4">
              <div className="flex items-start gap-3">
                <File className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium truncate">{upload.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(upload.file.size)}
                      </p>
                      {/* Category selector for pending uploads */}
                      {upload.status === "pending" && (
                        <Select
                          value={upload.categoryId}
                          onValueChange={(value) => updateCategory(upload, value)}
                        >
                          <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="photos">Photos</SelectItem>
                            <SelectItem value="receipts">Receipts</SelectItem>
                            <SelectItem value="invoices">Invoices</SelectItem>
                            <SelectItem value="contracts">Contracts</SelectItem>
                            <SelectItem value="permits">Permits</SelectItem>
                            <SelectItem value="plans">Plans & Drawings</SelectItem>
                            <SelectItem value="inspections">Inspection Reports</SelectItem>
                            <SelectItem value="warranties">Warranties</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    {upload.status === "uploading" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelUpload(upload)}
                        aria-label={`Cancel upload of ${upload.file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {(upload.status === "success" || upload.status === "error") && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUpload(upload)}
                        aria-label={`Remove ${upload.file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {upload.status === "uploading" && (
                    <div className="space-y-1">
                      <Progress value={upload.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">{upload.progress}%</p>
                    </div>
                  )}

                  {upload.status === "success" && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <p className="text-xs">Upload complete</p>
                    </div>
                  )}

                  {upload.status === "error" && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-xs" aria-describedby={`error-${index}`}>
                        {upload.error || "Upload failed"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
