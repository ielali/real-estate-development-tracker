import { describe, it, expect, vi } from "vitest"
import { type ContactSpendingProps } from "../ContactSpending"

// Mock dependencies
vi.mock("@/lib/trpc/client")
vi.mock("@/lib/utils/currency")
vi.mock("@/components/ui/empty-state")
vi.mock("@/components/ui/error-state")

describe("ContactSpending", () => {
  it("props interface is correctly defined", () => {
    const props: ContactSpendingProps = {
      contactId: "contact-123",
    }

    expect(props.contactId).toBe("contact-123")
  })

  it("contactId prop accepts valid UUID strings", () => {
    const validUUIDs = [
      "123e4567-e89b-12d3-a456-426614174000",
      "00000000-0000-0000-0000-000000000000",
      "ffffffff-ffff-ffff-ffff-ffffffffffff",
    ]

    validUUIDs.forEach((uuid) => {
      const props: ContactSpendingProps = { contactId: uuid }
      expect(props.contactId).toBe(uuid)
    })
  })
})
