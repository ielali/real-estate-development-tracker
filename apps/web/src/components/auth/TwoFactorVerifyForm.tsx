"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { twoFactor } from "@/lib/auth-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const verifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
  trustDevice: z.boolean().default(false),
})

type VerifyFormData = z.infer<typeof verifySchema>

interface TwoFactorVerifyFormProps {
  onSuccess?: () => void
  onUseBackupCode?: () => void
}

/**
 * TwoFactorVerifyForm - Form for verifying 2FA code during login
 *
 * Accepts 6-digit TOTP code from authenticator app.
 * Optionally trusts device for 30 days.
 */
export function TwoFactorVerifyForm({ onSuccess, onUseBackupCode }: TwoFactorVerifyFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: "",
      trustDevice: false,
    },
  })

  const code = watch("code")
  const trustDevice = watch("trustDevice")

  const onSubmit = async (data: VerifyFormData) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await twoFactor.verifyTotp({
        code: data.code,
        trustDevice: data.trustDevice,
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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="code">Verification Code</Label>
        <Input
          id="code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          {...register("code")}
          value={code}
          onChange={(e) => setValue("code", e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="text-center text-2xl tracking-widest"
          autoFocus
          disabled={isLoading}
          aria-describedby={errors.code ? "code-error" : undefined}
        />
        {errors.code && (
          <p id="code-error" className="text-sm text-destructive">
            {errors.code.message}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="trustDevice"
          checked={trustDevice}
          onCheckedChange={(checked) => setValue("trustDevice", checked as boolean)}
          disabled={isLoading}
        />
        <Label
          htmlFor="trustDevice"
          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Trust this device for 30 days
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
        {isLoading ? "Verifying..." : "Verify"}
      </Button>

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
    </form>
  )
}
