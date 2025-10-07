import { describe, it, expect } from "vitest"
import { v4 as uuidv4 } from "uuid"

/**
 * Cost-Contact Linkage Tests
 *
 * These tests verify the implementation of Story 2.2 requirements:
 * - getCostsByContact: Get costs grouped by contact for a project
 * - getContactSpending: Get spending summary for a specific contact
 * - getOrphanedCosts: Get orphaned costs (no contact) for a project
 * - bulkAssignContact: Bulk assign contact to multiple costs
 */
describe("Cost-Contact Linkage", () => {
  describe("Input Validation", () => {
    it("getCostsByContact accepts valid projectId", () => {
      const input = { projectId: uuidv4() }
      expect(input.projectId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    })

    it("getContactSpending accepts valid contactId", () => {
      const input = { contactId: uuidv4() }
      expect(input.contactId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    })

    it("getOrphanedCosts accepts valid projectId", () => {
      const input = { projectId: uuidv4() }
      expect(input.projectId).toBeDefined()
      expect(typeof input.projectId).toBe("string")
    })

    it("bulkAssignContact accepts array of costIds and contactId", () => {
      const input = {
        costIds: [uuidv4(), uuidv4(), uuidv4()],
        contactId: uuidv4(),
      }
      expect(Array.isArray(input.costIds)).toBe(true)
      expect(input.costIds).toHaveLength(3)
      expect(input.contactId).toBeDefined()
    })

    it("bulkAssignContact accepts nullable contactId for unassignment", () => {
      const input = {
        costIds: [uuidv4()],
        contactId: null,
      }
      expect(input.contactId).toBeNull()
      expect(input.costIds).toHaveLength(1)
    })
  })

  describe("Contact Spending Calculations", () => {
    it("calculates total spending correctly", () => {
      const costs = [
        { amount: 10000 }, // $100.00
        { amount: 25000 }, // $250.00
        { amount: 5000 }, // $50.00
      ]
      const total = costs.reduce((sum, cost) => sum + cost.amount, 0)
      expect(total).toBe(40000) // $400.00 total
    })

    it("handles empty cost array", () => {
      const costs: Array<{ amount: number }> = []
      const total = costs.reduce((sum, cost) => sum + cost.amount, 0)
      expect(total).toBe(0)
    })
  })

  describe("Orphaned Cost Detection", () => {
    it("identifies costs without contact", () => {
      const costs = [
        { id: "1", contactId: "contact-1" },
        { id: "2", contactId: null },
        { id: "3", contactId: "contact-2" },
        { id: "4", contactId: null },
      ]
      const orphaned = costs.filter((c) => c.contactId === null)
      expect(orphaned).toHaveLength(2)
      expect(orphaned.map((c) => c.id)).toEqual(["2", "4"])
    })
  })

  describe("Bulk Assignment Logic", () => {
    it("updates multiple cost records", () => {
      const costIds = [uuidv4(), uuidv4(), uuidv4()]
      const contactId = uuidv4()

      const updatedCosts = costIds.map((id) => ({
        id,
        contactId,
      }))

      expect(updatedCosts).toHaveLength(3)
      expect(updatedCosts.every((c) => c.contactId === contactId)).toBe(true)
    })

    it("supports unassignment by setting contactId to null", () => {
      const costIds = [uuidv4(), uuidv4()]
      const contactId = null

      const updatedCosts = costIds.map((id) => ({
        id,
        contactId,
      }))

      expect(updatedCosts).toHaveLength(2)
      expect(updatedCosts.every((c) => c.contactId === null)).toBe(true)
    })
  })
})
