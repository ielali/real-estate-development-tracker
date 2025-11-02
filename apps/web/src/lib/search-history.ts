/**
 * Search History Management (Story 7.1)
 *
 * Manages recent searches in browser localStorage with per-user isolation.
 * Stores last 10 searches with timestamps and result counts.
 */

const MAX_SEARCHES = 10

export interface RecentSearch {
  query: string
  timestamp: number
  resultCount: number
}

/**
 * Get storage key for user's search history
 */
function getStorageKey(userId: string): string {
  return `search_history_${userId}`
}

/**
 * Get recent searches for a user
 *
 * @param userId - User ID
 * @returns Array of recent searches, newest first
 */
export function getRecentSearches(userId: string): RecentSearch[] {
  if (typeof window === "undefined") return []

  try {
    const key = getStorageKey(userId)
    const stored = localStorage.getItem(key)

    if (!stored) return []

    const searches = JSON.parse(stored) as RecentSearch[]
    return Array.isArray(searches) ? searches : []
  } catch (error) {
    console.error("Failed to load recent searches:", error)
    return []
  }
}

/**
 * Save a search to recent history
 *
 * Deduplicates searches and maintains max limit of 10.
 *
 * @param userId - User ID
 * @param query - Search query
 * @param resultCount - Number of results returned
 */
export function saveRecentSearch(userId: string, query: string, resultCount: number): void {
  if (typeof window === "undefined") return
  if (!query.trim()) return

  try {
    const key = getStorageKey(userId)
    const existing = getRecentSearches(userId)

    // Remove duplicate if exists
    const filtered = existing.filter((s) => s.query.toLowerCase() !== query.toLowerCase())

    // Add new search to beginning
    const updated: RecentSearch[] = [
      {
        query: query.trim(),
        timestamp: Date.now(),
        resultCount,
      },
      ...filtered,
    ].slice(0, MAX_SEARCHES)

    localStorage.setItem(key, JSON.stringify(updated))
  } catch (error) {
    console.error("Failed to save recent search:", error)
  }
}

/**
 * Clear all recent searches for a user
 *
 * @param userId - User ID
 */
export function clearRecentSearches(userId: string): void {
  if (typeof window === "undefined") return

  try {
    const key = getStorageKey(userId)
    localStorage.removeItem(key)
  } catch (error) {
    console.error("Failed to clear recent searches:", error)
  }
}
