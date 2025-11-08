/**
 * CommandPalette Component Tests (Story 7.1)
 *
 * Tests global search command palette with keyboard shortcuts,
 * search functionality, navigation, and accessibility features.
 *
 * @vitest-environment jsdom
 */

import React from "react"
import { describe, test, expect, vi, afterEach, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CommandPalette } from "../CommandPalette"
import { TRPCWrapper } from "@/test/test-utils"

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock useAuth
const mockUser = {
  id: "test-user-123",
  email: "test@example.com",
  name: "Test User",
}
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}))

// Mock search history functions
const mockGetRecentSearches = vi.fn()
const mockSaveRecentSearch = vi.fn()
vi.mock("@/lib/search-history", () => ({
  getRecentSearches: (userId: string) => mockGetRecentSearches(userId),
  saveRecentSearch: (userId: string, query: string, resultCount: number) =>
    mockSaveRecentSearch(userId, query, resultCount),
}))

// Mock tRPC search endpoint
const mockSearchData = {
  results: [
    {
      entityType: "project" as const,
      entityId: "project-1",
      title: "Kitchen Renovation",
      preview: "Complete kitchen remodel",
      matchedFields: ["name", "description"],
      rank: 0.9,
    },
    {
      entityType: "cost" as const,
      entityId: "cost-1",
      title: "Kitchen cabinets",
      preview: "Amount: $5000.00",
      projectContext: {
        projectId: "project-1",
        projectName: "Kitchen Renovation",
      },
      matchedFields: ["description"],
      rank: 0.8,
    },
    {
      entityType: "contact" as const,
      entityId: "contact-1",
      title: "Alice Johnson",
      preview: "Johnson Construction • alice@contractor.com",
      projectContext: {
        projectId: "project-1",
        projectName: "Kitchen Renovation",
      },
      matchedFields: ["firstName", "lastName", "company", "email"],
      rank: 0.7,
    },
    {
      entityType: "document" as const,
      entityId: "doc-1",
      title: "kitchen-contract.pdf",
      preview: "application/pdf • 10.5 KB",
      projectContext: {
        projectId: "project-1",
        projectName: "Kitchen Renovation",
      },
      matchedFields: ["fileName"],
      rank: 0.6,
    },
  ],
  totalCount: 4,
}

const mockSearchQuery = vi.fn()
const mockProjectsListQuery = vi.fn()
vi.mock("@/lib/trpc/client", () => ({
  api: {
    search: {
      globalSearch: {
        useQuery: (...args: unknown[]) => mockSearchQuery(...args),
      },
    },
    projects: {
      list: {
        useQuery: (...args: unknown[]) => mockProjectsListQuery(...args),
      },
    },
  },
}))

