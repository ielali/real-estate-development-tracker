/**
 * ProjectTimelineChart Component
 *
 * Story 4.4 - Data Visualizations
 *
 * Displays project timeline with milestone markers:
 * - Horizontal timeline layout with milestone events
 * - Visual markers (dots) for each milestone
 * - Connecting line between milestones
 * - Hover to show milestone description
 * - Responsive: vertical on mobile, horizontal on desktop
 *
 * Features:
 * - Responsive layout (mobile and desktop)
 * - Smooth animations for marker entry
 * - Empty state handling
 * - Interactive hover states
 * - Respects prefers-reduced-motion
 */

"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"

export interface TimelineMilestone {
  id: string
  title: string
  description: string | null
  date: Date
  categoryId: string
  categoryName: string | null
}

export interface ProjectTimelineChartProps {
  data: TimelineMilestone[]
}

export function ProjectTimelineChart({ data }: ProjectTimelineChartProps) {
  // Check for prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // Empty state
  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>Milestone events and important dates</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No milestones yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Milestone events will appear here as they are added to the project
          </p>
        </CardContent>
      </Card>
    )
  }

  // Sort milestones by date (ascending)
  const sortedMilestones = [...data].sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
        delay: prefersReducedMotion ? 0 : 0.5,
      }}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>
            {sortedMilestones.length} {sortedMilestones.length === 1 ? "milestone" : "milestones"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Desktop: Horizontal timeline */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />

              {/* Milestones */}
              <div className="flex justify-between relative">
                {sortedMilestones.map((milestone: TimelineMilestone, index: number) => (
                  <motion.div
                    key={milestone.id}
                    className="flex flex-col items-center group relative"
                    style={{ flex: 1 }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.4,
                      delay: prefersReducedMotion ? 0 : index * 0.1,
                    }}
                  >
                    {/* Marker dot */}
                    <div className="relative z-10 w-8 h-8 rounded-full bg-blue-500 border-4 border-background flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>

                    {/* Milestone info */}
                    <div className="mt-4 text-center max-w-[150px]">
                      <p className="text-sm font-medium">{milestone.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(milestone.date, "MMM d, yyyy")}
                      </p>
                      {milestone.categoryName && (
                        <p className="text-xs text-muted-foreground">{milestone.categoryName}</p>
                      )}
                    </div>

                    {/* Hover tooltip with description */}
                    {milestone.description && (
                      <div className="absolute top-full mt-2 hidden group-hover:block z-20 w-64 p-3 bg-popover border border-border rounded-md shadow-lg text-sm">
                        {milestone.description}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: Vertical timeline */}
          <div className="md:hidden space-y-6">
            {sortedMilestones.map((milestone: TimelineMilestone, index: number) => (
              <motion.div
                key={milestone.id}
                className="relative pl-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.4,
                  delay: prefersReducedMotion ? 0 : index * 0.1,
                }}
              >
                {/* Connecting line */}
                {index !== sortedMilestones.length - 1 && (
                  <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border" />
                )}

                {/* Marker dot */}
                <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-blue-500 border-4 border-background flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

                {/* Milestone info */}
                <div>
                  <p className="font-medium">{milestone.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(milestone.date, "MMM d, yyyy")}
                  </p>
                  {milestone.categoryName && (
                    <p className="text-sm text-muted-foreground">{milestone.categoryName}</p>
                  )}
                  {milestone.description && (
                    <p className="text-sm text-muted-foreground mt-2">{milestone.description}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
