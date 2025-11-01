import React from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { BackupCodesDisplay } from "../BackupCodesDisplay"

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock clipboard API
const mockWriteText = vi.fn(() => Promise.resolve())
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
  configurable: true,
})

describe("BackupCodesDisplay", () => {
  const mockCodes = [
    "AAAA-BBBB",
    "CCCC-DDDD",
    "EEEE-FFFF",
    "1111-2222",
    "3333-4444",
    "5555-6666",
    "7777-8888",
    "9999-0000",
    "ABCD-EFGH",
    "IJKL-MNOP",
  ]

  beforeEach(() => {
    mockWriteText.mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("renders all backup codes", () => {
    render(<BackupCodesDisplay codes={mockCodes} />)

    mockCodes.forEach((code) => {
      expect(screen.getByText(code)).toBeInTheDocument()
    })
  })

  it("displays security warning message", () => {
    render(<BackupCodesDisplay codes={mockCodes} />)

    expect(screen.getByText(/save these codes in a secure location/i)).toBeInTheDocument()
    expect(screen.getByText(/each code can be used once/i)).toBeInTheDocument()
  })

  it("renders copy and download buttons", () => {
    render(<BackupCodesDisplay codes={mockCodes} />)

    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument()
  })

  it("copies codes to clipboard when copy button clicked", async () => {
    const user = userEvent.setup()
    render(<BackupCodesDisplay codes={mockCodes} />)

    const copyButton = screen.getByRole("button", { name: /copy/i })
    await user.click(copyButton)

    expect(mockWriteText).toHaveBeenCalledWith(mockCodes.join("\n"))
  })

  it("shows backup codes in a monospace font", () => {
    render(<BackupCodesDisplay codes={mockCodes} />)

    const codeElements = screen.getAllByText(/[A-Z0-9]{4}-[A-Z0-9]{4}/)
    // font-mono is on the parent grid container, not individual elements
    const parentGrid = codeElements[0].parentElement
    expect(parentGrid).toHaveClass("font-mono")
  })

  it("renders warning icon", () => {
    render(<BackupCodesDisplay codes={mockCodes} />)

    // Check for alert warning presence via role
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("handles empty codes array gracefully", () => {
    render(<BackupCodesDisplay codes={[]} />)

    expect(screen.queryByText(/[A-Z0-9]{4}-[A-Z0-9]{4}/)).not.toBeInTheDocument()
  })
})
