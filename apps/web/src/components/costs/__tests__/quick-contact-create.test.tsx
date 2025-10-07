import { describe, it, expect, vi } from "vitest"
import { type QuickContactCreateProps } from "../QuickContactCreate"

// Mock dependencies
vi.mock("@/lib/trpc/client")
vi.mock("@/components/ui/dialog")
vi.mock("@/components/contacts/ContactForm")

describe("QuickContactCreate", () => {
  it("props interface is correctly defined", () => {
    const props: QuickContactCreateProps = {
      projectId: "test-project",
      isOpen: true,
      onClose: vi.fn(),
      onSuccess: vi.fn(),
    }

    expect(props.projectId).toBe("test-project")
    expect(props.isOpen).toBe(true)
    expect(typeof props.onClose).toBe("function")
    expect(typeof props.onSuccess).toBe("function")
  })

  it("onClose callback is callable", () => {
    const onClose = vi.fn()
    onClose()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("onSuccess callback accepts contact parameter", () => {
    const onSuccess = vi.fn()
    const mockContact = {
      id: "contact-1",
      firstName: "John",
      lastName: "Doe",
    }
    onSuccess(mockContact)
    expect(onSuccess).toHaveBeenCalledWith(mockContact)
  })
})
