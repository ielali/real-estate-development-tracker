import React from "react"
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { SecuritySettingsSection } from "../SecuritySettingsSection"

// Mock auth client
const mockUseSession = vi.fn()
const mockRefresh = vi.fn()

vi.mock("@/lib/auth-client", () => ({
  useSession: () => mockUseSession(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: mockRefresh,
  }),
}))

describe("SecuritySettingsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("shows 2FA disabled status when user has 2FA disabled", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
          twoFactorEnabled: false,
        },
      },
      isPending: false,
    })

    render(<SecuritySettingsSection />)

    expect(screen.getByRole("heading", { name: /two-factor authentication/i })).toBeInTheDocument()
    expect(screen.getByText(/disabled/i)).toBeInTheDocument()
  })

  it("shows 2FA enabled status when user has 2FA enabled", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
          twoFactorEnabled: true,
        },
      },
      isPending: false,
    })

    render(<SecuritySettingsSection />)

    expect(screen.getByText(/enabled/i)).toBeInTheDocument()
  })

  it("shows enable button when 2FA is disabled", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
          twoFactorEnabled: false,
        },
      },
      isPending: false,
    })

    render(<SecuritySettingsSection />)

    expect(
      screen.getByRole("button", { name: /enable two-factor authentication/i })
    ).toBeInTheDocument()
  })

  it("shows disable and manage buttons when 2FA is enabled", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
          twoFactorEnabled: true,
        },
      },
      isPending: false,
    })

    render(<SecuritySettingsSection />)

    expect(
      screen.getByRole("button", { name: /disable two-factor authentication/i })
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /backup codes/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /trusted devices/i })).toBeInTheDocument()
  })

  it("opens setup dialog when enable button clicked", async () => {
    const user = userEvent.setup()
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
          twoFactorEnabled: false,
        },
      },
      isPending: false,
    })

    render(<SecuritySettingsSection />)

    const enableButton = screen.getByRole("button", { name: /enable two-factor authentication/i })
    await user.click(enableButton)

    // Dialog should open with title
    expect(
      screen.getByRole("heading", { name: /enable two-factor authentication/i })
    ).toBeInTheDocument()
  })

  it("opens disable dialog when disable button clicked", async () => {
    const user = userEvent.setup()
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
          twoFactorEnabled: true,
        },
      },
      isPending: false,
    })

    render(<SecuritySettingsSection />)

    const disableButton = screen.getByRole("button", { name: /disable two-factor authentication/i })
    await user.click(disableButton)

    // Dialog should open with title
    expect(
      screen.getByRole("heading", { name: /disable two-factor authentication/i })
    ).toBeInTheDocument()
  })

  it("shows loading state while session is pending", () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    })

    render(<SecuritySettingsSection />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it("displays security description", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
          twoFactorEnabled: false,
        },
      },
      isPending: false,
    })

    render(<SecuritySettingsSection />)

    expect(screen.getByText(/add an extra layer of security/i)).toBeInTheDocument()
  })
})
