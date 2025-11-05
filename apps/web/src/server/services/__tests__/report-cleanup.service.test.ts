/**
 * Report Cleanup Service Tests
 *
 * Tests automatic cleanup of expired reports from Netlify Blobs storage
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { cleanupExpiredReports, isReportExpired } from "../report-cleanup.service"

// Mock Netlify Blobs
const mockList = vi.fn()
const mockGetMetadata = vi.fn()
const mockDelete = vi.fn()

vi.mock("@netlify/blobs", () => ({
  getStore: vi.fn(() => ({
    list: mockList,
    getMetadata: mockGetMetadata,
    delete: mockDelete,
  })),
  getDeployStore: vi.fn(() => ({
    list: mockList,
    getMetadata: mockGetMetadata,
    delete: mockDelete,
  })),
}))

describe("Report Cleanup Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("cleanupExpiredReports", () => {
    it("deletes expired reports", async () => {
      const now = new Date()
      const expiredDate = new Date(now.getTime() - 25 * 60 * 60 * 1000) // 25 hours ago
      const validDate = new Date(now.getTime() + 23 * 60 * 60 * 1000) // 23 hours from now

      mockList.mockResolvedValue({
        blobs: [
          { key: "report-1/file1.pdf" },
          { key: "report-2/file2.xlsx" },
          { key: "report-3/file3.pdf" },
        ],
      })

      mockGetMetadata
        .mockResolvedValueOnce({ expiresAt: expiredDate.toISOString() }) // report-1 expired
        .mockResolvedValueOnce({ expiresAt: validDate.toISOString() }) // report-2 valid
        .mockResolvedValueOnce({ expiresAt: expiredDate.toISOString() }) // report-3 expired

      const result = await cleanupExpiredReports()

      expect(result.totalScanned).toBe(3)
      expect(result.totalDeleted).toBe(2)
      expect(result.deletedReports).toEqual(["report-1/file1.pdf", "report-3/file3.pdf"])
      expect(mockDelete).toHaveBeenCalledTimes(2)
      expect(mockDelete).toHaveBeenCalledWith("report-1/file1.pdf")
      expect(mockDelete).toHaveBeenCalledWith("report-3/file3.pdf")
    })

    it("handles reports with no metadata gracefully", async () => {
      mockList.mockResolvedValue({
        blobs: [{ key: "report-1/file1.pdf" }, { key: "report-2/file2.xlsx" }],
      })

      mockGetMetadata
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ expiresAt: new Date().toISOString() })

      const result = await cleanupExpiredReports()

      expect(result.totalScanned).toBe(2)
      expect(result.totalDeleted).toBe(0)
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it("handles reports with missing expiresAt metadata", async () => {
      mockList.mockResolvedValue({
        blobs: [{ key: "report-1/file1.pdf" }],
      })

      mockGetMetadata.mockResolvedValueOnce({ projectId: "123" }) // No expiresAt

      const result = await cleanupExpiredReports()

      expect(result.totalScanned).toBe(1)
      expect(result.totalDeleted).toBe(0)
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it("returns zero results when no reports exist", async () => {
      mockList.mockResolvedValue({ blobs: [] })

      const result = await cleanupExpiredReports()

      expect(result.totalScanned).toBe(0)
      expect(result.totalDeleted).toBe(0)
      expect(result.deletedReports).toEqual([])
    })

    it("continues cleanup on individual blob errors", async () => {
      const now = new Date()
      const expiredDate = new Date(now.getTime() - 25 * 60 * 60 * 1000)

      mockList.mockResolvedValue({
        blobs: [{ key: "report-1/file1.pdf" }, { key: "report-2/file2.xlsx" }],
      })

      mockGetMetadata
        .mockRejectedValueOnce(new Error("Network error")) // report-1 fails
        .mockResolvedValueOnce({ expiresAt: expiredDate.toISOString() }) // report-2 succeeds

      const result = await cleanupExpiredReports()

      expect(result.totalScanned).toBe(2)
      expect(result.totalDeleted).toBe(1)
      expect(result.deletedReports).toEqual(["report-2/file2.xlsx"])
    })
  })

  describe("isReportExpired", () => {
    it("returns true for expired report", async () => {
      const expiredDate = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago

      mockGetMetadata.mockResolvedValue({
        expiresAt: expiredDate.toISOString(),
      })

      const result = await isReportExpired("report-id", "file.pdf")

      expect(result).toBe(true)
    })

    it("returns false for valid report", async () => {
      const validDate = new Date(Date.now() + 23 * 60 * 60 * 1000) // 23 hours from now

      mockGetMetadata.mockResolvedValue({
        expiresAt: validDate.toISOString(),
      })

      const result = await isReportExpired("report-id", "file.pdf")

      expect(result).toBe(false)
    })

    it("returns true when metadata is missing", async () => {
      mockGetMetadata.mockResolvedValue(null)

      const result = await isReportExpired("report-id", "file.pdf")

      expect(result).toBe(true)
    })

    it("returns true when expiresAt is missing from metadata", async () => {
      mockGetMetadata.mockResolvedValue({ projectId: "123" })

      const result = await isReportExpired("report-id", "file.pdf")

      expect(result).toBe(true)
    })

    it("returns true on error (fail-safe)", async () => {
      mockGetMetadata.mockRejectedValue(new Error("Network error"))

      const result = await isReportExpired("report-id", "file.pdf")

      expect(result).toBe(true)
    })
  })
})
