import React from "react"
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest"
import { render, screen, cleanup, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { ProfileSettingsSection } from "../ProfileSettingsSection"

// Mock auth client
const mockUseSession = vi.fn()
const mockInvalidate = vi.fn()
const mockMutate = vi.fn()

vi.mock("@/lib/auth-client", () => ({
  useSession: () => mockUseSession(),
}))

vi.mock("@/lib/trpc/client", () => ({
  api: {
    users: {
      updateProfile: {
        useMutation: () => ({
          mutate: mockMutate,
          isPending: false,
        }),
      },
    },
    useUtils: () => ({
      invalidate: mockInvalidate,
    }),
  },
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe("ProfileSettingsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("displays user profile information", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          role: "partner",
          emailVerified: true,
        },
      },
      isPending: false,
    })

    render(<ProfileSettingsSection />)

    expect(screen.getByLabelText(/first name/i)).toHaveValue("John")
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Doe")
    expect(screen.getByText("test@example.com")).toBeInTheDocument()
  })

  it("displays email verified badge when email is verified", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          role: "partner",
          emailVerified: true,
        },
      },
      isPending: false,
    })

    render(<ProfileSettingsSection />)

    expect(screen.getByText(/verified/i)).toBeInTheDocument()
  })

  it("displays user role", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          role: "partner",
          emailVerified: false,
        },
      },
      isPending: false,
    })

    render(<ProfileSettingsSection />)

    // Look for the role heading first, then get the role text
    const roleSection = screen.getByText("Role").parentElement?.parentElement
    expect(roleSection).toBeDefined()
    // The role value should be capitalized "partner"
    const roleElements = screen.getAllByText(/^partner$/i)
    expect(roleElements.length).toBeGreaterThan(0)
  })

  it("save button is disabled when form is not dirty", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          role: "partner",
          emailVerified: false,
        },
      },
      isPending: false,
    })

    render(<ProfileSettingsSection />)

    const saveButton = screen.getByRole("button", { name: /save changes/i })
    expect(saveButton).toBeDisabled()
  })

  it("enables save button when form is modified", async () => {
    const user = userEvent.setup()
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          role: "partner",
          emailVerified: false,
        },
      },
      isPending: false,
    })

    render(<ProfileSettingsSection />)

    const firstNameInput = screen.getByLabelText(/first name/i)
    await user.clear(firstNameInput)
    await user.type(firstNameInput, "Jane")

    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: /save changes/i })
      expect(saveButton).not.toBeDisabled()
    })
  })

  it("shows loading state while session is pending", () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    })

    render(<ProfileSettingsSection />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it("displays message about changing email address", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          role: "partner",
          emailVerified: false,
        },
      },
      isPending: false,
    })

    render(<ProfileSettingsSection />)

    expect(
      screen.getByText(/to change your email address, please contact support/i)
    ).toBeInTheDocument()
  })
})
