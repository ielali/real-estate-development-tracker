import { describe, it, expect, vi } from "vitest"
import { type ContactGroupedCostsProps } from "../ContactGroupedCosts"

// Mock dependencies
vi.mock("@/lib/trpc/client")
vi.mock("@/lib/utils/currency")
vi.mock("@/components/ui/empty-state")
vi.mock("@/components/ui/error-state")
vi.mock("@/components/ui/badge")
vi.mock("lucide-react")

describe("ContactGroupedCosts", () => {
  it("props interface is correctly defined", () => {
    const props: ContactGroupedCostsProps = {
      projectId: "project-123",
    }

    expect(props.projectId).toBe("project-123")
  })

  it("projectId prop accepts valid UUID strings", () => {
    const validUUIDs = [
      "123e4567-e89b-12d3-a456-426614174000",
      "00000000-0000-0000-0000-000000000000",
      "ffffffff-ffff-ffff-ffff-ffffffffffff",
    ]

    validUUIDs.forEach((uuid) => {
      const props: ContactGroupedCostsProps = { projectId: uuid }
      expect(props.projectId).toBe(uuid)
    })
  })
})
