"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCategoriesByType, type Category } from "@/server/db/types"

interface CategorySelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

/**
 * CategorySelector - Hierarchical contact category selector
 *
 * Displays contact categories grouped by parent category.
 * Allows selection of child categories only (parent categories
 * are shown as group labels).
 *
 * @param value - Currently selected category ID
 * @param onChange - Callback when category selection changes
 * @param disabled - Whether the selector is disabled
 * @param placeholder - Placeholder text when no category is selected
 */
export function CategorySelector({
  value,
  onChange,
  disabled = false,
  placeholder = "Select a category",
}: CategorySelectorProps): JSX.Element {
  // Get all contact categories and organize them by parent
  const { parentCategories, categoryGroups } = React.useMemo(() => {
    const allCategories = getCategoriesByType("contact")

    const parents = allCategories.filter((cat) => cat.parentId === null)
    const groups: Record<string, Omit<Category, "createdById" | "createdAt">[]> = {}

    parents.forEach((parent) => {
      groups[parent.id] = allCategories.filter((cat) => cat.parentId === parent.id)
    })

    return {
      parentCategories: parents,
      categoryGroups: groups,
    }
  }, [])

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {parentCategories.map((parent) => {
          const children = categoryGroups[parent.id] || []

          return (
            <SelectGroup key={parent.id}>
              <SelectLabel>{parent.displayName}</SelectLabel>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.displayName}
                </SelectItem>
              ))}
            </SelectGroup>
          )
        })}
      </SelectContent>
    </Select>
  )
}
