/**
 * FileUpload Component Tests
 *
 * Tests file upload component functionality including drag-and-drop,
 * file selection, validation, and error handling
 */

import React from "react"
import { describe, test, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { FileUpload } from "../FileUpload"

describe("FileUpload Component", () => {
  const mockProjectId = "test-project-123"
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()

  test("renders drag-and-drop zone", () => {
    render(<FileUpload projectId={mockProjectId} />)

    expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument()
    expect(screen.getByText(/browse files/i)).toBeInTheDocument()
  })

  test("displays file type and size requirements", () => {
    render(<FileUpload projectId={mockProjectId} />)

    expect(screen.getByText(/supports.*images.*pdfs.*documents/i)).toBeInTheDocument()
    expect(screen.getByText(/maximum file size.*10mb/i)).toBeInTheDocument()
  })

  test("has accessible file input", () => {
    render(<FileUpload projectId={mockProjectId} />)

    const fileInput = screen.getByLabelText(/file input/i, { selector: "input[type='file']" })
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute("multiple")
    expect(fileInput).toHaveAttribute("accept")
  })

  test("accepts multiple file selection", () => {
    render(<FileUpload projectId={mockProjectId} />)

    const fileInput = screen.getByLabelText(/file input/i, {
      selector: "input[type='file']",
    }) as HTMLInputElement

    expect(fileInput.multiple).toBe(true)
  })

  test("triggers file input when browse button clicked", () => {
    render(<FileUpload projectId={mockProjectId} />)

    const fileInput = screen.getByLabelText(/file input/i, {
      selector: "input[type='file']",
    }) as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, "click")

    const browseButton = screen.getByRole("button", { name: /upload files/i })
    fireEvent.click(browseButton)

    expect(clickSpy).toHaveBeenCalled()
  })

  test("shows error for file over 10MB", async () => {
    render(<FileUpload projectId={mockProjectId} onError={mockOnError} />)

    const fileInput = screen.getByLabelText(/file input/i, {
      selector: "input[type='file']",
    }) as HTMLInputElement

    // Create a mock file over 10MB
    const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg",
    })

    // Mock file size property
    Object.defineProperty(largeFile, "size", {
      value: 11 * 1024 * 1024,
      writable: false,
    })

    fireEvent.change(fileInput, { target: { files: [largeFile] } })

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining("10MB"))
    })
  })

  test("shows error for invalid file type", async () => {
    render(<FileUpload projectId={mockProjectId} onError={mockOnError} />)

    const fileInput = screen.getByLabelText(/file input/i, {
      selector: "input[type='file']",
    }) as HTMLInputElement

    const invalidFile = new File(["content"], "virus.exe", {
      type: "application/x-msdownload",
    })

    fireEvent.change(fileInput, { target: { files: [invalidFile] } })

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining("not supported"))
    })
  })

  test("accepts valid JPEG image", async () => {
    render(<FileUpload projectId={mockProjectId} onSuccess={mockOnSuccess} />)

    const fileInput = screen.getByLabelText(/file input/i, {
      selector: "input[type='file']",
    }) as HTMLInputElement

    const validFile = new File(["fake image content"], "photo.jpg", { type: "image/jpeg" })
    Object.defineProperty(validFile, "size", { value: 1024 * 1024, writable: false }) // 1MB

    fireEvent.change(fileInput, { target: { files: [validFile] } })

    await waitFor(() => {
      expect(screen.getByText("photo.jpg")).toBeInTheDocument()
    })
  })

  test("accepts valid PDF document", async () => {
    render(<FileUpload projectId={mockProjectId} />)

    const fileInput = screen.getByLabelText(/file input/i, {
      selector: "input[type='file']",
    }) as HTMLInputElement

    const pdfFile = new File(["pdf content"], "contract.pdf", { type: "application/pdf" })
    Object.defineProperty(pdfFile, "size", { value: 2 * 1024 * 1024, writable: false }) // 2MB

    fireEvent.change(fileInput, { target: { files: [pdfFile] } })

    await waitFor(() => {
      expect(screen.getByText("contract.pdf")).toBeInTheDocument()
    })
  })

  test("displays upload progress for selected files", async () => {
    render(<FileUpload projectId={mockProjectId} />)

    const fileInput = screen.getByLabelText(/file input/i, {
      selector: "input[type='file']",
    }) as HTMLInputElement

    const file = new File(["content"], "test.jpg", { type: "image/jpeg" })
    Object.defineProperty(file, "size", { value: 1024 * 1024, writable: false })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText("test.jpg")).toBeInTheDocument()
    })

    // Should show progress or status
    await waitFor(
      () => {
        const progressText = screen.queryByText(/%/)
        const statusText = screen.queryByText(/upload/i)
        expect(progressText || statusText).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  test("allows canceling upload", async () => {
    render(<FileUpload projectId={mockProjectId} />)

    const fileInput = screen.getByLabelText(/file input/i, {
      selector: "input[type='file']",
    }) as HTMLInputElement

    const file = new File(["content"], "test.jpg", { type: "image/jpeg" })
    Object.defineProperty(file, "size", { value: 1024 * 1024, writable: false })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText("test.jpg")).toBeInTheDocument()
    })

    // Find cancel button (X button)
    const cancelButtons = screen.getAllByRole("button", { name: /cancel|remove/i })
    expect(cancelButtons.length).toBeGreaterThan(0)
  })

  test("handles drag and drop events", () => {
    render(<FileUpload projectId={mockProjectId} />)

    const dropZone = screen.getByText(/drag and drop files here/i).closest("div")
    expect(dropZone).toBeInTheDocument()

    // Simulate drag enter
    fireEvent.dragEnter(dropZone!, { dataTransfer: { files: [] } })

    // Simulate drag over
    fireEvent.dragOver(dropZone!, { dataTransfer: { files: [] } })

    // Simulate drag leave
    fireEvent.dragLeave(dropZone!, { dataTransfer: { files: [] } })
  })

  test("handles drop event with valid file", async () => {
    render(<FileUpload projectId={mockProjectId} />)

    const dropZone = screen.getByText(/drag and drop files here/i).closest("div")!
    const file = new File(["content"], "dropped.jpg", { type: "image/jpeg" })
    Object.defineProperty(file, "size", { value: 1024 * 1024, writable: false })

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => {
      expect(screen.getByText("dropped.jpg")).toBeInTheDocument()
    })
  })

  test("shows camera button only on mobile", () => {
    // Mock window.innerWidth for mobile
    global.innerWidth = 500

    render(<FileUpload projectId={mockProjectId} />)

    // Trigger resize event to update mobile state
    fireEvent(window, new Event("resize"))

    // Camera button should be present
    waitFor(() => {
      const cameraButton = screen.queryByRole("button", { name: /take photo/i })
      expect(cameraButton).toBeInTheDocument()
    })
  })

  test("does not allow uploads when disabled", () => {
    render(<FileUpload projectId={mockProjectId} disabled={true} />)

    const browseButton = screen.getByRole("button", { name: /upload files/i })
    expect(browseButton).toBeDisabled()
  })

  test("displays file size in readable format", async () => {
    render(<FileUpload projectId={mockProjectId} />)

    const fileInput = screen.getByLabelText(/file input/i, {
      selector: "input[type='file']",
    }) as HTMLInputElement

    const file = new File(["content"], "test.jpg", { type: "image/jpeg" })
    Object.defineProperty(file, "size", { value: 1024 * 1024, writable: false }) // 1MB

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      // Should display size in MB
      expect(screen.getByText(/1\.0 MB/i)).toBeInTheDocument()
    })
  })

  test("handles multiple simultaneous file uploads", async () => {
    render(<FileUpload projectId={mockProjectId} />)

    const fileInput = screen.getByLabelText(/file input/i, {
      selector: "input[type='file']",
    }) as HTMLInputElement

    const file1 = new File(["content1"], "test1.jpg", { type: "image/jpeg" })
    const file2 = new File(["content2"], "test2.pdf", { type: "application/pdf" })
    Object.defineProperty(file1, "size", { value: 1024 * 1024, writable: false })
    Object.defineProperty(file2, "size", { value: 2 * 1024 * 1024, writable: false })

    fireEvent.change(fileInput, { target: { files: [file1, file2] } })

    await waitFor(() => {
      expect(screen.getByText("test1.jpg")).toBeInTheDocument()
      expect(screen.getByText("test2.pdf")).toBeInTheDocument()
    })
  })
})
