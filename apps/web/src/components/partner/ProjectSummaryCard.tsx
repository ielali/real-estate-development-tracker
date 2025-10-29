/**
 * ProjectSummaryCard Component
 *
 * Story 4.3 - Partner Dashboard
 *
 * Displays key project metrics in a summary card:
 * - Total spent
 * - Document count
 * - Recent activity count
 * - Project status badge
 * - Project address and dates
 *
 * Features:
 * - Responsive layout (full-width on mobile, grid on desktop)
 * - Currency formatting (AUD with cents)
 * - Status badge with color coding
 * - Framer Motion animations
 */

"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, FileText, Activity, Calendar, MapPin } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"
import { formatDate } from "date-fns"

export interface ProjectSummaryCardProps {
  project: {
    id: string
    name: string
    description: string | null
    address: {
      formattedAddress: string
    } | null
    projectType: string
    status: "active" | "on-hold" | "completed"
    startDate: Date
    endDate: Date | null
  }
  totalSpent: number
  documentCount: number
  recentActivityCount: number
}

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  "on-hold": "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
}

export function ProjectSummaryCard({
  project,
  totalSpent,
  documentCount,
  recentActivityCount,
}: ProjectSummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              {project.description && (
                <CardDescription className="mt-2">{project.description}</CardDescription>
              )}
            </div>
            <Badge variant="outline" className={statusColors[project.status]}>
              {project.status === "on-hold"
                ? "On Hold"
                : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Project Details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            {project.address?.formattedAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{project.address.formattedAddress}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>
                Started: {formatDate(new Date(project.startDate), "MMM d, yyyy")}
                {project.endDate &&
                  ` • Ended: ${formatDate(new Date(project.endDate), "MMM d, yyyy")}`}
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Total Spent */}
            <motion.div
              className="flex items-center gap-3 rounded-lg border bg-card p-4"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-full bg-primary/10 p-2">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
            </motion.div>

            {/* Document Count */}
            <motion.div
              className="flex items-center gap-3 rounded-lg border bg-card p-4"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-full bg-blue-100 p-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">{documentCount}</p>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              className="flex items-center gap-3 rounded-lg border bg-card p-4"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-full bg-green-100 p-2">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Updates</p>
                <p className="text-2xl font-bold">{recentActivityCount}</p>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