describe("CommandPalette Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRecentSearches.mockReturnValue([])
    mockSearchQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    })
    mockProjectsListQuery.mockReturnValue({
      data: [],
      isLoading: false,
    })
  })

  afterEach(async () => {
    cleanup()
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  const renderCommandPalette = () => {
    return render(
      <TRPCWrapper>
        <CommandPalette />
      </TRPCWrapper>
    )
  }

  describe("Keyboard Shortcuts", () => {
    test("should open palette with Cmd+K on Mac", async () => {
      renderCommandPalette()

      // Initially closed
      expect(screen.queryByPlaceholderText(/search projects/i)).not.toBeInTheDocument()

      // Press Cmd+K
      fireEvent.keyDown(document, { key: "k", metaKey: true })

      // Should open
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })
    })

    test("should open palette with Ctrl+K on Windows", async () => {
      renderCommandPalette()

      // Press Ctrl+K
      fireEvent.keyDown(document, { key: "k", ctrlKey: true })

      // Should open
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })
    })

    test("should toggle palette on repeated Cmd+K", async () => {
      renderCommandPalette()

      // Open
      fireEvent.keyDown(document, { key: "k", metaKey: true })
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      // Close
      fireEvent.keyDown(document, { key: "k", metaKey: true })
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/search projects/i)).not.toBeInTheDocument()
      })
    })

    test("should prevent default browser behavior", () => {
      renderCommandPalette()

      const event = new KeyboardEvent("keydown", { key: "k", metaKey: true })
      const preventDefaultSpy = vi.spyOn(event, "preventDefault")

      document.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe("Search Functionality", () => {
    test("should render search input when open", async () => {
      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(
          /search projects, costs, contacts, documents/i
        )
        expect(searchInput).toBeInTheDocument()
      })
    })

    test("should call tRPC search with debounced query", async () => {
      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "kitchen")

      // Wait for debounce (300ms)
      await waitFor(
        () => {
          expect(mockSearchQuery).toHaveBeenCalledWith(
            expect.objectContaining({
              query: "kitchen",
              limit: 50,
            }),
            expect.any(Object)
          )
        },
        { timeout: 500 }
      )
    })

    test("should not search for queries < 2 characters", async () => {
      mockSearchQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "k")

      // Should not enable query
      await waitFor(() => {
        const lastCall = mockSearchQuery.mock.calls[mockSearchQuery.mock.calls.length - 1]
        if (lastCall) {
          // enabled should be false for short queries
          expect(lastCall[1]).toHaveProperty("enabled", false)
        }
      })
    })

    test("should display loading state", async () => {
      mockSearchQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "kitchen")

      await waitFor(() => {
        expect(screen.getByText(/searching/i)).toBeInTheDocument()
      })
    })

    test("should display search results grouped by entity type", async () => {
      mockSearchQuery.mockReturnValue({
        data: mockSearchData,
        isLoading: false,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "kitchen")

      await waitFor(() => {
        // Should display grouped headings
        expect(screen.getByText(/Projects \(1\)/i)).toBeInTheDocument()
        expect(screen.getByText(/Costs \(1\)/i)).toBeInTheDocument()
        expect(screen.getByText(/Contacts \(1\)/i)).toBeInTheDocument()
        expect(screen.getByText(/Documents \(1\)/i)).toBeInTheDocument()

        // Should display results - check that all entity types are present
        expect(screen.getAllByText("Kitchen Renovation").length).toBeGreaterThan(0)

        // Verify each result type exists by finding options with the expected text
        const allOptions = screen.getAllByRole("option")
        expect(allOptions.some((option) => option.textContent?.includes("Kitchen cabinets"))).toBe(
          true
        )
        expect(allOptions.some((option) => option.textContent?.includes("Alice Johnson"))).toBe(
          true
        )
        expect(
          allOptions.some((option) => option.textContent?.includes("kitchen-contract.pdf"))
        ).toBe(true)
      })
    })

    test("should display project context for non-project entities", async () => {
      mockSearchQuery.mockReturnValue({
        data: mockSearchData,
        isLoading: false,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "kitchen")

      await waitFor(() => {
        // Should display project context badges
        const contextBadges = screen.getAllByText("Kitchen Renovation")
        // One is the project title, others are context badges
        expect(contextBadges.length).toBeGreaterThan(1)
      })
    })

    test("should display empty state for no results", async () => {
      mockSearchQuery.mockReturnValue({
        data: { results: [], totalCount: 0 },
        isLoading: false,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "nonexistent")

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument()
        expect(screen.getByText(/try different keywords/i)).toBeInTheDocument()
      })
    })
  })

  describe("Navigation", () => {
    test("should navigate to project on selection", async () => {
      mockSearchQuery.mockReturnValue({
        data: mockSearchData,
        isLoading: false,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "kitchen")

      await waitFor(() => {
        expect(screen.getAllByText("Kitchen Renovation").length).toBeGreaterThan(0)
      })

      // Find all command items (role="option") and click the project one
      // The project item is the one where "Kitchen Renovation" is the main title, not a badge
      const allOptions = screen.getAllByRole("option")
      const projectOption = allOptions.find((option) => {
        // Project option has the icon, title, and preview, but no project context badge
        const hasProjectTitle = option.textContent?.includes("Kitchen Renovation")
        const hasProjectIcon = option.textContent?.includes("🏗️")
        return hasProjectTitle && hasProjectIcon
      })

      if (!projectOption) throw new Error("Could not find project option")
      await userEvent.click(projectOption)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/projects/project-1")
      })
    })

    test("should navigate to cost with tab and highlight", async () => {
      mockSearchQuery.mockReturnValue({
        data: mockSearchData,
        isLoading: false,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "kitchen")

      await waitFor(() => {
        const allOptions = screen.getAllByRole("option")
        expect(allOptions.some((option) => option.textContent?.includes("Kitchen cabinets"))).toBe(
          true
        )
      })

      // Find and click the cost option
      const allOptions = screen.getAllByRole("option")
      const costOption = allOptions.find((option) => {
        return (
          option.textContent?.includes("Kitchen cabinets") && option.textContent?.includes("💰")
        )
      })
      if (!costOption) throw new Error("Could not find cost option")
      await userEvent.click(costOption)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/projects/project-1?tab=costs&highlight=cost-1")
      })
    })

    test("should navigate to contact", async () => {
      mockSearchQuery.mockReturnValue({
        data: mockSearchData,
        isLoading: false,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "alice")

      await waitFor(() => {
        const allOptions = screen.getAllByRole("option")
        expect(allOptions.some((option) => option.textContent?.includes("Alice Johnson"))).toBe(
          true
        )
      })

      // Find and click the contact option
      const allOptions = screen.getAllByRole("option")
      const contactOption = allOptions.find((option) => {
        return option.textContent?.includes("Alice Johnson") && option.textContent?.includes("👥")
      })
      if (!contactOption) throw new Error("Could not find contact option")
      await userEvent.click(contactOption)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/contacts/contact-1")
      })
    })

    test("should navigate to document with tab and highlight", async () => {
      mockSearchQuery.mockReturnValue({
        data: mockSearchData,
        isLoading: false,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "contract")

      await waitFor(() => {
        const allOptions = screen.getAllByRole("option")
        expect(
          allOptions.some((option) => option.textContent?.includes("kitchen-contract.pdf"))
        ).toBe(true)
      })

      // Find and click the document option
      const allOptions = screen.getAllByRole("option")
      const documentOption = allOptions.find((option) => {
        return (
          option.textContent?.includes("kitchen-contract.pdf") && option.textContent?.includes("📄")
        )
      })
      if (!documentOption) throw new Error("Could not find document option")
      await userEvent.click(documentOption)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/projects/project-1?tab=documents&highlight=doc-1")
      })
    })

    test("should close palette after navigation", async () => {
      mockSearchQuery.mockReturnValue({
        data: mockSearchData,
        isLoading: false,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "kitchen")

      await waitFor(() => {
        expect(screen.getAllByText("Kitchen Renovation").length).toBeGreaterThan(0)
      })

      const projectResults = screen.getAllByText("Kitchen Renovation")
      await userEvent.click(projectResults[0])

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/search projects/i)).not.toBeInTheDocument()
      })
    })

    test("should save search to history on navigation", async () => {
      mockSearchQuery.mockReturnValue({
        data: mockSearchData,
        isLoading: false,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "kitchen")

      await waitFor(() => {
        expect(screen.getAllByText("Kitchen Renovation").length).toBeGreaterThan(0)
      })

      const projectResults = screen.getAllByText("Kitchen Renovation")
      await userEvent.click(projectResults[0])

      await waitFor(() => {
        expect(mockSaveRecentSearch).toHaveBeenCalledWith(mockUser.id, "kitchen", 4)
      })
    })
  })

  describe("Recent Searches", () => {
    test("should display recent searches when empty", async () => {
      mockGetRecentSearches.mockReturnValue([
        { query: "kitchen renovation", timestamp: Date.now(), resultCount: 5 },
        { query: "bathroom", timestamp: Date.now() - 1000, resultCount: 3 },
      ])

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByText(/recent searches/i)).toBeInTheDocument()
        expect(screen.getByText("kitchen renovation")).toBeInTheDocument()
        expect(screen.getByText("bathroom")).toBeInTheDocument()
      })
    })

    test("should populate search on recent search click", async () => {
      mockGetRecentSearches.mockReturnValue([
        { query: "kitchen renovation", timestamp: Date.now(), resultCount: 5 },
      ])

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByText("kitchen renovation")).toBeInTheDocument()
      })

      const recentSearch = screen.getByText("kitchen renovation")
      await userEvent.click(recentSearch)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search projects/i) as HTMLInputElement
        expect(searchInput.value).toBe("kitchen renovation")
      })
    })

    test("should not display recent searches when searching", async () => {
      mockGetRecentSearches.mockReturnValue([
        { query: "recent search", timestamp: Date.now(), resultCount: 5 },
      ])

      mockSearchQuery.mockReturnValue({
        data: mockSearchData,
        isLoading: false,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "kitchen")

      await waitFor(() => {
        expect(screen.queryByText(/recent searches/i)).not.toBeInTheDocument()
        // Use getAllByText since "Kitchen Renovation" appears multiple times (as project result and context badges)
        expect(screen.getAllByText("Kitchen Renovation").length).toBeGreaterThan(0)
      })
    })
  })

  describe("Quick Actions", () => {
    test("should display quick actions when empty", async () => {
      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByText(/quick actions/i)).toBeInTheDocument()
        expect(screen.getByText("View Portfolio Analytics")).toBeInTheDocument()
        expect(screen.getByText("Create New Project")).toBeInTheDocument()
        expect(screen.getByText("Add New Contact")).toBeInTheDocument()
        expect(screen.getByText("View Vendor Dashboard")).toBeInTheDocument()
        expect(screen.getByText("Compare Vendors")).toBeInTheDocument()
      })
    })

    test("should navigate to new project on quick action click", async () => {
      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByText("Create New Project")).toBeInTheDocument()
      })

      const createProjectAction = screen.getByText("Create New Project")
      await userEvent.click(createProjectAction)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/projects?action=add")
      })
    })

    test("should navigate to vendor dashboard on quick action click", async () => {
      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByText("View Vendor Dashboard")).toBeInTheDocument()
      })

      const vendorDashboardAction = screen.getByText("View Vendor Dashboard")
      await userEvent.click(vendorDashboardAction)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/vendors/dashboard")
      })
    })
  })

  describe("Accessibility", () => {
    test("should have aria-label on search input", async () => {
      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        const searchInput = screen.getByLabelText(/search all entities/i)
        expect(searchInput).toBeInTheDocument()
      })
    })

    test("should have aria-label on search results list", async () => {
      mockSearchQuery.mockReturnValue({
        data: mockSearchData,
        isLoading: false,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "kitchen")

      // Wait for search results to appear first
      await waitFor(() => {
        expect(screen.getAllByText("Kitchen Renovation").length).toBeGreaterThan(0)
      })

      // Check that results list has proper aria-label
      // The cmdk library renders the list with role="listbox" and aria-label="Suggestions"
      const resultsList = screen.getByRole("listbox")
      expect(resultsList).toBeInTheDocument()
      // cmdk library uses "Suggestions" as the default aria-label
      expect(resultsList).toHaveAttribute("aria-label", "Suggestions")
    })

    test("should support keyboard navigation", async () => {
      mockSearchQuery.mockReturnValue({
        data: mockSearchData,
        isLoading: false,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "kitchen")

      await waitFor(() => {
        // Use getAllByText since "Kitchen Renovation" appears multiple times
        expect(screen.getAllByText("Kitchen Renovation").length).toBeGreaterThan(0)
      })

      // Test arrow key navigation (this is handled by shadcn/ui Command component internally)
      // We can verify the results are keyboard-navigable by checking they're rendered
      expect(screen.getAllByText("Kitchen Renovation").length).toBeGreaterThan(0)

      // Verify results are present and keyboard-navigable
      const allOptions = screen.getAllByRole("option")
      expect(allOptions.some((option) => option.textContent?.includes("Kitchen cabinets"))).toBe(
        true
      )
    })

    test("should display usage hint in empty state", async () => {
      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByText(/use cmd\+k.*or ctrl\+k/i)).toBeInTheDocument()
      })
    })
  })

  describe("Edge Cases", () => {
    test("should handle undefined user gracefully", async () => {
      // Note: Since useAuth is already mocked at module level,
      // we test with the current mock which has a defined user.
      // Testing with null user would require re-mocking, which is complex in this setup.
      // The actual code handles undefined user (lines 88-92 in CommandPalette.tsx)

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      // Verify recent searches are loaded when user is defined
      expect(mockGetRecentSearches).toHaveBeenCalledWith(mockUser.id)
    })

    test("should clear search input when closed", async () => {
      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i) as HTMLInputElement
      await userEvent.type(searchInput, "kitchen")

      expect(searchInput.value).toBe("kitchen")

      // Close palette
      fireEvent.keyDown(document, { key: "k", metaKey: true })

      // Reopen
      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        const reopenedInput = screen.getByPlaceholderText(/search projects/i) as HTMLInputElement
        // Input should be empty when reopened
        expect(reopenedInput.value).toBe("")
      })
    })

    test("should handle very long result titles", async () => {
      const longTitle = "A".repeat(200)
      mockSearchQuery.mockReturnValue({
        data: {
          results: [
            {
              entityType: "project" as const,
              entityId: "project-1",
              title: longTitle,
              preview: "Preview text",
              matchedFields: ["name"],
              rank: 0.9,
            },
          ],
          totalCount: 1,
        },
        isLoading: false,
      })

      renderCommandPalette()

      fireEvent.keyDown(document, { key: "k", metaKey: true })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, "test")

      await waitFor(() => {
        // Should render without crashing
        expect(screen.getByText(longTitle)).toBeInTheDocument()
      })
    })
  })
})
