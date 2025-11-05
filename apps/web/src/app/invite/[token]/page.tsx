"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { api } from "@/lib/trpc/client"
import { Loader2, CheckCircle, XCircle, LogIn, UserCheck } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"

const registrationSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type RegistrationFormValues = z.infer<typeof registrationSchema>

/**
 * InviteAcceptPage - Partner registration/acceptance page for invited users
 *
 * Features automatic detection of existing users:
 * - If user is logged in and email matches → auto-accept invitation
 * - If user exists but not logged in → show "Login to Accept" button
 * - If user doesn't exist → show registration form
 *
 * @param params - Route parameters containing invitation token
 */
export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>
}): JSX.Element {
  const { token } = use(params)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [autoAccepting, setAutoAccepting] = useState(false)

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  })

  // Fetch invitation details to pre-populate form
  const {
    data: invitationDetails,
    isLoading: validatingToken,
    error: invitationError,
  } = api.partners.getInvitationDetails.useQuery({ token }, { retry: false })

  const tokenValid = !invitationError && invitationDetails !== undefined
  const tokenError = invitationError?.message || null

  // Auto-accept mutation for logged-in users
  const autoAcceptMutation = api.partners.autoAcceptInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("Welcome!", {
        description: "Invitation accepted! Redirecting to project...",
      })

      setTimeout(() => {
        router.push(`/projects/${data.projectId}`)
      }, 1000)
    },
    onError: (error) => {
      toast.error("Auto-accept Failed", {
        description: error.message,
      })
      setAutoAccepting(false)
    },
  })

  // Pre-populate email field when invitation details load
  useEffect(() => {
    if (invitationDetails?.email) {
      form.setValue("email", invitationDetails.email)
    }
  }, [invitationDetails, form])

  // Auto-accept if user is logged in and email matches
  useEffect(() => {
    if (
      !authLoading &&
      !autoAccepting &&
      user &&
      invitationDetails &&
      user.email === invitationDetails.email
    ) {
      setAutoAccepting(true)
      autoAcceptMutation.mutate({ token })
    }
  }, [user, invitationDetails, authLoading, autoAccepting, token, autoAcceptMutation])

  const registerMutation = api.auth.registerWithInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("Welcome!", {
        description: `You now have access to the project.`,
      })

      // Redirect to project dashboard
      setTimeout(() => {
        router.push(`/projects/${data.projectId}`)
      }, 1000)
    },
    onError: (error) => {
      if (error.message.includes("expired")) {
        toast.error("Invitation Expired", {
          description: "This invitation has expired. Please request a new one.",
        })
      } else if (error.message.includes("already been accepted")) {
        toast.error("Invitation Already Used", {
          description: "This invitation has already been accepted. Please log in instead.",
        })
      } else if (error.message.includes("already exists")) {
        toast.error("Account Exists", {
          description: "An account with this email already exists. Please log in instead.",
        })
      } else {
        toast.error("Registration Failed", {
          description: error.message,
        })
      }
    },
  })

  const handleSubmit = (values: RegistrationFormValues): void => {
    registerMutation.mutate({
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      password: values.password,
      invitationToken: token,
    })
  }

  // Loading state while validating token or checking auth
  if (validatingToken || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <XCircle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <h2 className="text-xl font-semibold">Invalid Invitation</h2>
              <p className="mt-2 text-muted-foreground">{tokenError}</p>
            </div>
            <Button onClick={() => router.push("/login")} className="mt-4">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Auto-accepting state for logged-in users with matching email
  if (autoAccepting || (user && invitationDetails && user.email === invitationDetails.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <UserCheck className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <h2 className="text-xl font-semibold">Accepting Invitation...</h2>
              <p className="mt-2 text-muted-foreground">
                Welcome back! We&apos;re adding you to the project.
              </p>
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is logged in but email doesn't match
  if (user && invitationDetails && user.email !== invitationDetails.email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <XCircle className="h-12 w-12 text-yellow-500" />
            <div className="text-center">
              <h2 className="text-xl font-semibold">Email Mismatch</h2>
              <p className="mt-2 text-muted-foreground">
                This invitation was sent to <strong>{invitationDetails.email}</strong>, but
                you&apos;re logged in as <strong>{user.email}</strong>.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Please log out and sign in with the invited email address.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/logout" as any)} variant="outline">
                {" "}
                {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                Log Out
              </Button>
              <Button onClick={() => router.push("/projects")}>Go to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User exists but not logged in - show login prompt
  if (invitationDetails.userExists) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-center">
              <LogIn className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-center text-2xl">Account Found!</CardTitle>
            <CardDescription className="text-center">
              {invitationDetails && (
                <>
                  <span className="font-medium">{invitationDetails.inviterName}</span> has invited
                  you to collaborate on{" "}
                  <span className="font-medium">{invitationDetails.projectName}</span>.
                  <br />
                  <br />
                  We found an existing account for <strong>{invitationDetails.email}</strong>.
                  Please log in to accept this invitation.
                </>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              className="w-full"
              onClick={() => {
                // Store token in sessionStorage to auto-redirect after login
                sessionStorage.setItem("pendingInvitation", token)
                router.push(`/login?redirect=/invite/${token}`)
              }}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Log In to Accept Invitation
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Wrong account?{" "}
              <a href="/register" className="text-primary hover:underline">
                Create a new account
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // New user - show registration form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-center text-2xl">You've Been Invited!</CardTitle>
          <CardDescription className="text-center">
            {invitationDetails && (
              <>
                <span className="font-medium">{invitationDetails.inviterName}</span> has invited you
                to collaborate on{" "}
                <span className="font-medium">{invitationDetails.projectName}</span> with{" "}
                <span className="font-medium">
                  {invitationDetails.permission === "write" ? "edit" : "view"}
                </span>{" "}
                access.
              </>
            )}
            {!invitationDetails &&
              "Create your account to access the project and start collaborating."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                        disabled={registerMutation.isPending}
                        readOnly={!!invitationDetails?.email}
                        className={invitationDetails?.email ? "bg-muted" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          {...field}
                          disabled={registerMutation.isPending}
                        />
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
                        <Input placeholder="Doe" {...field} disabled={registerMutation.isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Accept Invitation & Create Account"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem("pendingInvitation", token)
                router.push(`/login?redirect=/invite/${token}`)
              }}
              className="text-primary hover:underline"
            >
              Log in instead
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
