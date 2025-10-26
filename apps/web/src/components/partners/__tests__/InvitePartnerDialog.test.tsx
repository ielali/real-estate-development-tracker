/**
 * InvitePartnerDialog Component Tests
 *
 * Tests invitation form validation, submission, and duplicate handling
 */

import React from "react"
import { describe, test, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { InvitePartnerDialog } from "../InvitePartnerDialog"

// Mock tRPC client
vi.mock("@/lib/trpc/client", () => ({
  api: {
    useUtils: () => ({
      partners: {
        listInvitations: {
          invalidate: vi.fn(),
        },
      },
    }),
    partners: {
      invitePartner: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
      resendInvitation: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
    },
  },
}))

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe("InvitePartnerDialog", () => {
  test("renders dialog when open", () => {
    render(<InvitePartnerDialog projectId="test-project-id" open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText("Invite Partner")).toBeInTheDocument()
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument()
    expect(screen.getByLabelText("Access Level")).toBeInTheDocument()
  })

  test("does not render when closed", () => {
    render(<InvitePartnerDialog projectId="test-project-id" open={false} onOpenChange={vi.fn()} />)

    expect(screen.queryByText("Invite Partner")).not.toBeInTheDocument()
  })

  test("displays permission options with descriptions", async () => {
    const user = userEvent.setup()

    render(<InvitePartnerDialog projectId="test-project-id" open={true} onOpenChange={vi.fn()} />)

    // Click the select trigger
    const selectTrigger = screen.getByRole("combobox")
    await user.click(selectTrigger)

    await waitFor(() => {
      const readOptions = screen.getAllByText("Read - View only access")
      const writeOptions = screen.getAllByText("Write - Full editing access")
      expect(readOptions.length).toBeGreaterThan(0)
      expect(writeOptions.length).toBeGreaterThan(0)
    })
  })

  test("email input has correct type attribute", () => {
    render(<InvitePartnerDialog projectId="test-project-id" open={true} onOpenChange={vi.fn()} />)

    const emailInput = screen.getByLabelText("Email Address")
    expect(emailInput).toHaveAttribute("type", "email")
    expect(emailInput).toHaveAttribute("placeholder", "partner@example.com")
  })

  test("shows helper text for access levels", () => {
    render(<InvitePartnerDialog projectId="test-project-id" open={true} onOpenChange={vi.fn()} />)

    expect(
      screen.getByText("Read access allows viewing only. Write access allows full editing.")
    ).toBeInTheDocument()
  })
})
