/**
 * Partner Dashboard Page
 *
 * Story 4.2 - Role-Based Access Control (Basic Stub)
 *
 * Provides landing page for partners after login with basic project list.
 * Shows projects assigned to the partner with permission badges.
 *
 * **Story 4.2 Scope**: Basic stub for partner routing and access control
 * **Story 4.3 Scope**: Full-featured dashboard with cost breakdown, activity feed, etc.
 *
 * Features:
 * - List of accessible projects with permission badges
 * - Visual distinction from owner view (gray background)
 * - Empty state if no projects assigned
 * - Links to project detail pages
 */

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUserRole } from "@/hooks/useUserRole"
import { useAccessibleProjects } from "@/hooks/useAccessibleProjects"
import { PermissionBadge } from "@/components/auth/PermissionBadge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function PartnerDashboardPage() {
  const router = useRouter()
  const { role, isLoading: roleLoading } = useUserRole()
  const { projects, isLoading: projectsLoading, error } = useAccessibleProjects()

  // Redirect admins to main project list
  useEffect(() => {
    if (!roleLoading && role === "admin") {
      router.push("/projects")
    }
  }, [role, roleLoading, router])

  // Show loading state
  if (roleLoading || projectsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-6 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load your projects. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Empty state - no projects assigned
  if (projects.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Projects</h1>
            <p className="text-muted-foreground">Projects you have access to as a partner</p>
          </div>
          <Badge variant="secondary" className="bg-gray-100">
            Partner View
          </Badge>
        </div>

        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-2">
              You haven't been invited to any projects yet
            </p>
            <p className="text-sm text-muted-foreground">
              Project owners can invite you to collaborate on their projects
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render project list
  return (
    <div className="container mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header with Partner View indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">
            {projects.length} {projects.length === 1 ? "project" : "projects"} you have access to
          </p>
        </div>
        <Badge variant="secondary" className="bg-gray-200 text-gray-700">
          Partner View
        </Badge>
      </div>

      {/* Project Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <PermissionBadge
                    permission={project.access === "owner" ? "owner" : project.userPermission}
                  />
                </div>
                {project.description && (
                  <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-2">
                {project.address?.formattedAddress && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {project.address.formattedAddress}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {project.projectType.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {project.status}
                  </Badge>
                </div>

                {/* Visual indicator for read-only access */}
                {project.userPermission === "read" && project.access !== "owner" && (
                  <p className="text-xs text-muted-foreground italic">View-only access</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
