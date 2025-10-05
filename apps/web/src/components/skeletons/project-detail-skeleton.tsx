import { Card, CardContent, CardHeader } from "@/components/ui/card"

/**
 * ProjectDetailSkeleton - Loading skeleton for project detail page
 *
 * Displays placeholder content while project details are loading
 * Matches the structure of the project detail view with tabs
 */
export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Project Header */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <div className="h-10 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>

      {/* Content Area */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
