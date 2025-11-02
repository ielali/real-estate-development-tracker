"use client"

/**
 * CommandPalette - Global search command palette
 * Story 7.1: Implement Global Search with Command Palette
 *
 * Features:
 * - Cmd+K / Ctrl+K keyboard shortcut
 * - Search across projects, costs, contacts, documents
 * - Keyboard navigation (arrows, Enter, Escape)
 * - Recent searches
 * - Entity type filtering
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { MagnifyingGlassIcon } from "@radix-ui/react-icons"
import { X, Calendar } from "lucide-react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/trpc/client"
import { useDebounce } from "@/hooks/use-debounce"
import { getRecentSearches, saveRecentSearch, clearRecentSearches } from "@/lib/search-history"
import { useAuth } from "@/components/providers/AuthProvider"
import { highlightText } from "@/lib/highlight-text"

/**
 * Entity type icons
 */
const ENTITY_ICONS = {
  project: "🏗️",
  cost: "💰",
  contact: "👥",
  document: "📄",
}

/**
 * Entity type labels
 */
const ENTITY_LABELS = {
  project: "Projects",
  cost: "Costs",
  contact: "Contacts",
  document: "Documents",
}

type EntityType = "project" | "cost" | "contact" | "document"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedEntityTypes, setSelectedEntityTypes] = React.useState<EntityType[]>([])
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("")
  const [dateFrom, setDateFrom] = React.useState<string>("")
  const [dateTo, setDateTo] = React.useState<string>("")
  const debouncedSearch = useDebounce(searchQuery, 300)
  const router = useRouter()
  const { user } = useAuth()

  // Fetch accessible projects for project filter
  const { data: accessibleProjects } = api.projects.list.useQuery(undefined, {
    enabled: open && !!user,
  })

  // Global keyboard shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Search query using tRPC
  const { data: searchResults, isLoading } = api.search.globalSearch.useQuery(
    {
      query: debouncedSearch,
      entityTypes: selectedEntityTypes.length > 0 ? selectedEntityTypes : undefined,
      projectId: selectedProjectId || undefined,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
      limit: 50,
    },
    {
      enabled: debouncedSearch.length >= 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Get recent searches
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])

  React.useEffect(() => {
    if (user?.id) {
      const recent = getRecentSearches(user.id)
      setRecentSearches(recent.map((r) => r.query))
    }
  }, [user?.id, open])

  // Handle result selection
  const handleSelect = React.useCallback(
    (result: NonNullable<typeof searchResults>["results"][0]) => {
      // Save search to history
      if (user?.id && searchQuery) {
        saveRecentSearch(user.id, searchQuery, searchResults?.totalCount ?? 0)
      }

      // Navigate to entity
      switch (result.entityType) {
        case "project":
          router.push(`/projects/${result.entityId}`)
          break
        case "cost":
          router.push(
            `/projects/${result.projectContext?.projectId}?tab=costs&highlight=${result.entityId}`
          )
          break
        case "contact":
          router.push(`/contacts/${result.entityId}`)
          break
        case "document":
          router.push(
            `/projects/${result.projectContext?.projectId}?tab=documents&highlight=${result.entityId}`
          )
          break
      }

      // Close dialog
      setOpen(false)
      setSearchQuery("")
    },
    [router, searchQuery, searchResults?.totalCount, user?.id]
  )

  // Handle recent search selection
  const handleRecentSearchSelect = React.useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Handle clear recent searches
  const handleClearHistory = React.useCallback(() => {
    if (user?.id) {
      clearRecentSearches(user.id)
      setRecentSearches([])
    }
  }, [user?.id])

  // Handle entity type filter toggle
  const handleToggleEntityType = React.useCallback((type: EntityType) => {
    setSelectedEntityTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type)
      }
      return [...prev, type]
    })
  }, [])

  // Clear all filters
  const handleClearAllFilters = React.useCallback(() => {
    setSelectedEntityTypes([])
    setSelectedProjectId("")
    setDateFrom("")
    setDateTo("")
  }, [])

  // Count active filters
  const activeFilterCount = React.useMemo(() => {
    let count = selectedEntityTypes.length
    if (selectedProjectId) count++
    if (dateFrom) count++
    if (dateTo) count++
    return count
  }, [selectedEntityTypes.length, selectedProjectId, dateFrom, dateTo])

  // Group results by entity type
  const groupedResults = React.useMemo(() => {
    if (!searchResults?.results) return {}

    type SearchResult = (typeof searchResults.results)[0]

    return searchResults.results.reduce(
      (acc: Record<string, SearchResult[]>, result: SearchResult) => {
        if (!acc[result.entityType]) {
          acc[result.entityType] = []
        }
        acc[result.entityType]!.push(result)
        return acc
      },
      {} as Record<string, SearchResult[]>
    )
  }, [searchResults])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search projects, costs, contacts, documents..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          aria-label="Search all entities"
        />

        {/* Advanced filters */}
        {debouncedSearch.length >= 2 && (
          <div className="border-b px-3 py-3 space-y-3">
            {/* Project and Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Project Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Project</label>
                <Select
                  value={selectedProjectId || "all"}
                  onValueChange={(value) => setSelectedProjectId(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {accessibleProjects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  From Date
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              {/* Date To Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  To Date
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Entity type filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-medium text-muted-foreground">Type:</span>
              {(["project", "cost", "contact", "document"] as EntityType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleToggleEntityType(type)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedEntityTypes.includes(type)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <span>{ENTITY_ICONS[type]}</span>
                  <span>{ENTITY_LABELS[type]}</span>
                </button>
              ))}
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Active Filter Badges */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedProjectId && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs">
                    Project: {accessibleProjects?.find((p) => p.id === selectedProjectId)?.name}
                    <button
                      onClick={() => setSelectedProjectId("")}
                      className="hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {dateFrom && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs">
                    From: {dateFrom}
                    <button onClick={() => setDateFrom("")} className="hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {dateTo && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs">
                    To: {dateTo}
                    <button onClick={() => setDateTo("")} className="hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <CommandList aria-label="Search results">
          {/* Loading state */}
          {isLoading && debouncedSearch.length >= 2 && (
            <CommandEmpty>
              <div className="flex items-center justify-center gap-2 py-6">
                <MagnifyingGlassIcon className="h-4 w-4 animate-pulse" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            </CommandEmpty>
          )}

          {/* Empty state with recent searches */}
          {!searchQuery && (
            <>
              {recentSearches.length > 0 && (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((query) => (
                    <CommandItem
                      key={query}
                      value={query}
                      onSelect={() => handleRecentSearchSelect(query)}
                    >
                      <MagnifyingGlassIcon className="mr-2 h-4 w-4 opacity-50" />
                      {query}
                    </CommandItem>
                  ))}
                  <CommandItem
                    onSelect={handleClearHistory}
                    className="justify-center text-xs text-muted-foreground hover:text-foreground"
                  >
                    <span>Clear History</span>
                  </CommandItem>
                </CommandGroup>
              )}

              <CommandGroup heading="Quick Actions">
                <CommandItem onSelect={() => router.push("/projects/new")}>
                  <span className="mr-2">🏗️</span>
                  Create Project
                </CommandItem>
                <CommandItem onSelect={() => router.push("/costs/new")}>
                  <span className="mr-2">💰</span>
                  Add Cost
                </CommandItem>
                <CommandItem onSelect={() => router.push("/contacts/new")}>
                  <span className="mr-2">👥</span>
                  Add Contact
                </CommandItem>
              </CommandGroup>

              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                <p>Try searching for projects, costs, contacts, or documents</p>
                <p className="mt-1 text-xs">Tip: Use Cmd+K (Mac) or Ctrl+K (Windows) to open</p>
              </div>
            </>
          )}

          {/* No results */}
          {!isLoading &&
            debouncedSearch.length >= 2 &&
            searchResults &&
            searchResults.totalCount === 0 && (
              <CommandEmpty>
                <div className="py-6 text-center">
                  <p className="text-sm font-medium">No results found for "{debouncedSearch}"</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try different keywords or check spelling
                  </p>
                </div>
              </CommandEmpty>
            )}

          {/* Search results grouped by entity type */}
          {!isLoading &&
            debouncedSearch.length >= 2 &&
            searchResults &&
            searchResults.totalCount > 0 &&
            Object.entries(groupedResults).map(
              ([entityType, results]: [string, Array<(typeof searchResults)["results"][0]>]) => (
                <CommandGroup
                  key={entityType}
                  heading={`${ENTITY_ICONS[entityType as keyof typeof ENTITY_ICONS]} ${ENTITY_LABELS[entityType as keyof typeof ENTITY_LABELS]} (${results.length})`}
                >
                  {results.map((result: (typeof searchResults)["results"][0]) => (
                    <CommandItem
                      key={`${result.entityType}-${result.entityId}`}
                      value={`${result.entityType}-${result.entityId}`}
                      onSelect={() => handleSelect(result)}
                      className="flex flex-col items-start gap-1 py-3"
                    >
                      <div className="flex w-full items-center gap-2">
                        <span className="shrink-0">
                          {ENTITY_ICONS[result.entityType as keyof typeof ENTITY_ICONS]}
                        </span>
                        <div className="flex-1 truncate">
                          <span className="font-medium">
                            {highlightText(result.title, searchQuery)}
                          </span>
                        </div>
                        {result.projectContext && (
                          <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {result.projectContext.projectName}
                          </span>
                        )}
                      </div>
                      {result.preview && (
                        <div className="w-full truncate text-xs text-muted-foreground">
                          {highlightText(result.preview, searchQuery)}
                        </div>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
