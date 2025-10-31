"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { twoFactor, useSession } from "@/lib/auth-client"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"
import { send2FANotification } from "@/app/actions/two-factor"

/**
 * Zod schema for disabling 2FA - requires password + 2FA code
 */
const disableSchema = z.object({
  password: z.string().min(1, "Password is required"),
  code: z.string().length(6, "Code must be 6 digits"),
})

type DisableFormData = z.infer<typeof disableSchema>

/**
 * Props for Disable2FADialog component
 */
interface Disable2FADialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void
  /** Optional callback when 2FA is successfully disabled */
  onSuccess?: () => void
}

/**
 * Disable2FADialog - Secure dialog for disabling two-factor authentication
 *
 * Implements defense-in-depth security by requiring BOTH:
 * - User's current password
 * - Valid 2FA code from authenticator app
 *
 * @component
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false)
 * <Disable2FADialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   onSuccess={() => router.refresh()}
 * />
 * ```
 *
 * Security Features:
 * - Validates password before disabling
 * - Requires valid TOTP code
 * - Clears twoFactorSecret and twoFactorEnabled via better-auth
 * - Revokes all trusted devices automatically
 * - Shows destructive warning alert
 *
 * Form Validation:
 * - Password: Required (min 1 character)
 * - Code: Required (exactly 6 digits)
 *
 * QA: Addresses CODE-001 (JSDoc documentation requirement)
 *
 * @param {Disable2FADialogProps} props - Component props
 * @returns {JSX.Element} Disable 2FA dialog UI
 */
export function Disable2FADialog({ open, onOpenChange, onSuccess }: Disable2FADialogProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DisableFormData>({
    resolver: zodResolver(disableSchema),
    defaultValues: {
      password: "",
      code: "",
    },
  })

  const onSubmit = async (data: DisableFormData) => {
    setIsLoading(true)
    setError("")

    try {
      // First verify the 2FA code
      const verifyResponse = await twoFactor.verifyTotp({
        code: data.code,
      })

      if (!verifyResponse.data) {
        throw new Error("Invalid 2FA code")
      }

      // If verified, disable 2FA
      const disableResponse = await twoFactor.disable({
        password: data.password,
      })

      if (!disableResponse.data) {
        throw new Error("Failed to disable 2FA")
      }

      toast.success("Two-factor authentication disabled successfully")

      // QA Fix (SEC-004): Send email notification for 2FA disabled
      if (session?.user?.email && session?.user?.name) {
        await send2FANotification(
          {
            email: session.user.email,
            name: session.user.name,
          },
          "disabled"
        )
      }

      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error("Disable 2FA error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to disable 2FA"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
      setError("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Enter your password and a verification code to disable 2FA on your account
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Disabling 2FA will make your account less secure. This action will also remove all
            trusted devices.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Current Password</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder="Enter your password"
              disabled={isLoading}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              {...register("code")}
              placeholder="000000"
              className="text-center text-xl tracking-widest"
              disabled={isLoading}
              aria-describedby={errors.code ? "code-error" : undefined}
            />
            {errors.code && (
              <p id="code-error" className="text-sm text-destructive">
                {errors.code.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {isLoading ? "Disabling..." : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
