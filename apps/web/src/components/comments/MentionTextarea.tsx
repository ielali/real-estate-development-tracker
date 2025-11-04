"use client"

/**
 * MentionTextarea Component
 * Story 8.3: @mention Autocomplete
 *
 * A textarea component with @mention autocomplete functionality.
 * Shows a dropdown of project members when user types @ followed by characters.
 */

import { useState, useRef, useEffect, forwardRef } from "react"
import { api } from "@/lib/trpc/client"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  projectId: string
  value: string
  onValueChange: (value: string) => void
}

interface ProjectMember {
  id: string
  name: string
  email: string
}

export const MentionTextarea = forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  ({ projectId, value, onValueChange, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const [showMentions, setShowMentions] = useState(false)
    const [mentionSearch, setMentionSearch] = useState("")
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [cursorPosition, setCursorPosition] = useState(0)

    // Fetch project members
    const { data: members = [] } = api.projects.getMembers.useQuery({ projectId })

    // Filter members based on search
    const filteredMembers = members.filter((member: ProjectMember) =>
      member.name.toLowerCase().includes(mentionSearch.toLowerCase())
    )

    // Detect @ mentions in the text
    useEffect(() => {
      if (!textareaRef.current) return

      const textarea = textareaRef.current
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = value.substring(0, cursorPos)

      // Find the last @ symbol before cursor
      const lastAtIndex = textBeforeCursor.lastIndexOf("@")

      if (lastAtIndex !== -1) {
        // Check if there's no space between @ and cursor
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
        if (!textAfterAt.includes(" ") && textAfterAt.length >= 0) {
          setMentionSearch(textAfterAt)
          setShowMentions(true)
          setSelectedIndex(0)

          // Calculate position for dropdown
          const coords = getCaretCoordinates(textarea, cursorPos)
          setMentionPosition({
            top: coords.top + 20, // Position below caret
            left: coords.left,
          })
          return
        }
      }

      setShowMentions(false)
    }, [value, cursorPosition])

    // Handle textarea change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange(e.target.value)
      setCursorPosition(e.target.selectionStart)
    }

    // Handle member selection
    const selectMember = (member: ProjectMember) => {
      if (!textareaRef.current) return

      const textarea = textareaRef.current
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = value.substring(0, cursorPos)
      const textAfterCursor = value.substring(cursorPos)

      // Find the last @ symbol before cursor
      const lastAtIndex = textBeforeCursor.lastIndexOf("@")

      if (lastAtIndex !== -1) {
        // Replace from @ to cursor with @mention
        const mention = `@${member.name.replace(/\s+/g, "_")}`
        const newValue = value.substring(0, lastAtIndex) + mention + " " + textAfterCursor

        onValueChange(newValue)

        // Set cursor position after the mention
        setTimeout(() => {
          const newCursorPos = lastAtIndex + mention.length + 1
          textarea.setSelectionRange(newCursorPos, newCursorPos)
          textarea.focus()
        }, 0)
      }

      setShowMentions(false)
      setMentionSearch("")
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showMentions && filteredMembers.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % filteredMembers.length)
        } else if (e.key === "ArrowUp") {
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length)
        } else if (e.key === "Enter") {
          e.preventDefault()
          selectMember(filteredMembers[selectedIndex] as ProjectMember)
        } else if (e.key === "Escape") {
          e.preventDefault()
          setShowMentions(false)
        }
      }

      // Call original onKeyDown if provided
      if (props.onKeyDown) {
        props.onKeyDown(e)
      }
    }

    // Get user initials for avatar fallback
    const getUserInitials = (name: string) => {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }

    return (
      <div className="relative">
        <Textarea
          ref={(node) => {
            textareaRef.current = node
            if (typeof ref === "function") {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          {...props}
        />

        {/* Mention Dropdown */}
        {showMentions && filteredMembers.length > 0 && (
          <Card
            className="absolute z-50 max-h-60 overflow-y-auto shadow-lg"
            style={{
              top: `${mentionPosition.top}px`,
              left: `${mentionPosition.left}px`,
            }}
          >
            <div className="py-1">
              {filteredMembers.map((member: ProjectMember, index) => (
                <button
                  key={member.id}
                  type="button"
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent ${
                    index === selectedIndex ? "bg-accent" : ""
                  }`}
                  onClick={() => selectMember(member)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getUserInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    )
  }
)

MentionTextarea.displayName = "MentionTextarea"

/**
 * Get caret coordinates in textarea
 * Based on https://github.com/component/textarea-caret-position
 */
function getCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number
): { top: number; left: number } {
  const div = document.createElement("div")
  const style = getComputedStyle(element)

  // Copy styles
  Array.from(style).forEach((prop) => {
    div.style.setProperty(prop, style.getPropertyValue(prop))
  })

  div.style.position = "absolute"
  div.style.visibility = "hidden"
  div.style.whiteSpace = "pre-wrap"
  div.style.wordWrap = "break-word"

  // Set content
  div.textContent = element.value.substring(0, position)

  // Add span for caret position
  const span = document.createElement("span")
  span.textContent = element.value.substring(position) || "."
  div.appendChild(span)

  document.body.appendChild(div)

  const coordinates = {
    top: span.offsetTop + parseInt(style.borderTopWidth),
    left: span.offsetLeft + parseInt(style.borderLeftWidth),
  }

  document.body.removeChild(div)

  return coordinates
}
