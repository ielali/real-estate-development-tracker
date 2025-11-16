"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { authClient } from "@/lib/auth-client"
import { emailSchema } from "@/lib/validation/auth"

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: (requires2FA: boolean) => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      })

      if (response.error) {
        throw new Error(response.error.message || "Invalid credentials")
      }

      // Check if 2FA verification is required
      if ((response.data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
        // Notify parent that 2FA is required
        onSuccess?.(true)
        return
      }

      if (response.data) {
        // Call the success handler with no 2FA required
        onSuccess?.(false)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Visually hidden status region for screen readers */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isLoading && "Signing in, please wait..."}
      </div>

      {/* Page Heading */}
      <div className="flex flex-col gap-2 mb-8">
        <p className="text-[#333333] dark:text-slate-200 text-3xl font-black leading-tight tracking-tight">
          Welcome Back
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">
          Sign in to continue to your projects
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              aria-atomic="true"
              className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800"
            >
              <div className="text-sm text-red-800 dark:text-red-200">{errorMessage}</div>
            </div>
          )}

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#333333] dark:text-slate-300 text-sm font-medium">
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    className="flex w-full h-12 rounded-lg text-[#333333] dark:text-slate-100 focus:ring-2 focus:ring-primary/50 border-slate-300 dark:border-slate-700 bg-white dark:bg-background-dark placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-sm text-red-600 dark:text-red-400" />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#333333] dark:text-slate-300 text-sm font-medium">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative w-full">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="flex w-full h-12 rounded-lg text-[#333333] dark:text-slate-100 focus:ring-2 focus:ring-primary/50 border-slate-300 dark:border-slate-700 bg-white dark:bg-background-dark placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 pr-12 text-base"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-sm text-red-600 dark:text-red-400" />
              </FormItem>
            )}
          />

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-navy dark:text-primary bg-slate-100 dark:bg-slate-800"
                    />
                  </FormControl>
                  <FormLabel className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                    Remember me
                  </FormLabel>
                </FormItem>
              )}
            />

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-primary dark:text-primary/90 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            className="flex items-center justify-center whitespace-nowrap rounded-lg h-12 px-6 text-sm font-semibold text-white bg-navy hover:bg-navy-hover dark:bg-primary dark:hover:bg-primary-hover transition-colors w-full"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>

          {/* Sign Up Link */}
          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary dark:text-primary/90 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </form>
      </Form>
    </div>
  )
}
