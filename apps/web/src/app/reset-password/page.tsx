"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, Loader2 } from "lucide-react"
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(true)

  useEffect(() => {
    const tokenParam = searchParams.get("token")

    if (!tokenParam) {
      setIsValidating(false)
      return
    }

    // Basic token validation (you could add more sophisticated validation here)
    if (tokenParam.length < 10) {
      setIsValidating(false)
      return
    }

    setToken(tokenParam)
    setIsValidating(false)
  }, [searchParams])

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Validating reset token...</span>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Invalid Reset Link
            </h2>
          </div>

          <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Invalid or missing reset token</p>
                  <p className="mt-1">
                    This password reset link is invalid or has expired. Please request a new
                    password reset.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Link
                href="/forgot-password"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Request New Reset Link
              </Link>

              <div className="text-center">
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">Enter your new password below</p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <ResetPasswordForm token={token} />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
