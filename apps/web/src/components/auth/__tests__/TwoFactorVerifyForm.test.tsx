import React from "react"
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest"
import { render, screen, cleanup, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { TwoFactorVerifyForm } from "../TwoFactorVerifyForm"

// Mock auth client
const mockVerifyTotp = vi.fn()
const mockUseRouter = vi.fn()

vi.mock("@/lib/auth-client", () => ({
  twoFactor: {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    verifyTotp: (...args: any[]) => mockVerifyTotp(...args),
  },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockUseRouter,
    refresh: vi.fn(),
  }),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe("TwoFactorVerifyForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("renders verification code label", () => {
    render(<TwoFactorVerifyForm />)

    expect(screen.getByText("Verification Code")).toBeInTheDocument()
  })

  it("renders trust device checkbox", () => {
    render(<TwoFactorVerifyForm />)

    expect(screen.getByLabelText(/trust this device for 30 days/i)).toBeInTheDocument()
  })

  it("renders 6 digit input fields", () => {
    render(<TwoFactorVerifyForm />)

    // PinInput creates 6 separate inputs with aria-labels
    const digit1 = screen.getByLabelText("Digit 1")
    const digit6 = screen.getByLabelText("Digit 6")

    expect(digit1).toBeInTheDocument()
    expect(digit6).toBeInTheDocument()
  })

  it("renders use backup code button", () => {
    render(<TwoFactorVerifyForm />)

    expect(screen.getByRole("button", { name: /use a backup code instead/i })).toBeInTheDocument()
  })

  it("code input only accepts numbers", async () => {
    const user = userEvent.setup()
    render(<TwoFactorVerifyForm />)

    const input = screen.getByLabelText("Digit 1") as HTMLInputElement
    await user.type(input, "abc")

    // Should not accept letters (pattern="[0-9]*" on input)
    expect(input.value).toBe("")
  })

  it("auto-submits when all 6 digits entered", async () => {
    const user = userEvent.setup()
    mockVerifyTotp.mockResolvedValue({ data: { success: true } })

    render(<TwoFactorVerifyForm />)

    // Type 6 digits
    const digit1 = screen.getByLabelText("Digit 1")
    await user.type(digit1, "123456")

    // Should auto-submit via onComplete
    await waitFor(() => {
      expect(mockVerifyTotp).toHaveBeenCalledWith({
        code: "123456",
        trustDevice: false,
      })
    })
  })

  it("shows backup code button when onUseBackupCode provided", () => {
    const mockOnUseBackupCode = vi.fn()
    render(<TwoFactorVerifyForm onUseBackupCode={mockOnUseBackupCode} />)

    const backupButton = screen.getByRole("button", { name: /use a backup code instead/i })
    expect(backupButton).toBeInTheDocument()
  })

  it("calls verifyTotp with correct parameters including trustDevice", async () => {
    const user = userEvent.setup()
    mockVerifyTotp.mockResolvedValue({ data: { success: true } })

    render(<TwoFactorVerifyForm />)

    // Check the trust device checkbox
    const checkbox = screen.getByLabelText(/trust this device for 30 days/i)
    await user.click(checkbox)

    // Enter code
    const digit1 = screen.getByLabelText("Digit 1")
    await user.type(digit1, "123456")

    await waitFor(() => {
      expect(mockVerifyTotp).toHaveBeenCalledWith({
        code: "123456",
        trustDevice: true,
      })
    })
  })

  it("redirects to home on successful verification", async () => {
    const user = userEvent.setup()
    mockVerifyTotp.mockResolvedValue({ data: { success: true } })

    render(<TwoFactorVerifyForm />)

    const digit1 = screen.getByLabelText("Digit 1")
    await user.type(digit1, "123456")

    await waitFor(() => {
      expect(mockUseRouter).toHaveBeenCalledWith("/")
    })
  })

  it("displays error message on invalid code", async () => {
    const user = userEvent.setup()
    mockVerifyTotp.mockRejectedValue(new Error("Invalid code"))

    render(<TwoFactorVerifyForm />)

    const digit1 = screen.getByLabelText("Digit 1")
    await user.type(digit1, "123456")

    await waitFor(() => {
      expect(screen.getByText(/invalid code/i)).toBeInTheDocument()
    })
  })

  it("clears code inputs after failed verification", async () => {
    const user = userEvent.setup()
    mockVerifyTotp.mockRejectedValue(new Error("Invalid code"))

    render(<TwoFactorVerifyForm />)

    const digit1 = screen.getByLabelText("Digit 1") as HTMLInputElement
    await user.type(digit1, "123456")

    await waitFor(() => {
      // After error, code should be cleared
      expect(digit1.value).toBe("")
    })
  })

  it("disables inputs while verifying", async () => {
    const user = userEvent.setup()
    // Simulate slow verification
    mockVerifyTotp.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true } }), 100))
    )

    render(<TwoFactorVerifyForm />)

    const digit1 = screen.getByLabelText("Digit 1") as HTMLInputElement
    await user.type(digit1, "123456")

    // Check that inputs are disabled during verification
    await waitFor(() => {
      expect(digit1).toBeDisabled()
    })
  })

  it("shows loading spinner while verifying", async () => {
    const user = userEvent.setup()
    mockVerifyTotp.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true } }), 100))
    )

    render(<TwoFactorVerifyForm />)

    const digit1 = screen.getByLabelText("Digit 1")
    await user.type(digit1, "123456")

    await waitFor(() => {
      expect(screen.getByText(/verifying/i)).toBeInTheDocument()
    })
  })
})
