import React from "react"

interface CostListSkeletonProps {
  /**
   * Number of skeleton items to display
   * @default 3
   */
  count?: number
}

/**
 * CostListSkeleton - Loading skeleton for cost list
 *
 * Displays placeholder items while costs are loading
 * Matches the structure of individual cost entries
 */
export function CostListSkeleton({ count = 3 }: CostListSkeletonProps) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3 border-b">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="flex gap-1">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
