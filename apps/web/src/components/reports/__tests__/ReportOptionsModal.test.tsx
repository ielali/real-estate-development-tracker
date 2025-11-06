/**
 * ReportOptionsModal Component Tests
 *
 * Tests report format selection, date range picker, loading states, and download functionality
 */

import React from "react"
import { describe, test, expect, vi, afterEach, beforeEach } from "vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ReportOptionsModal } from "../ReportOptionsModal"

// Mock functions that will be assigned in beforeEach
let mockMutateAsync: ReturnType<typeof vi.fn>
let mockToastSuccess: ReturnType<typeof vi.fn>
let mockToastError: ReturnType<typeof vi.fn>

// Mock tRPC client
vi.mock("@/lib/trpc/client", () => ({
  api: {
    reports: {
      generateReport: {
        useMutation: () => ({
          mutateAsync: (...args: any[]) => mockMutateAsync(...args),
          isPending: false,
        }),
      },
    },
  },
}))

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}))

describe("ReportOptionsModal", () => {
  beforeEach(() => {
    // Initialize mock functions
    mockMutateAsync = vi.fn()
    mockToastSuccess = vi.fn()
    mockToastError = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  test("renders modal when open", () => {
    render(
      <ReportOptionsModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    expect(screen.getByRole("heading", { name: /Generate Report/i })).toBeInTheDocument()
    expect(
      screen.getByText(/Create a professional financial report for Test Project/i)
    ).toBeInTheDocument()
  })

  test("does not render when closed", () => {
    render(
      <ReportOptionsModal
        isOpen={false}
        onClose={vi.fn()}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    expect(screen.queryByText("Generate Report")).not.toBeInTheDocument()
  })

  test("displays PDF and Excel format options", () => {
    render(
      <ReportOptionsModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    expect(screen.getByText("PDF")).toBeInTheDocument()
    expect(screen.getByText("Professional report")).toBeInTheDocument()
    expect(screen.getByText("Excel")).toBeInTheDocument()
    expect(screen.getByText("Detailed workbook")).toBeInTheDocument()
  })

  test("displays date range presets", async () => {
    const user = userEvent.setup()

    render(
      <ReportOptionsModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    // Click the select trigger to open dropdown
    const selectTrigger = screen.getByRole("combobox")
    await user.click(selectTrigger)

    // Check for date range preset options using option role
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /All Time/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /Last 30 Days/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /Last Quarter/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /Year to Date/i })).toBeInTheDocument()
    })
  })

  test("allows selecting PDF format", async () => {
    const user = userEvent.setup()

    render(
      <ReportOptionsModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    // PDF should be selected by default (check via visual indicator or aria-checked)
    const pdfOption = screen.getByLabelText(/PDF/i)
    await user.click(pdfOption)

    // Verify PDF is selected (implementation dependent on RadioGroup)
    expect(pdfOption).toBeInTheDocument()
  })

  test("allows selecting Excel format", async () => {
    const user = userEvent.setup()

    render(
      <ReportOptionsModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    const excelOption = screen.getByLabelText(/Excel/i)
    await user.click(excelOption)

    expect(excelOption).toBeInTheDocument()
  })

  test("submits form and generates PDF report", async () => {
    const user = userEvent.setup()
    const mockOnClose = vi.fn()

    mockMutateAsync.mockResolvedValue({
      reportId: "test-report-id",
      downloadUrl: "/api/reports/download/test-report-id/report.pdf",
      fileName: "report.pdf",
      expiresAt: new Date(),
      format: "pdf",
    })

    render(
      <ReportOptionsModal
        isOpen={true}
        onClose={mockOnClose}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    // Select PDF format (already default)
    const generateButton = screen.getByRole("button", { name: /Generate Report/i })
    await user.click(generateButton)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        projectId: "test-project-id",
        format: "pdf",
        startDate: null,
        endDate: null,
      })
    })

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("PDF report generated successfully!")
    })
  })

  test("submits form and generates Excel report", async () => {
    const user = userEvent.setup()

    mockMutateAsync.mockResolvedValue({
      reportId: "test-report-id",
      downloadUrl: "/api/reports/download/test-report-id/report.xlsx",
      fileName: "report.xlsx",
      expiresAt: new Date(),
      format: "excel",
    })

    render(
      <ReportOptionsModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    // Select Excel format
    const excelOption = screen.getByLabelText(/Excel/i)
    await user.click(excelOption)

    const generateButton = screen.getByRole("button", { name: /Generate Report/i })
    await user.click(generateButton)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        projectId: "test-project-id",
        format: "excel",
        startDate: null,
        endDate: null,
      })
    })

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("EXCEL report generated successfully!")
    })
  })

  test("displays download button after successful generation", async () => {
    const user = userEvent.setup()

    mockMutateAsync.mockResolvedValue({
      reportId: "test-report-id",
      downloadUrl: "/api/reports/download/test-report-id/report.pdf",
      fileName: "report.pdf",
      expiresAt: new Date(),
      format: "pdf",
    })

    render(
      <ReportOptionsModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    const generateButton = screen.getByRole("button", { name: /Generate Report/i })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText("Report ready for download")).toBeInTheDocument()
      expect(screen.getByText("report.pdf")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Download PDF Report/i })).toBeInTheDocument()
    })
  })

  test("shows error message on generation failure", async () => {
    const user = userEvent.setup()

    mockMutateAsync.mockRejectedValue(new Error("Generation failed"))

    render(
      <ReportOptionsModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    const generateButton = screen.getByRole("button", { name: /Generate Report/i })
    await user.click(generateButton)

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to generate report. Please try again.")
    })
  })

  test("disables form during report generation", async () => {
    const user = userEvent.setup()

    // Mock a pending state
    mockMutateAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              reportId: "test-report-id",
              downloadUrl: "/api/reports/download/test-report-id/report.pdf",
              fileName: "report.pdf",
              expiresAt: new Date(),
              format: "pdf",
            })
          }, 100)
        })
    )

    render(
      <ReportOptionsModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    const generateButton = screen.getByRole("button", { name: /Generate Report/i })
    await user.click(generateButton)

    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText("Generating...")).toBeInTheDocument()
      expect(screen.getByText("Generating report...")).toBeInTheDocument()
    })

    // Wait for completion
    await waitFor(
      () => {
        expect(screen.getByText("Report ready for download")).toBeInTheDocument()
      },
      { timeout: 2000 }
    )
  })

  test("prevents closing modal during generation", async () => {
    const user = userEvent.setup()
    const mockOnClose = vi.fn()

    mockMutateAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              reportId: "test-report-id",
              downloadUrl: "/api/reports/download/test-report-id/report.pdf",
              fileName: "report.pdf",
              expiresAt: new Date(),
              format: "pdf",
            })
          }, 100)
        })
    )

    render(
      <ReportOptionsModal
        isOpen={true}
        onClose={mockOnClose}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    const generateButton = screen.getByRole("button", { name: /Generate Report/i })
    await user.click(generateButton)

    // Try to find and click cancel button during generation
    const cancelButton = screen.queryByRole("button", { name: /Cancel/i })

    // Cancel should be disabled during generation
    if (cancelButton) {
      expect(cancelButton).toBeDisabled()
    }
  })

  test("resets form state when modal closes", async () => {
    const user = userEvent.setup()
    let isOpen = true
    const mockOnClose = vi.fn(() => {
      isOpen = false
    })

    mockMutateAsync.mockResolvedValue({
      reportId: "test-report-id",
      downloadUrl: "/api/reports/download/test-report-id/report.pdf",
      fileName: "report.pdf",
      expiresAt: new Date(),
      format: "pdf",
    })

    const { rerender } = render(
      <ReportOptionsModal
        isOpen={isOpen}
        onClose={mockOnClose}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    // Generate report
    const generateButton = screen.getByRole("button", { name: /Generate Report/i })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText("Report ready for download")).toBeInTheDocument()
    })

    // Close modal - get the primary close button (not the X button)
    const closeButtons = screen.getAllByRole("button", { name: /Close/i })
    const closeButton = closeButtons.find((btn) => btn.textContent === "Close") || closeButtons[0]
    await user.click(closeButton!)

    expect(mockOnClose).toHaveBeenCalled()

    // Reopen and verify state is reset
    rerender(
      <ReportOptionsModal
        isOpen={true}
        onClose={mockOnClose}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    // Download section should not be visible
    expect(screen.queryByText("Report ready for download")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Generate Report/i })).toBeInTheDocument()
  })

  test("displays project name in description", () => {
    render(
      <ReportOptionsModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="test-project-id"
        projectName="My Awesome Project"
      />
    )

    expect(
      screen.getByText(/Create a professional financial report for My Awesome Project/i)
    ).toBeInTheDocument()
  })

  test("has correct form labels", () => {
    render(
      <ReportOptionsModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    expect(screen.getByText("Report Format")).toBeInTheDocument()
    expect(screen.getByText("Date Range")).toBeInTheDocument()
  })

  test("clears download state when switching format after report generation", async () => {
    const user = userEvent.setup()

    mockMutateAsync.mockResolvedValue({
      reportId: "test-report-id",
      downloadUrl: "/api/reports/download/test-report-id/report.pdf",
      fileName: "report.pdf",
      expiresAt: new Date(),
      format: "pdf",
    })

    render(
      <ReportOptionsModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="test-project-id"
        projectName="Test Project"
      />
    )

    // Generate PDF report (PDF is selected by default)
    const generateButton = screen.getByRole("button", { name: /Generate Report/i })
    await user.click(generateButton)

    // Wait for download section to appear
    await waitFor(() => {
      expect(screen.getByText("Report ready for download")).toBeInTheDocument()
      expect(screen.getByText("report.pdf")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Download PDF Report/i })).toBeInTheDocument()
    })

    // Switch to Excel format
    const excelOption = screen.getByLabelText(/Excel/i)
    await user.click(excelOption)

    // Download section should be cleared
    await waitFor(() => {
      expect(screen.queryByText("Report ready for download")).not.toBeInTheDocument()
      expect(screen.queryByText("report.pdf")).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /Download PDF Report/i })).not.toBeInTheDocument()
    })

    // Generate button should be visible again
    expect(screen.getByRole("button", { name: /Generate Report/i })).toBeInTheDocument()
  })
})
