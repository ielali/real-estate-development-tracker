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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Mail, CheckCircle2 } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"
import { toast } from "sonner"

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

/**
 * ProfileSettingsSection - Manage user profile information
 *
 * Allows users to update their first name and last name.
 * Email is displayed but not editable (requires verification flow).
 */
export function ProfileSettingsSection() {
  const { data: session, isPending } = useSession()
  const utils = api.useUtils()

  // Type assertion to include additional user fields from better-auth
  type ExtendedUser = {
    id: string
    email: string
    name: string
    emailVerified: boolean
    image?: string | null
    createdAt: Date
    updatedAt: Date
    twoFactorEnabled?: boolean | null
    firstName?: string
    lastName?: string
    role?: string
  }

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: (session?.user as ExtendedUser)?.firstName || "",
      lastName: (session?.user as ExtendedUser)?.lastName || "",
    },
  })

  const updateProfile = api.users.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully")
      // Invalidate session to refetch updated user data
      utils.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile")
    },
  })

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile.mutate(values)
  }

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const user = session?.user as ExtendedUser

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information. Your name will be visible to partners and
            collaborators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} disabled={updateProfile.isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} disabled={updateProfile.isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={updateProfile.isPending || !form.formState.isDirty}>
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your email address and account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Email Address</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{user?.email}</p>
              {user?.emailVerified && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs">Verified</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Role</span>
            </div>
            <p className="text-sm font-medium capitalize">{user?.role}</p>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              To change your email address, please contact support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
