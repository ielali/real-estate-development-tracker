export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface Document extends BaseEntity {
  projectId: string
  fileName: string
  fileSize: number // Size in bytes
  mimeType: string
  blobUrl: string // Netlify Blob storage URL
  thumbnailUrl: string | null // Generated thumbnail for images (Story 3.2)
  categoryId: string // References Category.id from unified category system
  uploadedById: string // User who uploaded
}
