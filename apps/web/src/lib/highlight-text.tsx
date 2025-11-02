/**
 * Text Highlighting Utility (Story 7.1)
 *
 * Highlights matching text in search results using <mark> tags.
 */

import React from "react"

/**
 * Highlights all occurrences of search terms in text
 *
 * @param text - The text to highlight
 * @param query - The search query containing terms to highlight
 * @returns React elements with highlighted text
 *
 * @example
 * highlightText("Kitchen Renovation Project", "kitchen renovation")
 * // Returns: <><mark>Kitchen</mark> <mark>Renovation</mark> Project</>
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) {
    return text
  }

  // Split query into words and filter out empty strings
  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0)

  if (searchTerms.length === 0) {
    return text
  }

  // Create regex pattern that matches any of the search terms
  // Use word boundaries for better matching
  const pattern = searchTerms
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) // Escape special regex chars
    .join("|")

  const regex = new RegExp(`(${pattern})`, "gi")

  // Split text by matches and create elements
  const parts = text.split(regex)

  return (
    <React.Fragment>
      {parts.map((part, index) => {
        // Check if this part matches any search term (case-insensitive)
        const isMatch = searchTerms.some((term) => part.toLowerCase() === term.toLowerCase())

        if (isMatch) {
          return (
            <mark
              key={index}
              className="bg-yellow-200 dark:bg-yellow-900 font-medium rounded-sm px-0.5"
            >
              {part}
            </mark>
          )
        }

        return <span key={index}>{part}</span>
      })}
    </React.Fragment>
  )
}

/**
 * Simple version that returns HTML string for cases where React elements aren't supported
 *
 * @param text - The text to highlight
 * @param query - The search query containing terms to highlight
 * @returns HTML string with <mark> tags
 */
export function highlightTextHTML(text: string, query: string): string {
  if (!query || !text) {
    return text
  }

  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0)

  if (searchTerms.length === 0) {
    return text
  }

  const pattern = searchTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")

  const regex = new RegExp(`(${pattern})`, "gi")

  return text.replace(regex, "<mark>$1</mark>")
}
