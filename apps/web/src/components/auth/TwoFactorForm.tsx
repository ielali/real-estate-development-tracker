"use client"

import React, { useState, useRef, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { twoFactor } from "@/lib/auth-client"

interface TwoFactorFormProps {
  onSuccess?: () => void
  onBack?: () => void
}

export function TwoFactorForm({ onSuccess, onBack }: TwoFactorFormProps) {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""])
  const [trustDevice, setTrustDevice] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleCodeChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) {
      value = value.slice(-1)
    }

    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return
    }

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setErrorMessage(null)

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace navigation
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newCode = [...code]

    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i]
    }

    setCode(newCode)

    // Focus last filled input or first empty
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const fullCode = code.join("")
    if (fullCode.length !== 6) {
      setErrorMessage("Please enter all 6 digits")
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await twoFactor.verifyTotp({
        code: fullCode,
      })

      if (response.error) {
        throw new Error(response.error.message || "Invalid verification code")
      }

      if (response.data) {
        onSuccess?.()
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred")
      // Clear the code on error
      setCode(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Visually hidden status region for screen readers */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isLoading && "Verifying code, please wait..."}
      </div>

      {/* Back Button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          <span className="text-sm font-medium">Back to login</span>
        </button>
      )}

      {/* 2FA Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">
              lock
            </span>
          </div>
        </div>
        <p className="text-[#333333] dark:text-slate-200 text-2xl font-black leading-tight tracking-tight text-center">
          Two-Factor Authentication
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal text-center">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {/* 2FA Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800"
          >
            <div className="text-sm text-red-800 dark:text-red-200 text-center">{errorMessage}</div>
          </div>
        )}

        {/* 2FA Code Input */}
        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-background-dark text-[#333333] dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
              disabled={isLoading}
              aria-label={`Digit ${index + 1} of 6`}
            />
          ))}
        </div>

        {/* Verify Button */}
        <Button
          type="submit"
          className="flex items-center justify-center whitespace-nowrap rounded-lg h-12 px-6 text-sm font-semibold text-white bg-navy hover:bg-navy-hover dark:bg-primary dark:hover:bg-primary-hover transition-colors w-full"
          disabled={isLoading || code.some((digit) => !digit)}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Verifying..." : "Verify Code"}
        </Button>

        {/* Trust Device */}
        <div className="flex items-center justify-center gap-2">
          <Checkbox
            id="trust"
            checked={trustDevice}
            onCheckedChange={(checked) => setTrustDevice(checked as boolean)}
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-navy dark:text-primary bg-slate-100 dark:bg-slate-800"
          />
          <label
            htmlFor="trust"
            className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            Trust this device for 30 days
          </label>
        </div>

        {/* Resend Code */}
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Didn't receive the code?{" "}
          <button
            type="button"
            className="font-medium text-primary dark:text-primary/90 hover:underline"
            disabled={isLoading}
          >
            Resend code
          </button>
        </p>

        {/* Help Links */}
        <div className="border-t border-slate-300 dark:border-slate-700 pt-6 mt-2">
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 mb-3">
            Having trouble?
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="text-center text-sm text-primary dark:text-primary/90 hover:underline"
              onClick={() => {
                // Navigate to backup code page
                window.location.href = "/login/verify-2fa"
              }}
              disabled={isLoading}
            >
              Use backup code
            </button>
            <button
              type="button"
              className="text-center text-sm text-primary dark:text-primary/90 hover:underline"
              disabled={isLoading}
            >
              Contact support
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
