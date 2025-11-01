/**
 * Security Activity Log Component Tests
 *
 * Story 6.3: Tests for security activity log UI component
 *
 * Test coverage:
 * - Component rendering in different states
 * - Event display and formatting
 * - IP address masking
 * - User agent parsing
 * - Error handling
 * - Loading states
 */

import React from "react"
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { SecurityActivityLog } from "../SecurityActivityLog"

// Mock the tRPC client
const mockUseQuery = vi.fn()

vi.mock("@/lib/trpc/client", () => ({
  api: {
    security: {
      getActivityLog: {
        useQuery: () => mockUseQuery(),
      },
    },
  },
}))

describe("SecurityActivityLog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe("Loading State", () => {
    it("shows loading message when data is loading", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(screen.getByText(/loading your recent security events/i)).toBeInTheDocument()
    })

    it("shows title and description while loading", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(screen.getByText(/security activity log/i)).toBeInTheDocument()
    })
  })

  describe("Error State", () => {
    it("shows error message when query fails", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: {
          message: "Failed to fetch security events",
        },
      })

      render(<SecurityActivityLog />)

      // QA Fix: Use getAllByText since "Error" appears in both CardDescription and AlertTitle
      const errorTexts = screen.getAllByText(/error/i)
      expect(errorTexts.length).toBeGreaterThan(0)
      expect(screen.getByText(/failed to fetch security events/i)).toBeInTheDocument()
    })

    it("shows generic error UI with alert component", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: {
          message: "Network error",
        },
      })

      render(<SecurityActivityLog />)

      expect(screen.getByRole("alert")).toBeInTheDocument()
    })
  })

  describe("Empty State", () => {
    it("shows empty state when no events exist", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(screen.getByText(/no events yet/i)).toBeInTheDocument()
      expect(
        screen.getByText(/security events like 2fa changes.*will be logged here/i)
      ).toBeInTheDocument()
    })

    it("shows informative message about what will be logged", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(
        screen.getByText(/2fa changes.*backup code usage.*backup downloads/i)
      ).toBeInTheDocument()
    })
  })

  describe("Event Display", () => {
    const mockEvents = [
      {
        id: "1",
        eventType: "2fa_enabled",
        timestamp: new Date("2024-10-27T10:00:00Z"),
        ipAddress: "203.0.113.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/118.0.0.0",
        metadata: null,
      },
      {
        id: "2",
        eventType: "backup_downloaded",
        timestamp: new Date("2024-10-27T11:00:00Z"),
        ipAddress: "203.0.113.2",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36",
        metadata: {
          projectId: "project-1",
          projectName: "Test Project",
        },
      },
    ]

    it("renders table with events", () => {
      mockUseQuery.mockReturnValue({
        data: mockEvents,
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(screen.getByRole("table")).toBeInTheDocument()
      expect(screen.getByText(/two-factor authentication enabled/i)).toBeInTheDocument()
      expect(screen.getByText(/project backup downloaded/i)).toBeInTheDocument()
    })

    it("displays correct column headers", () => {
      mockUseQuery.mockReturnValue({
        data: mockEvents,
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(screen.getByText(/event type/i)).toBeInTheDocument()
      expect(screen.getByText(/when/i)).toBeInTheDocument()
      expect(screen.getByText(/location/i)).toBeInTheDocument()
      expect(screen.getByText(/device/i)).toBeInTheDocument()
    })

    it("shows event count in description", () => {
      mockUseQuery.mockReturnValue({
        data: mockEvents,
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(screen.getByText(/last 2 security events/i)).toBeInTheDocument()
    })

    it("shows read-only message", () => {
      mockUseQuery.mockReturnValue({
        data: mockEvents,
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(screen.getByText(/read-only for security purposes/i)).toBeInTheDocument()
    })
  })

  describe("IP Address Masking", () => {
    it("masks last octet of IPv4 addresses", () => {
      const events = [
        {
          id: "1",
          eventType: "2fa_enabled",
          timestamp: new Date(),
          ipAddress: "192.168.1.100",
          userAgent: "Test Browser",
          metadata: null,
        },
      ]

      mockUseQuery.mockReturnValue({
        data: events,
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(screen.getByText(/192\.168\.1\.xxx/)).toBeInTheDocument()
      expect(screen.queryByText("192.168.1.100")).not.toBeInTheDocument()
    })

    it("shows 'Unknown Location' for unknown IP", () => {
      const events = [
        {
          id: "1",
          eventType: "2fa_enabled",
          timestamp: new Date(),
          ipAddress: "unknown",
          userAgent: "Test Browser",
          metadata: null,
        },
      ]

      mockUseQuery.mockReturnValue({
        data: events,
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(screen.getByText(/unknown location/i)).toBeInTheDocument()
    })
  })

  describe("User Agent Parsing", () => {
    it("extracts browser name from user agent", () => {
      const events = [
        {
          id: "1",
          eventType: "2fa_enabled",
          timestamp: new Date(),
          ipAddress: "203.0.113.1",
          userAgent: "Mozilla/5.0 Chrome/118.0.0.0 Safari/537.36",
          metadata: null,
        },
      ]

      mockUseQuery.mockReturnValue({
        data: events,
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(screen.getByText(/chrome/i)).toBeInTheDocument()
    })

    it("shows 'Unknown Device' for unknown user agent", () => {
      const events = [
        {
          id: "1",
          eventType: "2fa_enabled",
          timestamp: new Date(),
          ipAddress: "203.0.113.1",
          userAgent: "unknown",
          metadata: null,
        },
      ]

      mockUseQuery.mockReturnValue({
        data: events,
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(screen.getByText(/unknown device/i)).toBeInTheDocument()
    })
  })

  describe("Event Type Labels", () => {
    const eventTypes = [
      { type: "2fa_enabled", label: "Two-Factor Authentication Enabled" },
      { type: "2fa_disabled", label: "Two-Factor Authentication Disabled" },
      { type: "2fa_login_success", label: "Successful 2FA Login" },
      { type: "2fa_login_failure", label: "Failed 2FA Login Attempt" },
      { type: "backup_code_generated", label: "Backup Codes Generated" },
      { type: "backup_code_used", label: "Backup Code Used for Login" },
      { type: "backup_downloaded", label: "Project Backup Downloaded" },
    ]

    eventTypes.forEach(({ type, label }) => {
      it(`shows correct label for ${type}`, () => {
        const events = [
          {
            id: "1",
            eventType: type,
            timestamp: new Date(),
            ipAddress: "203.0.113.1",
            userAgent: "Test Browser",
            metadata: null,
          },
        ]

        mockUseQuery.mockReturnValue({
          data: events,
          isLoading: false,
          error: null,
        })

        render(<SecurityActivityLog />)

        expect(screen.getByText(new RegExp(label, "i"))).toBeInTheDocument()
      })
    })
  })

  describe("Event Type Icons", () => {
    it("shows shield icon for 2FA enabled/disabled", () => {
      const events = [
        {
          id: "1",
          eventType: "2fa_enabled",
          timestamp: new Date(),
          ipAddress: "203.0.113.1",
          userAgent: "Test Browser",
          metadata: null,
        },
      ]

      mockUseQuery.mockReturnValue({
        data: events,
        isLoading: false,
        error: null,
      })

      const { container } = render(<SecurityActivityLog />)

      // Shield icon should be present (lucide-react renders as svg)
      const icons = container.querySelectorAll("svg")
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe("Badge Variants", () => {
    it("displays event type in badge format", () => {
      const events = [
        {
          id: "1",
          eventType: "2fa_disabled",
          timestamp: new Date(),
          ipAddress: "203.0.113.1",
          userAgent: "Test Browser",
          metadata: null,
        },
      ]

      mockUseQuery.mockReturnValue({
        data: events,
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      // Event label should be displayed
      expect(screen.getByText(/two-factor authentication disabled/i)).toBeInTheDocument()
    })
  })

  describe("Security Warning", () => {
    it("shows security warning about event immutability", () => {
      const events = [
        {
          id: "1",
          eventType: "2fa_enabled",
          timestamp: new Date(),
          ipAddress: "203.0.113.1",
          userAgent: "Test Browser",
          metadata: null,
        },
      ]

      mockUseQuery.mockReturnValue({
        data: events,
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(
        screen.getByText(/security events are logged automatically and cannot be deleted/i)
      ).toBeInTheDocument()
    })

    it("includes instruction to contact support for suspicious activity", () => {
      const events = [
        {
          id: "1",
          eventType: "2fa_enabled",
          timestamp: new Date(),
          ipAddress: "203.0.113.1",
          userAgent: "Test Browser",
          metadata: null,
        },
      ]

      mockUseQuery.mockReturnValue({
        data: events,
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(screen.getByText(/contact support immediately/i)).toBeInTheDocument()
    })
  })

  describe("Multiple Events", () => {
    it("renders multiple events in correct order", () => {
      const events = [
        {
          id: "3",
          eventType: "backup_downloaded",
          timestamp: new Date("2024-10-27T12:00:00Z"),
          ipAddress: "203.0.113.3",
          userAgent: "Browser 3",
          metadata: null,
        },
        {
          id: "2",
          eventType: "2fa_login_success",
          timestamp: new Date("2024-10-27T11:00:00Z"),
          ipAddress: "203.0.113.2",
          userAgent: "Browser 2",
          metadata: null,
        },
        {
          id: "1",
          eventType: "2fa_enabled",
          timestamp: new Date("2024-10-27T10:00:00Z"),
          ipAddress: "203.0.113.1",
          userAgent: "Browser 1",
          metadata: null,
        },
      ]

      mockUseQuery.mockReturnValue({
        data: events,
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      const rows = screen.getAllByRole("row")
      // Should have header row + 3 data rows
      expect(rows.length).toBe(4)
    })
  })

  describe("Relative Timestamps", () => {
    it("displays timestamps in relative format", () => {
      const recentTime = new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago

      const events = [
        {
          id: "1",
          eventType: "2fa_enabled",
          timestamp: recentTime,
          ipAddress: "203.0.113.1",
          userAgent: "Test Browser",
          metadata: null,
        },
      ]

      mockUseQuery.mockReturnValue({
        data: events,
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      // Should show "5 minutes ago" or similar
      expect(screen.getByText(/ago/i)).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("has proper table structure with roles", () => {
      const events = [
        {
          id: "1",
          eventType: "2fa_enabled",
          timestamp: new Date(),
          ipAddress: "203.0.113.1",
          userAgent: "Test Browser",
          metadata: null,
        },
      ]

      mockUseQuery.mockReturnValue({
        data: events,
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(screen.getByRole("table")).toBeInTheDocument()
      expect(screen.getAllByRole("columnheader")).toHaveLength(4)
      expect(screen.getAllByRole("row")).toHaveLength(2) // header + 1 data row
    })

    it("uses semantic heading for component title", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      })

      render(<SecurityActivityLog />)

      expect(screen.getByRole("heading", { name: /security activity log/i })).toBeInTheDocument()
    })
  })
})
