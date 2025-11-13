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
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
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

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background-light dark:bg-background-dark text-slate-500 dark:text-slate-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login Buttons (Placeholders) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              disabled
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Google</span>
            </button>

            <button
              type="button"
              className="flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              disabled
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Facebook
              </span>
            </button>
          </div>

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
