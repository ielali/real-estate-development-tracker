/**
 * Home Page
 *
 * Provides context-aware landing experience:
 * - Partners: Shows their accessible projects (partner dashboard)
 * - Admins: Shows welcome message with quick navigation
 * - Guests: Shows marketing content with login prompt
 */

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/providers/AuthProvider"
import { useUserRole } from "@/hooks/useUserRole"
import { useAccessibleProjects } from "@/hooks/useAccessibleProjects"
import { PermissionBadge } from "@/components/auth/PermissionBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Navbar } from "@/components/layout/Navbar"
import { AlertCircle, ArrowRight } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { role, isLoading: roleLoading } = useUserRole()
  const { projects, isLoading: projectsLoading, error } = useAccessibleProjects()

  // Partners see their dashboard, admins can go to projects page
  const isPartner = role === "partner"
  const isAdmin = role === "admin"

  // Redirect admins to projects page after a brief moment
  useEffect(() => {
    if (!roleLoading && isAdmin) {
      // Give user a moment to see the home page before redirecting
      const timer = setTimeout(() => {
        router.push("/projects")
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isAdmin, roleLoading, router])

  // Loading state for authenticated users while role/projects load
  if (user && (roleLoading || (isPartner && projectsLoading))) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
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
      </main>
    )
  }

  // Error state for partner project loading
  if (isPartner && error) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load your projects. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    )
  }

  // Partner Dashboard - Show accessible projects
  if (isPartner) {
    // Empty state - no projects assigned
    if (projects.length === 0) {
      return (
        <main className="min-h-screen bg-background">
          <Navbar />
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
        </main>
      )
    }

    // Partner Dashboard with projects
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto p-6 space-y-6">
          {/* Header with Partner View indicator */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Projects</h1>
              <p className="text-muted-foreground">
                {projects.length} {projects.length === 1 ? "project" : "projects"} you have access
                to
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
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
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
      </main>
    )
  }

  // Admin View - Welcome with quick navigation
  if (isAdmin) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-12">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Welcome back, {user?.name || user?.email}!
            </h1>
            <p className="text-xl text-muted-foreground">
              Manage your real estate development projects, track costs, and collaborate with
              partners.
            </p>

            <div className="flex gap-4 justify-center pt-6">
              <Button onClick={() => router.push("/projects")} size="lg">
                View Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={() => router.push("/projects/new")} variant="outline" size="lg">
                Create Project
              </Button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Guest View - Marketing content
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-12">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Real Estate Development Tracker
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive platform for managing real estate development projects, tracking costs,
            managing contacts, and providing transparent partner dashboards.
          </p>

          <div className="bg-card text-card-foreground rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold mb-2">Not Logged In</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Please log in to access your dashboard.
            </p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
