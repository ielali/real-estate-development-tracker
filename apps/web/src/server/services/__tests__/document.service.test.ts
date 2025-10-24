/**
 * Document Service Tests
 *
 * Tests document upload, thumbnail generation, and blob storage operations
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { DocumentService, bufferToArrayBuffer } from "../document.service"
import crypto from "crypto"

// Mock Netlify Blobs
const mockSet = vi.fn()
const mockGet = vi.fn()
const mockDelete = vi.fn()

vi.mock("@netlify/blobs", () => ({
  getStore: vi.fn(() => ({
    set: mockSet,
    get: mockGet,
    delete: mockDelete,
  })),
  getDeployStore: vi.fn(() => ({
    set: mockSet,
    get: mockGet,
    delete: mockDelete,
  })),
}))

describe("DocumentService", () => {
  let service: DocumentService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new DocumentService()
  })

  describe("processMetadata", () => {
    it("validates file under 10MB", () => {
      const result = service.processMetadata({
        name: "test.pdf",
        size: 5 * 1024 * 1024, // 5MB
        type: "application/pdf",
      })

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("rejects file over 10MB", () => {
      const result = service.processMetadata({
        name: "large.pdf",
        size: 15 * 1024 * 1024, // 15MB
        type: "application/pdf",
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe("File size must be under 10MB")
    })

    it("rejects unsupported file type", () => {
      const result = service.processMetadata({
        name: "test.exe",
        size: 1024,
        type: "application/x-msdownload",
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toContain("File type not supported")
    })

    it("accepts all supported file types", () => {
      const supportedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]

      supportedTypes.forEach((type) => {
        const result = service.processMetadata({
          name: `test.${type.split("/")[1]}`,
          size: 1024,
          type,
        })
        expect(result.isValid).toBe(true)
      })
    })
  })

  describe("upload", () => {
    it("uploads valid file and returns document ID", async () => {
      const documentId = crypto.randomUUID()
      const projectId = crypto.randomUUID()
      const fileBuffer = new ArrayBuffer(1024)

      mockSet.mockResolvedValue(undefined)

      const result = await service.upload(
        fileBuffer,
        {
          name: "test.pdf",
          size: 1024,
          type: "application/pdf",
        },
        documentId,
        projectId
      )

      expect(result).toBe(documentId)
      expect(mockSet).toHaveBeenCalledWith(
        documentId,
        fileBuffer,
        expect.objectContaining({
          metadata: expect.objectContaining({
            fileName: "test.pdf",
            mimeType: "application/pdf",
            projectId: projectId,
          }),
        })
      )
    })

    it("throws error for invalid file size", async () => {
      const documentId = crypto.randomUUID()
      const projectId = crypto.randomUUID()
      const fileBuffer = new ArrayBuffer(15 * 1024 * 1024)

      await expect(
        service.upload(
          fileBuffer,
          {
            name: "large.pdf",
            size: 15 * 1024 * 1024,
            type: "application/pdf",
          },
          documentId,
          projectId
        )
      ).rejects.toThrow("File size must be under 10MB")
    })

    it("throws error for unsupported file type", async () => {
      const documentId = crypto.randomUUID()
      const projectId = crypto.randomUUID()
      const fileBuffer = new ArrayBuffer(1024)

      await expect(
        service.upload(
          fileBuffer,
          {
            name: "test.exe",
            size: 1024,
            type: "application/x-msdownload",
          },
          documentId,
          projectId
        )
      ).rejects.toThrow("File type not supported")
    })
  })

  describe("bufferToArrayBuffer", () => {
    it("converts Buffer to ArrayBuffer correctly", () => {
      const buffer = Buffer.from("test data")
      const arrayBuffer = bufferToArrayBuffer(buffer)

      expect(arrayBuffer).toBeInstanceOf(ArrayBuffer)
      expect(arrayBuffer.byteLength).toBe(buffer.length)

      // Verify content is the same
      const view = new Uint8Array(arrayBuffer)
      expect(view).toEqual(new Uint8Array(buffer))
    })

    it("handles empty buffer", () => {
      const buffer = Buffer.from("")
      const arrayBuffer = bufferToArrayBuffer(buffer)

      expect(arrayBuffer).toBeInstanceOf(ArrayBuffer)
      expect(arrayBuffer.byteLength).toBe(0)
    })

    it("handles binary data", () => {
      const buffer = Buffer.from([0x00, 0x01, 0xff, 0x80])
      const arrayBuffer = bufferToArrayBuffer(buffer)

      const view = new Uint8Array(arrayBuffer)
      expect(view[0]).toBe(0x00)
      expect(view[1]).toBe(0x01)
      expect(view[2]).toBe(0xff)
      expect(view[3]).toBe(0x80)
    })
  })

  describe("generateThumbnail", () => {
    it("returns placeholder for PDF files", async () => {
      const blobKey = crypto.randomUUID()
      const result = await service.generateThumbnail(blobKey, "application/pdf")

      expect(result).toBe("/icons/pdf-placeholder.svg")
      expect(mockGet).not.toHaveBeenCalled()
    })

    it("returns placeholder for DOCX files", async () => {
      const blobKey = crypto.randomUUID()
      const result = await service.generateThumbnail(
        blobKey,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )

      expect(result).toBe("/icons/doc-placeholder.svg")
    })

    it("returns placeholder for XLSX files", async () => {
      const blobKey = crypto.randomUUID()
      const result = await service.generateThumbnail(
        blobKey,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )

      expect(result).toBe("/icons/doc-placeholder.svg")
    })

    it("returns default placeholder for unsupported types", async () => {
      const blobKey = crypto.randomUUID()
      const result = await service.generateThumbnail(blobKey, "text/plain")

      expect(result).toBe("/icons/file-placeholder.svg")
    })

    // Note: Testing actual image thumbnail generation requires Sharp
    // which needs actual image data. That's better tested in integration tests.
  })

  describe("delete", () => {
    it("deletes blob from storage", async () => {
      const documentId = crypto.randomUUID()
      mockDelete.mockResolvedValue(undefined)

      await service.delete(documentId)

      expect(mockDelete).toHaveBeenCalledWith(documentId)
    })

    it("does not throw on delete failure", async () => {
      const documentId = crypto.randomUUID()
      mockDelete.mockRejectedValue(new Error("Blob not found"))

      await expect(service.delete(documentId)).resolves.toBeUndefined()
    })
  })

  describe("getDocumentBlob", () => {
    it("retrieves blob data", async () => {
      const blobKey = crypto.randomUUID()
      const mockData = "base64encodeddata"
      mockGet.mockResolvedValue(mockData)

      const result = await service.getDocumentBlob(blobKey)

      expect(result).toBe(mockData)
      expect(mockGet).toHaveBeenCalledWith(blobKey)
    })

    it("throws NOT_FOUND when blob does not exist", async () => {
      const blobKey = crypto.randomUUID()
      mockGet.mockResolvedValue(null)

      await expect(service.getDocumentBlob(blobKey)).rejects.toThrow("Document not found")
    })
  })
})
