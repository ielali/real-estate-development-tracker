/**
 * DocumentGallery Component Tests
 *
 * Story 4.3 - Partner Dashboard
 *
 * Tests for the DocumentGallery component to ensure it correctly displays
 * documents, filters by category, and handles empty states.
 */

import { render, screen, fireEvent, within } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DocumentGallery, type DocumentItem } from "../DocumentGallery"

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe("DocumentGallery", () => {
  const mockDocuments: DocumentItem[] = [
    {
      id: "doc-1",
      fileName: "image1.jpg",
      fileSize: 1024 * 500, // 500 KB
      mimeType: "image/jpeg",
      thumbnailUrl: "/api/documents/doc-1/thumbnail",
      viewUrl: "/api/documents/doc-1/view",
      categoryName: "Photos",
      uploadedBy: "John Doe",
      uploadedAt: new Date("2024-01-15"),
    },
    {
      id: "doc-2",
      fileName: "receipt1.pdf",
      fileSize: 1024 * 200, // 200 KB
      mimeType: "application/pdf",
      thumbnailUrl: "/api/documents/doc-2/thumbnail",
      viewUrl: "/api/documents/doc-2/view",
      categoryName: "Receipts",
      uploadedBy: "Jane Smith",
      uploadedAt: new Date("2024-01-20"),
    },
    {
      id: "doc-3",
      fileName: "image2.png",
      fileSize: 1024 * 300, // 300 KB
      mimeType: "image/png",
      thumbnailUrl: "/api/documents/doc-3/thumbnail",
      viewUrl: "/api/documents/doc-3/view",
      categoryName: "Photos",
      uploadedBy: "John Doe",
      uploadedAt: new Date("2024-01-25"),
    },
  ]

  describe("Empty State", () => {
    it("should display empty state when no documents", () => {
      render(<DocumentGallery documents={[]} />)
      expect(screen.getByText("No documents uploaded yet")).toBeInTheDocument()
      expect(
        screen.getByText("Documents will appear here once they are uploaded")
      ).toBeInTheDocument()
    })

    it("should not display document grid when empty", () => {
      const { container } = render(<DocumentGallery documents={[]} />)
      expect(container.querySelector('[class*="grid"]')).not.toBeInTheDocument()
    })
  })

  describe("Document Display", () => {
    it("should render all documents", () => {
      render(<DocumentGallery documents={mockDocuments} />)
      expect(screen.getByText("image1.jpg")).toBeInTheDocument()
      expect(screen.getByText("receipt1.pdf")).toBeInTheDocument()
      expect(screen.getByText("image2.png")).toBeInTheDocument()
    })

    it("should display document count in header", () => {
      render(<DocumentGallery documents={mockDocuments} />)
      expect(screen.getByText(/3 documents/i)).toBeInTheDocument()
    })

    it("should display category count in header", () => {
      render(<DocumentGallery documents={mockDocuments} />)
      // 2 categories: Photos and Receipts
      expect(screen.getByText(/2 categories/i)).toBeInTheDocument()
    })

    it("should display file sizes correctly", () => {
      render(<DocumentGallery documents={mockDocuments} />)
      expect(screen.getByText("500.0 KB")).toBeInTheDocument()
      expect(screen.getByText("200.0 KB")).toBeInTheDocument()
      expect(screen.getByText("300.0 KB")).toBeInTheDocument()
    })

    it("should render document thumbnails for images", () => {
      render(<DocumentGallery documents={mockDocuments} />)
      const images = screen.getAllByRole("img")
      expect(images.length).toBeGreaterThan(0)
    })
  })

  describe("Category Filtering", () => {
    it("should show 'All' tab by default", () => {
      render(<DocumentGallery documents={mockDocuments} />)
      const allTab = screen.getByRole("tab", { name: /All \(3\)/i })
      expect(allTab).toHaveAttribute("data-state", "active")
    })

    it("should display all category tabs", () => {
      render(<DocumentGallery documents={mockDocuments} />)
      expect(screen.getByRole("tab", { name: /All \(3\)/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /Photos \(2\)/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /Receipts \(1\)/i })).toBeInTheDocument()
    })

    it("should filter documents when clicking Photos tab", () => {
      render(<DocumentGallery documents={mockDocuments} />)

      const photosTab = screen.getByRole("tab", { name: /Photos \(2\)/i })
      fireEvent.click(photosTab)

      // Should show only Photos category documents
      expect(screen.getByText("image1.jpg")).toBeInTheDocument()
      expect(screen.getByText("image2.png")).toBeInTheDocument()
      expect(screen.queryByText("receipt1.pdf")).not.toBeInTheDocument()
    })

    it("should filter documents when clicking Receipts tab", () => {
      render(<DocumentGallery documents={mockDocuments} />)

      const receiptsTab = screen.getByRole("tab", { name: /Receipts \(1\)/i })
      fireEvent.click(receiptsTab)

      // Should show only Receipts category documents
      expect(screen.getByText("receipt1.pdf")).toBeInTheDocument()
      expect(screen.queryByText("image1.jpg")).not.toBeInTheDocument()
      expect(screen.queryByText("image2.png")).not.toBeInTheDocument()
    })

    it("should show all documents when clicking All tab after filtering", () => {
      render(<DocumentGallery documents={mockDocuments} />)

      // Filter by Photos first
      const photosTab = screen.getByRole("tab", { name: /Photos \(2\)/i })
      fireEvent.click(photosTab)

      // Then click All tab
      const allTab = screen.getByRole("tab", { name: /All \(3\)/i })
      fireEvent.click(allTab)

      // Should show all documents again
      expect(screen.getByText("image1.jpg")).toBeInTheDocument()
      expect(screen.getByText("receipt1.pdf")).toBeInTheDocument()
      expect(screen.getByText("image2.png")).toBeInTheDocument()
    })
  })

  describe("Document Dialog", () => {
    it("should not show dialog initially", () => {
      render(<DocumentGallery documents={mockDocuments} />)
      // Dialog content should not be visible
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("should open dialog when clicking on a document", () => {
      render(<DocumentGallery documents={mockDocuments} />)

      // Click on first document card
      const documentCard = screen.getByText("image1.jpg").closest("div")
      if (documentCard) {
        fireEvent.click(documentCard)

        // Dialog should open with document details
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      }
    })

    it("should display document details in dialog", () => {
      render(<DocumentGallery documents={mockDocuments} />)

      // Click on first document
      const documentCard = screen.getByText("image1.jpg").closest("div")
      if (documentCard) {
        fireEvent.click(documentCard)

        // Check dialog contains document details
        const dialog = screen.getByRole("dialog")
        expect(within(dialog).getByText("image1.jpg")).toBeInTheDocument()
        expect(within(dialog).getByText("500.0 KB")).toBeInTheDocument()
        expect(within(dialog).getByText("Photos")).toBeInTheDocument()
        expect(within(dialog).getByText("John Doe")).toBeInTheDocument()
      }
    })

    it("should have download and open buttons in dialog", () => {
      render(<DocumentGallery documents={mockDocuments} />)

      // Click on first document
      const documentCard = screen.getByText("image1.jpg").closest("div")
      if (documentCard) {
        fireEvent.click(documentCard)

        const dialog = screen.getByRole("dialog")
        expect(within(dialog).getByText(/Download/i)).toBeInTheDocument()
        expect(within(dialog).getByText(/Open in New Tab/i)).toBeInTheDocument()
      }
    })
  })

  describe("Edge Cases", () => {
    it("should handle singular document count", () => {
      const singleDocument = [mockDocuments[0]!]
      render(<DocumentGallery documents={singleDocument} />)
      expect(screen.getByText(/1 document/i)).toBeInTheDocument()
    })

    it("should handle singular category count", () => {
      const singleCategoryDocs = mockDocuments.filter((d) => d.categoryName === "Photos")
      render(<DocumentGallery documents={singleCategoryDocs} />)
      expect(screen.getByText(/1 category/i)).toBeInTheDocument()
    })

    it("should handle documents with very long filenames", () => {
      const longNameDoc: DocumentItem = {
        ...mockDocuments[0]!,
        fileName: "very-long-filename-that-should-be-truncated-or-wrapped-properly.jpg",
      }
      render(<DocumentGallery documents={[longNameDoc]} />)
      expect(
        screen.getByText("very-long-filename-that-should-be-truncated-or-wrapped-properly.jpg")
      ).toBeInTheDocument()
    })

    it("should handle documents with small file sizes", () => {
      const smallFileDoc: DocumentItem = {
        ...mockDocuments[0]!,
        fileSize: 512, // < 1 KB
      }
      render(<DocumentGallery documents={[smallFileDoc]} />)
      expect(screen.getByText("512 B")).toBeInTheDocument()
    })

    it("should handle documents with large file sizes", () => {
      const largeFileDoc: DocumentItem = {
        ...mockDocuments[0]!,
        fileSize: 5 * 1024 * 1024, // 5 MB
      }
      render(<DocumentGallery documents={[largeFileDoc]} />)
      expect(screen.getByText("5.0 MB")).toBeInTheDocument()
    })
  })
})
