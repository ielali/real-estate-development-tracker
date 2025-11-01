"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { PinInput } from "@/components/ui/pin-input"
import { twoFactor } from "@/lib/auth-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface TwoFactorVerifyFormProps {
  onSuccess?: () => void
  onUseBackupCode?: () => void
}

/**
 * TwoFactorVerifyForm - Form for verifying 2FA code during login
 *
 * Features:
 * - Individual digit input fields for better UX
 * - Auto-submit when all 6 digits entered
 * - Optional device trust for 30 days
 * - Backup code fallback option
 */
export function TwoFactorVerifyForm({ onSuccess, onUseBackupCode }: TwoFactorVerifyFormProps) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [trustDevice, setTrustDevice] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const handleVerify = async (verificationCode: string) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await twoFactor.verifyTotp({
        code: verificationCode,
        trustDevice: trustDevice,
      })

      if (!response.data) {
        throw new Error("Invalid verification code")
      }

      toast.success("2FA verification successful")
      onSuccess?.()
      router.push("/")
    } catch (err) {
      console.error("2FA verification error:", err)
      // Server-side rate limiting (5 attempts per 5 minutes) protects against brute force
      // Display error message which may include rate limit information from server
      const errorMessage = err instanceof Error ? err.message : "Invalid verification code"
      setError(errorMessage)
      toast.error(errorMessage)
      // Clear the code on error so user can try again
      setCode("")
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-submit when all 6 digits are entered
  const handleComplete = (completedCode: string) => {
    handleVerify(completedCode)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Verification Code</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Enter the 6-digit code from your authenticator app
        </p>
        <PinInput
          length={6}
          value={code}
          onChange={setCode}
          onComplete={handleComplete}
          disabled={isLoading}
          autoFocus
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="trustDevice"
          checked={trustDevice}
          onCheckedChange={(checked) => setTrustDevice(checked as boolean)}
          disabled={isLoading}
        />
        <Label
          htmlFor="trustDevice"
          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Trust this device for 30 days
        </Label>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Spinner className="h-6 w-6" />
          <span className="ml-2 text-sm text-muted-foreground">Verifying...</span>
        </div>
      )}

      {onUseBackupCode && (
        <Button
          type="button"
          variant="link"
          onClick={onUseBackupCode}
          className="w-full"
          disabled={isLoading}
        >
          Use a backup code instead
        </Button>
      )}
    </div>
  )
}
