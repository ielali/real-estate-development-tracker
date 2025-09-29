"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, CheckCircle, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { authClient } from "@/lib/auth-client"
import { passwordWithConfirmSchema } from "@/lib/validation/auth"

const resetPasswordSchema = passwordWithConfirmSchema

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

interface ResetPasswordFormProps {
  token: string
  onSuccess?: () => void
}

export function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const { error } = await authClient.resetPassword({
        token,
        newPassword: values.password,
      })

      if (error) {
        throw new Error(error.message || "Failed to reset password")
      }

      setIsSuccess(true)
      onSuccess?.()
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("token") || error.message.includes("expired")) {
          setErrorMessage(
            "This password reset link has expired or is invalid. Please request a new one."
          )
        } else {
          setErrorMessage(error.message)
        }
      } else {
        setErrorMessage("An error occurred while resetting your password")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <div className="text-sm text-green-800">
              <p className="font-medium">Password reset successful!</p>
              <p className="mt-1">
                Your password has been updated. You can now sign in with your new password.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button type="button" onClick={() => (window.location.href = "/login")}>
            Go to Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {errorMessage && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <div className="text-sm text-red-800">{errorMessage}</div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">Reset your password</h3>
          <p className="text-sm text-gray-600">
            Enter your new password below. Make sure it's strong and secure.
          </p>
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
              <div className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters with uppercase, lowercase, and number. All special
                characters and symbols are allowed.
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showConfirmPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reset Password
        </Button>
      </form>
    </Form>
  )
}
