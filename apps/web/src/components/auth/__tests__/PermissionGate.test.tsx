/**
 * PermissionGate Component Tests
 * Story 4.2 - QA Fix (TEST-001)
 */

import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { PermissionGate } from "../PermissionGate"

// Mock useProjectPermission hook
vi.mock("@/hooks/useProjectPermission", () => ({
  useProjectPermission: vi.fn(),
}))

import { useProjectPermission } from "@/hooks/useProjectPermission"

describe("PermissionGate", () => {
  const mockProjectId = "test-project-123"
  const EditButton = () => <button>Edit</button>
  const DeleteButton = () => <button>Delete</button>
  const ReadOnlyMessage = () => <div>View-only access</div>

  it("renders children when user has owner permission", () => {
    vi.mocked(useProjectPermission).mockReturnValue({
      level: "owner",
      canView: true,
      canEdit: true,
      canDelete: true,
      canInvite: true,
      isLoading: false,
    })

    render(
      <PermissionGate projectId={mockProjectId} requiredPermission="owner">
        <DeleteButton />
      </PermissionGate>
    )

    expect(screen.getByText("Delete")).toBeInTheDocument()
  })

  it("renders children when user has write permission and requires write", () => {
    vi.mocked(useProjectPermission).mockReturnValue({
      level: "write",
      canView: true,
      canEdit: true,
      canDelete: false,
      canInvite: false,
      isLoading: false,
    })

    render(
      <PermissionGate projectId={mockProjectId} requiredPermission="write">
        <EditButton />
      </PermissionGate>
    )

    expect(screen.getByText("Edit")).toBeInTheDocument()
  })

  it("renders children when user has read permission and requires read", () => {
    vi.mocked(useProjectPermission).mockReturnValue({
      level: "read",
      canView: true,
      canEdit: false,
      canDelete: false,
      canInvite: false,
      isLoading: false,
    })

    render(
      <PermissionGate projectId={mockProjectId} requiredPermission="read">
        <div>View Project</div>
      </PermissionGate>
    )

    expect(screen.getByText("View Project")).toBeInTheDocument()
  })

  it("hides children when user has read but requires write", () => {
    vi.mocked(useProjectPermission).mockReturnValue({
      level: "read",
      canView: true,
      canEdit: false,
      canDelete: false,
      canInvite: false,
      isLoading: false,
    })

    render(
      <PermissionGate projectId={mockProjectId} requiredPermission="write">
        <EditButton />
      </PermissionGate>
    )

    expect(screen.queryByText("Edit")).not.toBeInTheDocument()
  })

  it("hides children when user has write but requires owner", () => {
    vi.mocked(useProjectPermission).mockReturnValue({
      level: "write",
      canView: true,
      canEdit: true,
      canDelete: false,
      canInvite: false,
      isLoading: false,
    })

    render(
      <PermissionGate projectId={mockProjectId} requiredPermission="owner">
        <DeleteButton />
      </PermissionGate>
    )

    expect(screen.queryByText("Delete")).not.toBeInTheDocument()
  })

  it("hides children when user has no permission", () => {
    vi.mocked(useProjectPermission).mockReturnValue({
      level: "none",
      canView: false,
      canEdit: false,
      canDelete: false,
      canInvite: false,
      isLoading: false,
    })

    render(
      <PermissionGate projectId={mockProjectId} requiredPermission="read">
        <div>View Project</div>
      </PermissionGate>
    )

    expect(screen.queryByText("View Project")).not.toBeInTheDocument()
  })

  it("renders fallback when permission is insufficient", () => {
    vi.mocked(useProjectPermission).mockReturnValue({
      level: "read",
      canView: true,
      canEdit: false,
      canDelete: false,
      canInvite: false,
      isLoading: false,
    })

    render(
      <PermissionGate
        projectId={mockProjectId}
        requiredPermission="write"
        fallback={<ReadOnlyMessage />}
      >
        <EditButton />
      </PermissionGate>
    )

    expect(screen.getByText("View-only access")).toBeInTheDocument()
    expect(screen.queryByText("Edit")).not.toBeInTheDocument()
  })

  it("renders nothing while loading to prevent flash", () => {
    vi.mocked(useProjectPermission).mockReturnValue({
      level: "none",
      canView: false,
      canEdit: false,
      canDelete: false,
      canInvite: false,
      isLoading: true,
    })

    const { container } = render(
      <PermissionGate projectId={mockProjectId} requiredPermission="owner">
        <DeleteButton />
      </PermissionGate>
    )

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText("Delete")).not.toBeInTheDocument()
  })

  it("respects permission hierarchy - owner > write > read", () => {
    // Owner can access write-required content
    vi.mocked(useProjectPermission).mockReturnValue({
      level: "owner",
      canView: true,
      canEdit: true,
      canDelete: true,
      canInvite: true,
      isLoading: false,
    })

    const { rerender } = render(
      <PermissionGate projectId={mockProjectId} requiredPermission="write">
        <EditButton />
      </PermissionGate>
    )

    expect(screen.getByText("Edit")).toBeInTheDocument()

    // Write can access read-required content
    vi.mocked(useProjectPermission).mockReturnValue({
      level: "write",
      canView: true,
      canEdit: true,
      canDelete: false,
      canInvite: false,
      isLoading: false,
    })

    rerender(
      <PermissionGate projectId={mockProjectId} requiredPermission="read">
        <div>View Content</div>
      </PermissionGate>
    )

    expect(screen.getByText("View Content")).toBeInTheDocument()
  })

  it("passes projectId to useProjectPermission hook", () => {
    const customProjectId = "custom-project-456"

    vi.mocked(useProjectPermission).mockReturnValue({
      level: "owner",
      canView: true,
      canEdit: true,
      canDelete: true,
      canInvite: true,
      isLoading: false,
    })

    render(
      <PermissionGate projectId={customProjectId} requiredPermission="read">
        <div>Content</div>
      </PermissionGate>
    )

    expect(useProjectPermission).toHaveBeenCalledWith(customProjectId)
  })

  it("supports complex permission scenarios", () => {
    vi.mocked(useProjectPermission).mockReturnValue({
      level: "write",
      canView: true,
      canEdit: true,
      canDelete: false,
      canInvite: false,
      isLoading: false,
    })

    render(
      <div>
        {/* Partner with write access should see edit controls */}
        <PermissionGate projectId={mockProjectId} requiredPermission="write">
          <button>Add Cost</button>
          <button>Upload Document</button>
        </PermissionGate>

        {/* But not owner-only controls */}
        <PermissionGate
          projectId={mockProjectId}
          requiredPermission="owner"
          fallback={<div>Owner only</div>}
        >
          <button>Delete Project</button>
        </PermissionGate>
      </div>
    )

    expect(screen.getByText("Add Cost")).toBeInTheDocument()
    expect(screen.getByText("Upload Document")).toBeInTheDocument()
    expect(screen.getByText("Owner only")).toBeInTheDocument()
    expect(screen.queryByText("Delete Project")).not.toBeInTheDocument()
  })
})
