/**
 * useUserRole Hook Tests
 * Story 4.2 - QA Fix (TEST-001)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { useUserRole } from "../useUserRole"

// Mock the auth client
vi.mock("@/lib/auth-client", () => ({
  useSession: vi.fn(),
}))

import { useSession } from "@/lib/auth-client"

describe("useUserRole", () => {
  it("returns admin role when user is admin", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "test-user-1",
          email: "admin@example.com",
          role: "admin",
        },
      },
      isPending: false,
    } as any)

    const { result } = renderHook(() => useUserRole())

    expect(result.current.role).toBe("admin")
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isPartner).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it("returns partner role when user is partner", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "test-user-2",
          email: "partner@example.com",
          role: "partner",
        },
      },
      isPending: false,
    } as any)

    const { result } = renderHook(() => useUserRole())

    expect(result.current.role).toBe("partner")
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isPartner).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it("returns null role when user is not authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any)

    const { result } = renderHook(() => useUserRole())

    expect(result.current.role).toBe(null)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isPartner).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it("returns loading state when session is pending", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: true,
    } as any)

    const { result } = renderHook(() => useUserRole())

    expect(result.current.role).toBe(null)
    expect(result.current.isLoading).toBe(true)
  })

  it("handles undefined session data gracefully", () => {
    vi.mocked(useSession).mockReturnValue({
      data: undefined,
      isPending: false,
    } as any)

    const { result } = renderHook(() => useUserRole())

    expect(result.current.role).toBe(null)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isPartner).toBe(false)
  })
})
