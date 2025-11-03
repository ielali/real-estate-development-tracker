"use client"

/**
 * Notification Settings Page
 * Story 8.2: User preference management UI
 * AC #2, #3, #4 - Settings page with immediate save
 */

import { useState } from "react"
import { api } from "@/lib/trpc/client"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function NotificationSettingsPage() {
  const { data: preferences, isLoading } = api.notificationPreferences.getPreferences.useQuery()

  const updatePreferences = api.notificationPreferences.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences saved")
    },
    onError: (error) => {
      toast.error(`Failed to save preferences: ${error.message}`)
    },
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleToggle = async (field: string, value: boolean) => {
    setIsSaving(true)
    try {
      await updatePreferences.mutateAsync({ [field]: value })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDigestFrequencyChange = async (value: string) => {
    setIsSaving(true)
    try {
      await updatePreferences.mutateAsync({
        emailDigestFrequency: value as "immediate" | "daily" | "weekly" | "never",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTimezoneChange = async (value: string) => {
    setIsSaving(true)
    try {
      await updatePreferences.mutateAsync({ timezone: value })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading preferences...</p>
        </div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Failed to load preferences</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage how you receive notifications about project activities
        </p>
      </div>

      {/* Email Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose which types of activities you want to receive email notifications for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailOnCost">Cost Added</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails when costs are added to your projects
              </p>
            </div>
            <Switch
              id="emailOnCost"
              checked={preferences.emailOnCost}
              onCheckedChange={(value) => handleToggle("emailOnCost", value)}
              disabled={isSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailOnLargeExpense">Large Expense Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get immediate alerts for expenses over $10,000 (bypasses digest settings)
              </p>
            </div>
            <Switch
              id="emailOnLargeExpense"
              checked={preferences.emailOnLargeExpense}
              onCheckedChange={(value) => handleToggle("emailOnLargeExpense", value)}
              disabled={isSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailOnDocument">Document Uploaded</Label>
              <p className="text-sm text-muted-foreground">
                Be notified when documents are uploaded to your projects
              </p>
            </div>
            <Switch
              id="emailOnDocument"
              checked={preferences.emailOnDocument}
              onCheckedChange={(value) => handleToggle("emailOnDocument", value)}
              disabled={isSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailOnTimeline">Timeline Events</Label>
              <p className="text-sm text-muted-foreground">
                Get updates about timeline events in your projects
              </p>
            </div>
            <Switch
              id="emailOnTimeline"
              checked={preferences.emailOnTimeline}
              onCheckedChange={(value) => handleToggle("emailOnTimeline", value)}
              disabled={isSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailOnComment">Comments</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when someone comments on your projects
              </p>
            </div>
            <Switch
              id="emailOnComment"
              checked={preferences.emailOnComment}
              onCheckedChange={(value) => handleToggle("emailOnComment", value)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Frequency */}
      <Card>
        <CardHeader>
          <CardTitle>Email Frequency</CardTitle>
          <CardDescription>
            Choose how often you want to receive email notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={preferences.emailDigestFrequency}
            onValueChange={handleDigestFrequencyChange}
            disabled={isSaving}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="immediate" id="immediate" className="mt-1" />
              <div className="flex-1 space-y-1">
                <Label htmlFor="immediate" className="cursor-pointer">
                  Immediate
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send emails as events happen (up to 10 per hour)
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="daily" id="daily" className="mt-1" />
              <div className="flex-1 space-y-1">
                <Label htmlFor="daily" className="cursor-pointer">
                  Daily Digest
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive one email per day at 8 AM with all your notifications
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="weekly" id="weekly" className="mt-1" />
              <div className="flex-1 space-y-1">
                <Label htmlFor="weekly" className="cursor-pointer">
                  Weekly Digest
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive one email per week on Monday at 8 AM
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="never" id="never" className="mt-1" />
              <div className="flex-1 space-y-1">
                <Label htmlFor="never" className="cursor-pointer">
                  Never
                </Label>
                <p className="text-sm text-muted-foreground">
                  Turn off all email notifications (in-app notifications only)
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card>
        <CardHeader>
          <CardTitle>Timezone</CardTitle>
          <CardDescription>Set your timezone for digest email scheduling</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={preferences.timezone}
            onValueChange={handleTimezoneChange}
            disabled={isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
              <SelectItem value="Australia/Melbourne">Melbourne (AEDT)</SelectItem>
              <SelectItem value="Australia/Brisbane">Brisbane (AEST)</SelectItem>
              <SelectItem value="Australia/Perth">Perth (AWST)</SelectItem>
              <SelectItem value="Australia/Adelaide">Adelaide (ACDT)</SelectItem>
              <SelectItem value="Pacific/Auckland">Auckland (NZDT)</SelectItem>
              <SelectItem value="America/New_York">New York (EST)</SelectItem>
              <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
              <SelectItem value="America/Chicago">Chicago (CST)</SelectItem>
              <SelectItem value="Europe/London">London (GMT)</SelectItem>
              <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
              <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
              <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
              <SelectItem value="Asia/Hong_Kong">Hong Kong (HKT)</SelectItem>
              <SelectItem value="UTC">UTC</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          Note: Large expense alerts (over $10,000) will always be sent immediately, regardless of
          your digest settings.
        </p>
        <p>All email notifications include an unsubscribe link if you wish to opt out entirely.</p>
      </div>
    </div>
  )
}
