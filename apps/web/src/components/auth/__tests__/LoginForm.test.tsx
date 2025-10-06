import React from "react"
import { describe, it, expect, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { LoginForm } from "../LoginForm"

describe("LoginForm", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders login form fields", () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
  })

  it("has email input with correct type", () => {
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    expect(emailInput).toHaveAttribute("type", "email")
  })

  it("has password input with correct type", () => {
    render(<LoginForm />)

    const passwordInput = screen.getByLabelText(/password/i)
    expect(passwordInput).toHaveAttribute("type", "password")
  })

  it("has remember me checkbox", () => {
    render(<LoginForm />)

    const checkbox = screen.getByRole("checkbox", { name: /remember me/i })
    expect(checkbox).toBeInTheDocument()
  })

  it("marks email as required", () => {
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    expect(emailInput).toHaveAttribute("aria-invalid", "false")
  })

  it("marks password as required", () => {
    render(<LoginForm />)

    const passwordInput = screen.getByLabelText(/password/i)
    expect(passwordInput).toHaveAttribute("aria-invalid", "false")
  })
})
