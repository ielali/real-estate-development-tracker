/**
 * useAccessibleProjects Hook Tests
 * Story 4.2 - QA Fix (TEST-001)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { useAccessibleProjects } from "../useAccessibleProjects"

// Mock the API
vi.mock("@/lib/trpc/client", () => ({
  api: {
    projects: {
      list: {
        useQuery: vi.fn(),
      },
    },
  },
}))

import { api } from "@/lib/trpc/client"

describe("useAccessibleProjects", () => {
  it("returns owned and partner projects", () => {
    const mockProjects = [
      {
        id: "project-1",
        name: "Owned Project",
        description: "My own project",
        status: "active",
        projectType: "renovation",
        userPermission: "write",
        access: "owner",
        address: {
          id: "addr-1",
          formattedAddress: "123 Main St, Sydney NSW 2000",
        },
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-15"),
      },
      {
        id: "project-2",
        name: "Partner Project",
        description: "Shared with me",
        status: "planning",
        projectType: "new_build",
        userPermission: "read",
        access: "partner",
        address: {
          id: "addr-2",
          formattedAddress: "456 Park Ave, Melbourne VIC 3000",
        },
        createdAt: new Date("2025-02-01"),
        updatedAt: new Date("2025-02-10"),
      },
    ]

    vi.mocked(api.projects.list.useQuery).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    const { result } = renderHook(() => useAccessibleProjects())

    expect(result.current.projects).toHaveLength(2)
    expect(result.current.projects[0].access).toBe("owner")
    expect(result.current.projects[1].access).toBe("partner")
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it("returns empty array when no projects available", () => {
    vi.mocked(api.projects.list.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    const { result } = renderHook(() => useAccessibleProjects())

    expect(result.current.projects).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it("returns loading state while fetching projects", () => {
    vi.mocked(api.projects.list.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any)

    const { result } = renderHook(() => useAccessibleProjects())

    expect(result.current.projects).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it("returns error when API call fails", () => {
    const mockError = new Error("Failed to fetch projects")

    vi.mocked(api.projects.list.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refetch: vi.fn(),
    } as any)

    const { result } = renderHook(() => useAccessibleProjects())

    expect(result.current.error).toBe(mockError)
    expect(result.current.projects).toEqual([])
  })

  it("provides refetch function", () => {
    const mockRefetch = vi.fn()

    vi.mocked(api.projects.list.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any)

    const { result } = renderHook(() => useAccessibleProjects())

    expect(result.current.refetch).toBeDefined()
    result.current.refetch()
    expect(mockRefetch).toHaveBeenCalled()
  })

  it("caches project list for 2 minutes", () => {
    vi.mocked(api.projects.list.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    renderHook(() => useAccessibleProjects())

    expect(api.projects.list.useQuery).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        staleTime: 2 * 60 * 1000, // 2 minutes
      })
    )
  })

  it("includes permission metadata for each project", () => {
    const mockProjects = [
      {
        id: "project-1",
        name: "Test Project",
        description: null,
        status: "active",
        projectType: "development",
        userPermission: "write",
        access: "owner",
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    vi.mocked(api.projects.list.useQuery).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    const { result } = renderHook(() => useAccessibleProjects())

    const project = result.current.projects[0]
    expect(project.userPermission).toBeDefined()
    expect(project.access).toBeDefined()
    expect(["owner", "partner"]).toContain(project.access)
    expect(["read", "write"]).toContain(project.userPermission)
  })
})
