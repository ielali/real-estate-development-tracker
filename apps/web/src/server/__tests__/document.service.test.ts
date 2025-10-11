/**
 * DocumentService Tests
 *
 * Tests file validation and metadata processing for document uploads
 */

import { describe, test, expect, vi, beforeAll } from "vitest"
import { DocumentService, bufferToArrayBuffer } from "@/server/services/document.service"

// Mock Netlify Blobs before importing DocumentService
vi.mock("@netlify/blobs", () => ({
  getStore: () => ({
    set: vi.fn().mockResolvedValue(undefined),
    getURL: vi.fn((id: string) => `https://blob.example.com/${id}`),
  }),
}))

describe("DocumentService", () => {
  let service: DocumentService

  beforeAll(() => {
    service = new DocumentService()
  })

  describe("processMetadata", () => {
    test("accepts valid JPEG image under 10MB", () => {
      const result = service.processMetadata({
        name: "photo.jpg",
        size: 5 * 1024 * 1024, // 5MB
        type: "image/jpeg",
      })

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
      expect(result.fileName).toBe("photo.jpg")
      expect(result.mimeType).toBe("image/jpeg")
    })

    test("accepts valid PNG image", () => {
      const result = service.processMetadata({
        name: "image.png",
        size: 2 * 1024 * 1024, // 2MB
        type: "image/png",
      })

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test("accepts valid PDF document", () => {
      const result = service.processMetadata({
        name: "contract.pdf",
        size: 8 * 1024 * 1024, // 8MB
        type: "application/pdf",
      })

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test("accepts valid DOCX document", () => {
      const result = service.processMetadata({
        name: "report.docx",
        size: 1 * 1024 * 1024, // 1MB
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test("accepts valid XLSX document", () => {
      const result = service.processMetadata({
        name: "budget.xlsx",
        size: 3 * 1024 * 1024, // 3MB
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test("rejects file over 10MB", () => {
      const result = service.processMetadata({
        name: "large.jpg",
        size: 11 * 1024 * 1024, // 11MB
        type: "image/jpeg",
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe("File size must be under 10MB")
    })

    test("rejects file exactly at 10MB + 1 byte", () => {
      const result = service.processMetadata({
        name: "large.pdf",
        size: 10 * 1024 * 1024 + 1, // 10MB + 1 byte
        type: "application/pdf",
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe("File size must be under 10MB")
    })

    test("accepts file exactly at 10MB", () => {
      const result = service.processMetadata({
        name: "max-size.pdf",
        size: 10 * 1024 * 1024, // Exactly 10MB
        type: "application/pdf",
      })

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test("rejects unsupported file type (executable)", () => {
      const result = service.processMetadata({
        name: "virus.exe",
        size: 1024,
        type: "application/x-msdownload",
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe(
        "File type not supported. Please upload images, PDFs, or documents."
      )
    })

    test("rejects unsupported file type (ZIP)", () => {
      const result = service.processMetadata({
        name: "archive.zip",
        size: 1024 * 1024,
        type: "application/zip",
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe(
        "File type not supported. Please upload images, PDFs, or documents."
      )
    })

    test("rejects unsupported file type (TXT)", () => {
      const result = service.processMetadata({
        name: "notes.txt",
        size: 1024,
        type: "text/plain",
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe(
        "File type not supported. Please upload images, PDFs, or documents."
      )
    })

    test("returns correct file size in metadata", () => {
      const size = 5 * 1024 * 1024 // 5MB
      const result = service.processMetadata({
        name: "test.jpg",
        size: size,
        type: "image/jpeg",
      })

      expect(result.fileSize).toBe(size)
    })

    test("preserves original file name", () => {
      const fileName = "My Important Document.pdf"
      const result = service.processMetadata({
        name: fileName,
        size: 1024,
        type: "application/pdf",
      })

      expect(result.fileName).toBe(fileName)
    })
  })

  describe("upload", () => {
    test("throws error for invalid file size", async () => {
      const buffer = Buffer.alloc(11 * 1024 * 1024) // 11MB
      const largeFileBuffer = bufferToArrayBuffer(buffer)

      await expect(
        service.upload(
          largeFileBuffer,
          {
            name: "large.jpg",
            size: 11 * 1024 * 1024,
            type: "image/jpeg",
          },
          "test-doc-id",
          "test-project-id"
        )
      ).rejects.toThrow("File size must be under 10MB")
    })

    test("throws error for invalid file type", async () => {
      const buffer = Buffer.from("test content")
      const fileBuffer = bufferToArrayBuffer(buffer)

      await expect(
        service.upload(
          fileBuffer,
          {
            name: "test.exe",
            size: 1024,
            type: "application/x-msdownload",
          },
          "test-doc-id",
          "test-project-id"
        )
      ).rejects.toThrow("File type not supported")
    })
  })
})
