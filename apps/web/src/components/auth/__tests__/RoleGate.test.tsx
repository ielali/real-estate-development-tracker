/**
 * RoleGate Component Tests
 * Story 4.2 - QA Fix (TEST-001)
 */

import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { RoleGate } from "../RoleGate"

// Mock useUserRole hook
vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: vi.fn(),
}))

import { useUserRole } from "@/hooks/useUserRole"

describe("RoleGate", () => {
  const AdminContent = () => <div>Admin Content</div>
  const FallbackContent = () => <div>Access Denied</div>

  it("renders children when user has required admin role", () => {
    vi.mocked(useUserRole).mockReturnValue({
      role: "admin",
      isAdmin: true,
      isPartner: false,
      isLoading: false,
    })

    render(
      <RoleGate allowedRoles={["admin"]}>
        <AdminContent />
      </RoleGate>
    )

    expect(screen.getByText("Admin Content")).toBeInTheDocument()
  })

  it("renders children when user has required partner role", () => {
    vi.mocked(useUserRole).mockReturnValue({
      role: "partner",
      isAdmin: false,
      isPartner: true,
      isLoading: false,
    })

    render(
      <RoleGate allowedRoles={["partner"]}>
        <div>Partner Content</div>
      </RoleGate>
    )

    expect(screen.getByText("Partner Content")).toBeInTheDocument()
  })

  it("renders children when user has one of multiple allowed roles", () => {
    vi.mocked(useUserRole).mockReturnValue({
      role: "partner",
      isAdmin: false,
      isPartner: true,
      isLoading: false,
    })

    render(
      <RoleGate allowedRoles={["admin", "partner"]}>
        <div>Both Roles Content</div>
      </RoleGate>
    )

    expect(screen.getByText("Both Roles Content")).toBeInTheDocument()
  })

  it("hides children when user does not have required role", () => {
    vi.mocked(useUserRole).mockReturnValue({
      role: "partner",
      isAdmin: false,
      isPartner: true,
      isLoading: false,
    })

    render(
      <RoleGate allowedRoles={["admin"]}>
        <AdminContent />
      </RoleGate>
    )

    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument()
  })

  it("renders fallback when user lacks required role", () => {
    vi.mocked(useUserRole).mockReturnValue({
      role: "partner",
      isAdmin: false,
      isPartner: true,
      isLoading: false,
    })

    render(
      <RoleGate allowedRoles={["admin"]} fallback={<FallbackContent />}>
        <AdminContent />
      </RoleGate>
    )

    expect(screen.getByText("Access Denied")).toBeInTheDocument()
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument()
  })

  it("hides children when user is not authenticated", () => {
    vi.mocked(useUserRole).mockReturnValue({
      role: null,
      isAdmin: false,
      isPartner: false,
      isLoading: false,
    })

    render(
      <RoleGate allowedRoles={["admin"]}>
        <AdminContent />
      </RoleGate>
    )

    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument()
  })

  it("renders nothing while loading to prevent flash", () => {
    vi.mocked(useUserRole).mockReturnValue({
      role: null,
      isAdmin: false,
      isPartner: false,
      isLoading: true,
    })

    const { container } = render(
      <RoleGate allowedRoles={["admin"]}>
        <AdminContent />
      </RoleGate>
    )

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument()
  })

  it("does not render fallback while loading", () => {
    vi.mocked(useUserRole).mockReturnValue({
      role: null,
      isAdmin: false,
      isPartner: false,
      isLoading: true,
    })

    const { container } = render(
      <RoleGate allowedRoles={["admin"]} fallback={<FallbackContent />}>
        <AdminContent />
      </RoleGate>
    )

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText("Access Denied")).not.toBeInTheDocument()
  })

  it("supports complex children content", () => {
    vi.mocked(useUserRole).mockReturnValue({
      role: "admin",
      isAdmin: true,
      isPartner: false,
      isLoading: false,
    })

    render(
      <RoleGate allowedRoles={["admin"]}>
        <div>
          <h1>Admin Dashboard</h1>
          <button>Delete All</button>
          <p>Sensitive information</p>
        </div>
      </RoleGate>
    )

    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument()
    expect(screen.getByText("Delete All")).toBeInTheDocument()
    expect(screen.getByText("Sensitive information")).toBeInTheDocument()
  })

  it("works with single allowed role array", () => {
    vi.mocked(useUserRole).mockReturnValue({
      role: "admin",
      isAdmin: true,
      isPartner: false,
      isLoading: false,
    })

    render(
      <RoleGate allowedRoles={["admin"]}>
        <div>Single Role Content</div>
      </RoleGate>
    )

    expect(screen.getByText("Single Role Content")).toBeInTheDocument()
  })
})
