"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell } from "lucide-react"
import { toast } from "sonner"

const preferencesFormSchema = z.object({
  emailNotifications: z.boolean(),
  projectUpdates: z.boolean(),
  costAlerts: z.boolean(),
  partnerInvitations: z.boolean(),
})

type PreferencesFormValues = z.infer<typeof preferencesFormSchema>

/**
 * PreferencesSettingsSection - Manage user preferences
 *
 * Allows users to configure email notifications and app preferences.
 * Current implementation shows UI structure; backend integration pending.
 */
export function PreferencesSettingsSection() {
  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      emailNotifications: true,
      projectUpdates: true,
      costAlerts: true,
      partnerInvitations: true,
    },
  })

  const onSubmit = (values: PreferencesFormValues) => {
    // TODO: Implement preferences API endpoint when notification system is built
    console.log("Preferences:", values)
    toast.success("Preferences saved successfully")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Manage when and how you receive email notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="emailNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Email Notifications</FormLabel>
                      <FormDescription>
                        Receive email notifications about your account activity
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectUpdates"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Project Updates</FormLabel>
                      <FormDescription>
                        Get notified when projects you're involved with are updated
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!form.watch("emailNotifications")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costAlerts"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Cost Alerts</FormLabel>
                      <FormDescription>
                        Receive alerts when costs exceed budget thresholds
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!form.watch("emailNotifications")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="partnerInvitations"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Partner Invitations</FormLabel>
                      <FormDescription>
                        Get notified when you're invited to collaborate on projects
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!form.watch("emailNotifications")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Notification preferences will be applied once the email notification system is
                  implemented. This interface is prepared for future functionality.
                </AlertDescription>
              </Alert>

              <Button type="submit" disabled={!form.formState.isDirty}>
                Save Preferences
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
