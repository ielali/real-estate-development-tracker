/**
 * PartnerProjectDashboard Component
 *
 * Story 4.3 - Partner Dashboard
 *
 * Main dashboard container that displays all partner dashboard components:
 * - ProjectSummaryCard with key metrics
 * - CostBreakdown visualization
 * - ActivityTimeline with recent updates
 * - DocumentGallery with file viewer
 *
 * Features:
 * - Fetches data from partner dashboard tRPC router
 * - Responsive layout
 * - Loading states
 * - Error handling
 * - Empty state handling
 */

"use client"

import { api } from "@/lib/trpc/client"
import { ProjectSummaryCard } from "./ProjectSummaryCard"
import { CostBreakdown } from "./CostBreakdown"
import { ActivityTimeline } from "./ActivityTimeline"
import { DocumentGallery } from "./DocumentGallery"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export interface PartnerProjectDashboardProps {
  projectId: string
}

export function PartnerProjectDashboard({ projectId }: PartnerProjectDashboardProps) {
  // Fetch project summary
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = api.partnerDashboard.getProjectSummary.useQuery({ projectId })

  // Fetch cost breakdown
  const {
    data: costBreakdown,
    isLoading: costsLoading,
    error: costsError,
  } = api.partnerDashboard.getCostBreakdown.useQuery({ projectId })

  // Fetch recent activity
  const {
    data: activity,
    isLoading: activityLoading,
    error: activityError,
  } = api.partnerDashboard.getRecentActivity.useQuery({
    projectId,
    limit: 20,
    offset: 0,
  })

  // Fetch document gallery with pagination
  const {
    data: documents,
    isLoading: documentsLoading,
    error: documentsError,
  } = api.partnerDashboard.getDocumentGallery.useQuery({
    projectId,
    limit: 50, // Default page size
    offset: 0,
  })

  // Loading state
  if (summaryLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Error state
  if (summaryError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {summaryError.message || "Failed to load project dashboard. Please try again."}
        </AlertDescription>
      </Alert>
    )
  }

  // No data state
  if (!summary) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>No project data available.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Project Summary */}
      <ProjectSummaryCard
        project={summary.project}
        totalSpent={summary.totalSpent}
        documentCount={summary.documentCount}
        recentActivityCount={summary.recentActivityCount}
      />

      {/* Cost Breakdown and Activity Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cost Breakdown - 2/3 width */}
        <div className="lg:col-span-2">
          {costsLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : costsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {costsError.message || "Failed to load cost breakdown."}
              </AlertDescription>
            </Alert>
          ) : costBreakdown ? (
            <CostBreakdown data={costBreakdown.breakdown} totalSpent={costBreakdown.grandTotal} />
          ) : null}
        </div>

        {/* Activity Timeline - 1/3 width */}
        <div className="lg:col-span-1">
          {activityLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : activityError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {activityError.message || "Failed to load activity timeline."}
              </AlertDescription>
            </Alert>
          ) : activity ? (
            <ActivityTimeline
              activities={activity.activities.map(
                (a: {
                  id: string
                  action: string
                  entityType: string
                  metadata: Record<string, unknown> | null
                  createdAt: Date
                  user: { id: string; name: string | null; email: string | null }
                }) => ({
                  id: a.id,
                  userId: a.user.id,
                  userName: a.user.name || a.user.email || "Unknown",
                  action: a.action,
                  entityType: a.entityType,
                  metadata: a.metadata,
                  timestamp: a.createdAt,
                })
              )}
              hasMore={false}
            />
          ) : null}
        </div>
      </div>

      {/* Document Gallery */}
      {documentsLoading ? (
        <Skeleton className="h-[400px] w-full" />
      ) : documentsError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {documentsError.message || "Failed to load documents."}
          </AlertDescription>
        </Alert>
      ) : documents ? (
        <DocumentGallery documents={documents.documents} />
      ) : null}
    </div>
  )
}
