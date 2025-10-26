/**
 * useProjectPermission Hook Tests
 * Story 4.2 - QA Fix (TEST-001)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { useProjectPermission } from "../useProjectPermission"

// Mock the API
vi.mock("@/lib/trpc/client", () => ({
  api: {
    projects: {
      getById: {
        useQuery: vi.fn(),
      },
    },
  },
}))

import { api } from "@/lib/trpc/client"

describe("useProjectPermission", () => {
  const mockProjectId = "test-project-123"

  it("returns owner permissions for project owners", () => {
    vi.mocked(api.projects.getById.useQuery).mockReturnValue({
      data: {
        id: mockProjectId,
        name: "Test Project",
        userPermission: "write",
        access: "owner",
      },
      isLoading: false,
    } as any)

    const { result } = renderHook(() => useProjectPermission(mockProjectId))

    expect(result.current.level).toBe("owner")
    expect(result.current.canView).toBe(true)
    expect(result.current.canEdit).toBe(true)
    expect(result.current.canDelete).toBe(true)
    expect(result.current.canInvite).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it("returns write permissions for partners with write access", () => {
    vi.mocked(api.projects.getById.useQuery).mockReturnValue({
      data: {
        id: mockProjectId,
        name: "Test Project",
        userPermission: "write",
        access: "partner",
      },
      isLoading: false,
    } as any)

    const { result } = renderHook(() => useProjectPermission(mockProjectId))

    expect(result.current.level).toBe("write")
    expect(result.current.canView).toBe(true)
    expect(result.current.canEdit).toBe(true)
    expect(result.current.canDelete).toBe(false)
    expect(result.current.canInvite).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it("returns read permissions for partners with read-only access", () => {
    vi.mocked(api.projects.getById.useQuery).mockReturnValue({
      data: {
        id: mockProjectId,
        name: "Test Project",
        userPermission: "read",
        access: "partner",
      },
      isLoading: false,
    } as any)

    const { result } = renderHook(() => useProjectPermission(mockProjectId))

    expect(result.current.level).toBe("read")
    expect(result.current.canView).toBe(true)
    expect(result.current.canEdit).toBe(false)
    expect(result.current.canDelete).toBe(false)
    expect(result.current.canInvite).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it("returns none permissions when project data is not available", () => {
    vi.mocked(api.projects.getById.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any)

    const { result } = renderHook(() => useProjectPermission(mockProjectId))

    expect(result.current.level).toBe("none")
    expect(result.current.canView).toBe(false)
    expect(result.current.canEdit).toBe(false)
    expect(result.current.canDelete).toBe(false)
    expect(result.current.canInvite).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it("returns loading state while fetching project", () => {
    vi.mocked(api.projects.getById.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    const { result } = renderHook(() => useProjectPermission(mockProjectId))

    expect(result.current.isLoading).toBe(true)
  })

  it("enables query only when projectId is provided", () => {
    const projectId = "valid-id"

    vi.mocked(api.projects.getById.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any)

    renderHook(() => useProjectPermission(projectId))

    expect(api.projects.getById.useQuery).toHaveBeenCalledWith(
      { id: projectId },
      expect.objectContaining({
        enabled: true,
      })
    )
  })

  it("caches permission data for 5 minutes", () => {
    const projectId = "cached-project"

    vi.mocked(api.projects.getById.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any)

    renderHook(() => useProjectPermission(projectId))

    expect(api.projects.getById.useQuery).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
    )
  })
})
