"use client"

/**
 * Unsubscribe Page
 * Story 8.2: AC #10 - Unsubscribe link functionality
 */

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Bell, Settings } from "lucide-react"
import Link from "next/link"

export default function UnsubscribePage() {
  const params = useParams()
  const router = useRouter()
  if (!params) return null
  const token = params.token as string

  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const updatePreferences = api.notificationPreferences.updatePreferences.useMutation({
    onSuccess: () => {
      setSuccess(true)
    },
    onError: (error) => {
      setError(`Failed to update preferences: ${error.message}`)
    },
  })

  // Verify JWT token using tRPC
  const { data: tokenData, error: tokenError } =
    api.notificationPreferences.verifyUnsubscribeToken.useQuery(
      { token },
      {
        retry: false,
        refetchOnWindowFocus: false,
      }
    )

  useEffect(() => {
    if (tokenError) {
      setError(tokenError.message || "Invalid or expired unsubscribe link")
    } else if (tokenData) {
      setUserId(tokenData.userId)
    }
  }, [tokenData, tokenError])

  const handleUnsubscribe = async () => {
    if (!userId) {
      setError("Invalid token")
      return
    }

    try {
      await updatePreferences.mutateAsync({
        emailDigestFrequency: "never",
      })
    } catch (err) {
      console.error("Unsubscribe error:", err)
    }
  }

  const handleManagePreferences = () => {
    router.push("/settings/notifications")
  }

  // Loading state
  if (!userId && !error) {
    return (
      <div className="container max-w-2xl py-16">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Verifying unsubscribe link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container max-w-2xl py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle>Unsubscribe Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              If you want to manage your notification preferences, please sign in to your account.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild variant="outline">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="container max-w-2xl py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle>Successfully Unsubscribed</CardTitle>
            <CardDescription>
              You will no longer receive email notifications from Real Estate Portfolio
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You will still receive in-app notifications. To manage all your notification
              preferences, visit your settings page.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild variant="outline">
                <Link href="/settings/notifications">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Preferences
                </Link>
              </Button>
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Confirmation state
  return (
    <div className="container max-w-2xl py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Bell className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle>Unsubscribe from Email Notifications</CardTitle>
          <CardDescription>
            Are you sure you want to stop receiving email notifications?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">What happens when you unsubscribe:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>You will stop receiving all email notifications</li>
              <li>You will still receive in-app notifications</li>
              <li>You can re-enable emails anytime from your settings</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleUnsubscribe}
              variant="destructive"
              className="w-full"
              disabled={updatePreferences.isPending}
            >
              {updatePreferences.isPending ? "Unsubscribing..." : "Unsubscribe from All Emails"}
            </Button>

            <Button onClick={handleManagePreferences} variant="outline" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Manage Notification Preferences
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Instead of unsubscribing completely, you can customize which emails you receive in your
            notification settings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
