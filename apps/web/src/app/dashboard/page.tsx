/**
 * Dashboard Page - Demonstrates collapsible sidebar
 * Story 10.3: Collapsible Sidebar Navigation
 */

import { SidebarLayout } from "@/components/layout/SidebarLayout"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <SidebarLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome to your dashboard. Try collapsing the sidebar using the button or press Cmd/Ctrl
            + B.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Collapsible Sidebar</CardTitle>
              <CardDescription>Story 10.3 Feature</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The sidebar can toggle between 256px (expanded) and 64px (collapsed) states with
                smooth animations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keyboard Shortcut</CardTitle>
              <CardDescription>Quick Toggle</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Press <kbd className="px-2 py-1 text-xs border rounded bg-muted">⌘B</kbd> (Mac) or{" "}
                <kbd className="px-2 py-1 text-xs border rounded bg-muted">Ctrl+B</kbd>{" "}
                (Windows/Linux) to toggle the sidebar.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Persistent State</CardTitle>
              <CardDescription>Remembers Your Preference</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your sidebar preference is saved in localStorage and restored when you revisit the
                page.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tooltips</CardTitle>
              <CardDescription>Collapsed View</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                When collapsed, hover over navigation items to see their labels in tooltips.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active State</CardTitle>
              <CardDescription>Visual Indication</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The current page is highlighted in both expanded and collapsed states with a left
                border accent.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Space Optimization</CardTitle>
              <CardDescription>192px Savings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Collapsing the sidebar saves 192px of horizontal space (256px → 64px), giving you
                more room for content.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  )
}
