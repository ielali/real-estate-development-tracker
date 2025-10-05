import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { LoginForm } from "../LoginForm"
import { authClient } from "@/lib/auth-client"

// Mock the auth client
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
  },
}))

describe("LoginForm", () => {
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("renders login form fields", () => {
    render(<LoginForm onSuccess={mockOnSuccess} />)

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
  })

  it("validates required fields", async () => {
    render(<LoginForm onSuccess={mockOnSuccess} />)

    const submitButton = screen.getByRole("button", { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it("submits form with valid credentials", async () => {
    const mockSignIn = vi.mocked(authClient.signIn.email)
    mockSignIn.mockResolvedValueOnce({
      data: { user: { id: "1", email: "test@example.com" } },
      error: null,
    })

    render(<LoginForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole("button", { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.change(passwordInput, { target: { value: "password123" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        rememberMe: false,
      })
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it("displays error message on failed login", async () => {
    const mockSignIn = vi.mocked(authClient.signIn.email)
    mockSignIn.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid credentials" },
    })

    render(<LoginForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole("button", { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it("handles remember me checkbox", async () => {
    const mockSignIn = vi.mocked(authClient.signIn.email)
    mockSignIn.mockResolvedValueOnce({
      data: { user: { id: "1", email: "test@example.com" } },
      error: null,
    })

    render(<LoginForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const rememberCheckbox = screen.getByLabelText(/remember me/i)
    const submitButton = screen.getByRole("button", { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.change(passwordInput, { target: { value: "password123" } })
    fireEvent.click(rememberCheckbox)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        rememberMe: true,
      })
    })
  })
})
