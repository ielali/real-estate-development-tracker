/**
 * Search History Tests (Story 7.1)
 *
 * Tests localStorage-based search history management
 */

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest"
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  type RecentSearch,
} from "../search-history"

describe("Search History", () => {
  const userId = "test-user-123"
  const otherUserId = "other-user-456"

  // Mock localStorage
  let localStorageMock: Record<string, string>

  beforeEach(() => {
    localStorageMock = {}

    // Mock window object if not defined (for JSDOM)
    if (typeof window === "undefined") {
      Object.defineProperty(global, "window", {
        value: {},
        writable: true,
        configurable: true,
      })
    }

    // Mock localStorage
    const getItemSpy = vi.fn((key: string) => localStorageMock[key] || null)
    const setItemSpy = vi.fn((key: string, value: string) => {
      localStorageMock[key] = value
    })
    const removeItemSpy = vi.fn((key: string) => {
      delete localStorageMock[key]
    })
    const clearSpy = vi.fn(() => {
      localStorageMock = {}
    })

    Object.defineProperty(global, "localStorage", {
      value: {
        getItem: getItemSpy,
        setItem: setItemSpy,
        removeItem: removeItemSpy,
        clear: clearSpy,
        length: 0,
        key: vi.fn(),
      },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorageMock = {}
  })

  describe("getRecentSearches", () => {
    test("should return empty array when no searches exist", () => {
      const searches = getRecentSearches(userId)
      expect(searches).toEqual([])
    })

    test("should return stored searches for user", () => {
      const mockSearches: RecentSearch[] = [
        { query: "kitchen renovation", timestamp: Date.now(), resultCount: 5 },
        { query: "bathroom", timestamp: Date.now() - 1000, resultCount: 3 },
      ]

      localStorageMock[`search_history_${userId}`] = JSON.stringify(mockSearches)

      const searches = getRecentSearches(userId)
      expect(searches).toEqual(mockSearches)
    })

    test("should return empty array on invalid JSON", () => {
      localStorageMock[`search_history_${userId}`] = "invalid json"

      const searches = getRecentSearches(userId)
      expect(searches).toEqual([])
    })

    test("should return empty array if stored value is not an array", () => {
      localStorageMock[`search_history_${userId}`] = JSON.stringify({
        query: "test",
      })

      const searches = getRecentSearches(userId)
      expect(searches).toEqual([])
    })

    test("should isolate searches by user ID", () => {
      const user1Searches: RecentSearch[] = [
        { query: "user1 search", timestamp: Date.now(), resultCount: 2 },
      ]
      const user2Searches: RecentSearch[] = [
        { query: "user2 search", timestamp: Date.now(), resultCount: 4 },
      ]

      localStorageMock[`search_history_${userId}`] = JSON.stringify(user1Searches)
      localStorageMock[`search_history_${otherUserId}`] = JSON.stringify(user2Searches)

      const user1Results = getRecentSearches(userId)
      const user2Results = getRecentSearches(otherUserId)

      expect(user1Results).toEqual(user1Searches)
      expect(user2Results).toEqual(user2Searches)
    })

    test("should handle server-side rendering (no window)", () => {
      // Save original window
      const originalWindow = global.window

      // Remove window
      // @ts-expect-error - Testing SSR scenario
      delete global.window

      const searches = getRecentSearches(userId)
      expect(searches).toEqual([])

      // Restore window
      global.window = originalWindow
    })
  })

  describe("saveRecentSearch", () => {
    test("should save new search to history", () => {
      saveRecentSearch(userId, "kitchen renovation", 5)

      const searches = getRecentSearches(userId)
      expect(searches).toHaveLength(1)
      expect(searches[0]?.query).toBe("kitchen renovation")
      expect(searches[0]?.resultCount).toBe(5)
      expect(searches[0]?.timestamp).toBeDefined()
    })

    test("should prepend new searches (newest first)", () => {
      saveRecentSearch(userId, "first search", 1)
      saveRecentSearch(userId, "second search", 2)
      saveRecentSearch(userId, "third search", 3)

      const searches = getRecentSearches(userId)
      expect(searches[0]?.query).toBe("third search")
      expect(searches[1]?.query).toBe("second search")
      expect(searches[2]?.query).toBe("first search")
    })

    test("should deduplicate searches (case insensitive)", () => {
      saveRecentSearch(userId, "kitchen", 5)
      saveRecentSearch(userId, "bathroom", 3)
      saveRecentSearch(userId, "KITCHEN", 7) // Duplicate with different case

      const searches = getRecentSearches(userId)
      expect(searches).toHaveLength(2)
      expect(searches[0]?.query).toBe("KITCHEN") // Latest version kept
      expect(searches[1]?.query).toBe("bathroom")
    })

    test("should limit history to 10 searches", () => {
      // Add 12 searches
      for (let i = 0; i < 12; i++) {
        saveRecentSearch(userId, `search ${i}`, i)
      }

      const searches = getRecentSearches(userId)
      expect(searches).toHaveLength(10)
      expect(searches[0]?.query).toBe("search 11") // Newest
      expect(searches[9]?.query).toBe("search 2") // 10th newest
    })

    test("should trim whitespace from query", () => {
      saveRecentSearch(userId, "  kitchen renovation  ", 5)

      const searches = getRecentSearches(userId)
      expect(searches[0]?.query).toBe("kitchen renovation")
    })

    test("should ignore empty queries", () => {
      saveRecentSearch(userId, "", 0)
      saveRecentSearch(userId, "   ", 0)

      const searches = getRecentSearches(userId)
      expect(searches).toHaveLength(0)
    })

    test("should isolate saves by user ID", () => {
      saveRecentSearch(userId, "user1 search", 2)
      saveRecentSearch(otherUserId, "user2 search", 4)

      const user1Searches = getRecentSearches(userId)
      const user2Searches = getRecentSearches(otherUserId)

      expect(user1Searches).toHaveLength(1)
      expect(user1Searches[0]?.query).toBe("user1 search")

      expect(user2Searches).toHaveLength(1)
      expect(user2Searches[0]?.query).toBe("user2 search")
    })

    test("should handle localStorage errors gracefully", () => {
      // Mock localStorage.setItem to throw error
      vi.spyOn(localStorage, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError")
      })

      // Should not throw
      expect(() => {
        saveRecentSearch(userId, "test query", 5)
      }).not.toThrow()
    })

    test("should handle server-side rendering (no window)", () => {
      // Save original window
      const originalWindow = global.window

      // Remove window
      // @ts-expect-error - Testing SSR scenario
      delete global.window

      // Should not throw
      expect(() => {
        saveRecentSearch(userId, "test query", 5)
      }).not.toThrow()

      // Restore window
      global.window = originalWindow
    })

    test("should update timestamp when saving duplicate", () => {
      const firstTimestamp = Date.now() - 10000 // 10 seconds ago

      // Manually set first search with old timestamp
      localStorageMock[`search_history_${userId}`] = JSON.stringify([
        { query: "kitchen", timestamp: firstTimestamp, resultCount: 5 },
      ])

      // Save same search again
      saveRecentSearch(userId, "kitchen", 10)

      const searches = getRecentSearches(userId)
      expect(searches).toHaveLength(1)
      expect(searches[0]?.query).toBe("kitchen")
      expect(searches[0]?.resultCount).toBe(10)
      expect(searches[0]?.timestamp).toBeGreaterThan(firstTimestamp)
    })
  })

  describe("clearRecentSearches", () => {
    test("should clear all searches for user", () => {
      saveRecentSearch(userId, "search 1", 1)
      saveRecentSearch(userId, "search 2", 2)

      expect(getRecentSearches(userId)).toHaveLength(2)

      clearRecentSearches(userId)

      expect(getRecentSearches(userId)).toHaveLength(0)
    })

    test("should only clear searches for specified user", () => {
      saveRecentSearch(userId, "user1 search", 1)
      saveRecentSearch(otherUserId, "user2 search", 2)

      clearRecentSearches(userId)

      expect(getRecentSearches(userId)).toHaveLength(0)
      expect(getRecentSearches(otherUserId)).toHaveLength(1)
    })

    test("should handle localStorage errors gracefully", () => {
      // Mock localStorage.removeItem to throw error
      vi.spyOn(localStorage, "removeItem").mockImplementation(() => {
        throw new Error("StorageError")
      })

      // Should not throw
      expect(() => {
        clearRecentSearches(userId)
      }).not.toThrow()
    })

    test("should handle server-side rendering (no window)", () => {
      // Save original window
      const originalWindow = global.window

      // Remove window
      // @ts-expect-error - Testing SSR scenario
      delete global.window

      // Should not throw
      expect(() => {
        clearRecentSearches(userId)
      }).not.toThrow()

      // Restore window
      global.window = originalWindow
    })
  })

  describe("Edge Cases", () => {
    test("should handle very long query strings", () => {
      const longQuery = "a".repeat(1000)
      saveRecentSearch(userId, longQuery, 1)

      const searches = getRecentSearches(userId)
      expect(searches[0]?.query).toBe(longQuery)
    })

    test("should handle special characters in queries", () => {
      const specialQuery = "kitchen & bath || renovation <> 123"
      saveRecentSearch(userId, specialQuery, 5)

      const searches = getRecentSearches(userId)
      expect(searches[0]?.query).toBe(specialQuery)
    })

    test("should handle unicode characters", () => {
      const unicodeQuery = "厨房改造 🏗️"
      saveRecentSearch(userId, unicodeQuery, 3)

      const searches = getRecentSearches(userId)
      expect(searches[0]?.query).toBe(unicodeQuery)
    })

    test("should handle zero result count", () => {
      saveRecentSearch(userId, "no results query", 0)

      const searches = getRecentSearches(userId)
      expect(searches[0]?.resultCount).toBe(0)
    })

    test("should handle large result counts", () => {
      saveRecentSearch(userId, "popular query", 999999)

      const searches = getRecentSearches(userId)
      expect(searches[0]?.resultCount).toBe(999999)
    })
  })
})
