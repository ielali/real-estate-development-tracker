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

  it("renders verification code input", () => {
    render(<TwoFactorVerifyForm />)

    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
  })

  it("renders trust device checkbox", () => {
    render(<TwoFactorVerifyForm />)

    expect(screen.getByLabelText(/remember this device/i)).toBeInTheDocument()
  })

  it("renders verify button", () => {
    render(<TwoFactorVerifyForm />)

    expect(screen.getByRole("button", { name: /verify code/i })).toBeInTheDocument()
  })

  it("renders use backup code button", () => {
    render(<TwoFactorVerifyForm />)

    expect(screen.getByRole("button", { name: /use backup code/i })).toBeInTheDocument()
  })

  it("code input only accepts numbers", async () => {
    const user = userEvent.setup()
    render(<TwoFactorVerifyForm />)

    const input = screen.getByLabelText(/verification code/i) as HTMLInputElement
    await user.type(input, "abc123def")

    // Should only have numbers
    expect(input.value).toBe("123")
  })

  it("code input limits to 6 digits", async () => {
    const user = userEvent.setup()
    render(<TwoFactorVerifyForm />)

    const input = screen.getByLabelText(/verification code/i) as HTMLInputElement
    await user.type(input, "1234567890")

    expect(input.value).toBe("123456")
  })

  it("verify button is disabled when code is less than 6 digits", () => {
    render(<TwoFactorVerifyForm />)

    const button = screen.getByRole("button", { name: /verify code/i })
    expect(button).toBeDisabled()
  })

  it("verify button is enabled when code is 6 digits", async () => {
    const user = userEvent.setup()
    render(<TwoFactorVerifyForm />)

    const input = screen.getByLabelText(/verification code/i)
    await user.type(input, "123456")

    const button = screen.getByRole("button", { name: /verify code/i })
    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })

  it("shows backup code input when use backup code button clicked", async () => {
    const user = userEvent.setup()
    render(<TwoFactorVerifyForm />)

    const backupButton = screen.getByRole("button", { name: /use backup code/i })
    await user.click(backupButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/backup code/i)).toBeInTheDocument()
    })
  })

  it("calls verifyTotp with correct parameters on submit", async () => {
    const user = userEvent.setup()
    mockVerifyTotp.mockResolvedValue({ data: { success: true } })

    render(<TwoFactorVerifyForm />)

    const input = screen.getByLabelText(/verification code/i)
    await user.type(input, "123456")

    const checkbox = screen.getByLabelText(/remember this device/i)
    await user.click(checkbox)

    const button = screen.getByRole("button", { name: /verify code/i })
    await user.click(button)

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

    const input = screen.getByLabelText(/verification code/i)
    await user.type(input, "123456")

    const button = screen.getByRole("button", { name: /verify code/i })
    await user.click(button)

    await waitFor(() => {
      expect(mockUseRouter).toHaveBeenCalledWith("/")
    })
  })

  it("displays error message on invalid code", async () => {
    const user = userEvent.setup()
    mockVerifyTotp.mockRejectedValue(new Error("Invalid code"))

    render(<TwoFactorVerifyForm />)

    const input = screen.getByLabelText(/verification code/i)
    await user.type(input, "123456")

    const button = screen.getByRole("button", { name: /verify code/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(/invalid code/i)).toBeInTheDocument()
    })
  })

  it("clears code input after failed verification", async () => {
    const user = userEvent.setup()
    mockVerifyTotp.mockRejectedValue(new Error("Invalid code"))

    render(<TwoFactorVerifyForm />)

    const input = screen.getByLabelText(/verification code/i) as HTMLInputElement
    await user.type(input, "123456")

    const button = screen.getByRole("button", { name: /verify code/i })
    await user.click(button)

    await waitFor(() => {
      expect(input.value).toBe("")
    })
  })
})
