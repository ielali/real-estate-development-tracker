"use client"

import { api } from "@/lib/trpc/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Shield, Users, CheckCircle2, TrendingUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"

/**
 * Admin Security Dashboard
 *
 * Story 6.3: Displays 2FA adoption metrics for administrators
 *
 * Features:
 * - Total user count
 * - Users with 2FA enabled
 * - Adoption percentage
 * - Visual progress indicator
 * - Admin-only access
 */
export default function AdminSecurityPage() {
  const { data: stats, isLoading, error } = api.security.get2FAAdoptionStats.useQuery()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Dashboard</CardTitle>
          <CardDescription>Loading 2FA adoption statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Dashboard</CardTitle>
          <CardDescription>Error loading statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message.includes("FORBIDDEN")
                ? "You must be an administrator to view this page."
                : error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor two-factor authentication adoption across your organization
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Active user accounts</p>
          </CardContent>
        </Card>

        {/* Users with 2FA Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2FA Enabled</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.usersWithTwoFactor || 0}</div>
            <p className="text-xs text-muted-foreground">Users with two-factor authentication</p>
          </CardContent>
        </Card>

        {/* Adoption Percentage Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adoption Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.adoptionPercentage || 0}%</div>
            <p className="text-xs text-muted-foreground">Platform-wide 2FA adoption</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Two-Factor Authentication Adoption</CardTitle>
          <CardDescription>
            Percentage of users who have enabled two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Adoption Progress</span>
              <span className="font-medium">{stats?.adoptionPercentage || 0}%</span>
            </div>
            <Progress value={stats?.adoptionPercentage || 0} className="h-2" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">With 2FA</p>
                <p className="text-2xl font-bold">{stats?.usersWithTwoFactor || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalUsers && stats.totalUsers > 0
                    ? `${Math.round(
                        ((stats.usersWithTwoFactor || 0) / stats.totalUsers) * 100
                      )}% of total users`
                    : "No users yet"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 text-orange-600" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Without 2FA</p>
                <p className="text-2xl font-bold">
                  {(stats?.totalUsers || 0) - (stats?.usersWithTwoFactor || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalUsers && stats.totalUsers > 0
                    ? `${Math.round(
                        ((stats.totalUsers - (stats.usersWithTwoFactor || 0)) / stats.totalUsers) *
                          100
                      )}% of total users`
                    : "No users yet"}
                </p>
              </div>
            </div>
          </div>

          {stats && stats.adoptionPercentage < 50 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Low Adoption Rate</AlertTitle>
              <AlertDescription>
                Less than 50% of users have enabled two-factor authentication. Consider encouraging
                users to enable 2FA for enhanced security.
              </AlertDescription>
            </Alert>
          )}

          {stats && stats.adoptionPercentage >= 80 && (
            <Alert className="border-green-600/20 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900 dark:text-green-100">
                Excellent Security Posture
              </AlertTitle>
              <AlertDescription className="text-green-800 dark:text-green-200">
                Over 80% of users have enabled two-factor authentication. Your organization has
                strong security practices!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
