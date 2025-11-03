/**
 * Tests for notification navigation utility
 * Story 8.1: In-App Notification System (AC #10, #11)
 */

import { describe, it, expect } from "vitest"
import { getNotificationNavigationUrl, isNavigableNotification } from "../notification-navigation"

describe("notification-navigation", () => {
  describe("getNotificationNavigationUrl", () => {
    it("generates URL for cost notification", () => {
      const url = getNotificationNavigationUrl({
        entityType: "cost",
        entityId: "cost-123",
        projectId: "project-456",
      })

      expect(url).toBe("/projects/project-456?tab=costs&costId=cost-123")
    })

    it("generates URL for document notification", () => {
      const url = getNotificationNavigationUrl({
        entityType: "document",
        entityId: "doc-123",
        projectId: "project-456",
      })

      expect(url).toBe("/projects/project-456?tab=documents")
    })

    it("generates URL for event notification", () => {
      const url = getNotificationNavigationUrl({
        entityType: "event",
        entityId: "event-123",
        projectId: "project-456",
      })

      expect(url).toBe("/projects/project-456?tab=timeline")
    })

    it("generates URL for project notification", () => {
      const url = getNotificationNavigationUrl({
        entityType: "project",
        entityId: "project-123",
        projectId: "project-123",
      })

      expect(url).toBe("/projects/project-123")
    })

    it("fallback to project page for unknown entity type", () => {
      const url = getNotificationNavigationUrl({
        entityType: "unknown",
        entityId: "unknown-123",
        projectId: "project-456",
      })

      expect(url).toBe("/projects/project-456")
    })

    it("navigates to projects list when projectId is null", () => {
      const url = getNotificationNavigationUrl({
        entityType: "cost",
        entityId: "cost-123",
        projectId: null,
      })

      expect(url).toBe("/projects")
    })
  })

  describe("isNavigableNotification", () => {
    it("returns true for navigable entity types", () => {
      expect(isNavigableNotification("cost")).toBe(true)
      expect(isNavigableNotification("document")).toBe(true)
      expect(isNavigableNotification("event")).toBe(true)
      expect(isNavigableNotification("project")).toBe(true)
    })

    it("returns false for unknown entity types", () => {
      expect(isNavigableNotification("unknown")).toBe(false)
      expect(isNavigableNotification("comment")).toBe(false)
    })
  })
})
