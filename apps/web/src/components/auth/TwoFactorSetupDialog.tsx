"use client"

import { useState } from "react"
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
import QRCode from "qrcode"
import { BackupCodesDisplay } from "./BackupCodesDisplay"
import { send2FANotification } from "@/app/actions/two-factor"

interface TwoFactorSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/**
 * TwoFactorSetupDialog - Dialog for setting up 2FA with QR code
 *
 * Guides user through:
 * 1. Password verification for security
 * 2. Scanning QR code with authenticator app
 * 3. Entering verification code
 * 4. Displaying and saving backup codes
 */
export function TwoFactorSetupDialog({ open, onOpenChange, onSuccess }: TwoFactorSetupDialogProps) {
  const { data: session } = useSession()
  const [step, setStep] = useState<"password" | "qr" | "verify" | "backup-codes">("password")
  const [password, setPassword] = useState<string>("")
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [manualSecret, setManualSecret] = useState<string>("")
  const [verificationCode, setVerificationCode] = useState<string>("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  // Verify password and initialize 2FA setup
  const handlePasswordVerify = async () => {
    if (!password || password.length < 1) {
      setError("Password is required")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Enable 2FA with password verification (defense-in-depth security)
      const response = await twoFactor.enable({
        password: password,
      })

      if (!response.data?.totpURI) {
        throw new Error("Failed to generate 2FA secret")
      }

      // Generate QR code from TOTP URI
      const qrUrl = await QRCode.toDataURL(response.data.totpURI)
      setQrCodeUrl(qrUrl)

      // Extract secret for manual entry
      const secret = response.data.totpURI.split("secret=")[1]?.split("&")[0]
      setManualSecret(secret || "")

      // Move to QR code step
      setStep("qr")
      toast.success("Password verified")
    } catch (err) {
      console.error("2FA setup error:", err)
      setError(err instanceof Error ? err.message : "Invalid password or setup failed")
      toast.error("Invalid password or setup failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Verify the code entered by user
  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Verify TOTP code
      const response = await twoFactor.verifyTotp({
        code: verificationCode,
      })

      if (!response.data) {
        throw new Error("Invalid verification code")
      }

      // Generate backup codes
      const backupResponse = await twoFactor.generateBackupCodes({
        password: "", // Session-based auth
      })

      if (!backupResponse.data?.backupCodes) {
        throw new Error("Failed to generate backup codes")
      }

      setBackupCodes(backupResponse.data.backupCodes)
      setStep("backup-codes")
      toast.success("2FA enabled successfully!")

      // QA Fix (SEC-004): Send email notification for 2FA enabled
      if (session?.user?.email && session?.user?.name) {
        await send2FANotification(
          {
            email: session.user.email,
            name: session.user.name,
          },
          "enabled"
        )
      }
    } catch (err) {
      console.error("Verification error:", err)
      setError(err instanceof Error ? err.message : "Invalid verification code")
      toast.error("Invalid verification code")
    } finally {
      setIsLoading(false)
    }
  }

  // Complete setup
  const handleComplete = () => {
    onOpenChange(false)
    onSuccess?.()
  }

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Only reset if not on backup codes step (user must save codes first)
      if (step === "backup-codes") {
        toast.error("Please save your backup codes before closing")
        return
      }
      setStep("password")
      setPassword("")
      setQrCodeUrl("")
      setManualSecret("")
      setVerificationCode("")
      setBackupCodes([])
      setError("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "password" && "Enable Two-Factor Authentication"}
            {step === "qr" && "Set Up Two-Factor Authentication"}
            {step === "verify" && "Verify Your Code"}
            {step === "backup-codes" && "Save Your Backup Codes"}
          </DialogTitle>
          <DialogDescription>
            {step === "password" && "Enter your password to continue"}
            {step === "qr" && "Scan the QR code with your authenticator app"}
            {step === "verify" && "Enter the 6-digit code from your authenticator app"}
            {step === "backup-codes" && "Save these codes in a secure location"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "password" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoFocus
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && password.length > 0) {
                    handlePasswordVerify()
                  }
                }}
              />
            </div>
          </div>
        )}

        {step === "qr" && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner className="h-8 w-8" />
              </div>
            ) : (
              <>
                {qrCodeUrl && (
                  <div className="flex flex-col items-center space-y-4">
                    <img src={qrCodeUrl} alt="2FA QR Code" className="h-48 w-48" />
                    <div className="w-full space-y-2">
                      <Label>Can't scan? Enter this code manually:</Label>
                      <Input value={manualSecret} readOnly className="font-mono text-sm" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {step === "backup-codes" && <BackupCodesDisplay codes={backupCodes} />}

        <DialogFooter>
          {step === "password" && (
            <>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handlePasswordVerify} disabled={isLoading || !password}>
                {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Continue
              </Button>
            </>
          )}

          {step === "qr" && (
            <>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={() => setStep("verify")} disabled={isLoading || !qrCodeUrl}>
                Next
              </Button>
            </>
          )}

          {step === "verify" && (
            <>
              <Button variant="outline" onClick={() => setStep("qr")} disabled={isLoading}>
                Back
              </Button>
              <Button onClick={handleVerify} disabled={isLoading || verificationCode.length !== 6}>
                {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Verify
              </Button>
            </>
          )}

          {step === "backup-codes" && (
            <Button onClick={handleComplete} className="w-full">
              I've Saved My Backup Codes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
