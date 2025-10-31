"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BackupCodesDisplay } from "@/components/auth"
import { Spinner } from "@/components/ui/spinner"
import { twoFactor, useSession } from "@/lib/auth-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { AlertTriangle, Key, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { send2FANotification } from "@/app/actions/two-factor"

/**
 * BackupCodesPage - Manage 2FA backup codes
 *
 * Allows users with 2FA enabled to:
 * - View existing backup codes (if available)
 * - Regenerate new backup codes (requires 2FA verification)
 * - Download codes for safekeeping
 *
 * Security: Requires active 2FA and valid verification code to regenerate
 */
export default function BackupCodesPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [verificationCode, setVerificationCode] = useState("")
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([])
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState("")

  const twoFactorEnabled = session?.user?.twoFactorEnabled ?? false

  // Redirect if 2FA not enabled
  if (!isPending && !twoFactorEnabled) {
    router.push("/settings/security")
    return null
  }

  const handleRegenerate = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit verification code")
      return
    }

    setIsRegenerating(true)
    setError("")

    try {
      // First verify the 2FA code
      const verifyResponse = await twoFactor.verifyTotp({
        code: verificationCode,
      })

      if (!verifyResponse.data) {
        throw new Error("Invalid verification code")
      }

      // Then regenerate backup codes
      const regenerateResponse = await twoFactor.generateBackupCodes({
        password: "", // Session-based auth
      })

      if (!regenerateResponse.data?.backupCodes) {
        throw new Error("Failed to regenerate backup codes")
      }

      setNewBackupCodes(regenerateResponse.data.backupCodes)
      setVerificationCode("")
      toast.success("Backup codes regenerated successfully")

      // QA Fix (SEC-004): Send email notification for backup codes regenerated
      if (session?.user?.email && session?.user?.name) {
        await send2FANotification(
          {
            email: session.user.email,
            name: session.user.name,
          },
          "backup-codes-regenerated"
        )
      }
    } catch (err) {
      console.error("Backup code regeneration error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to regenerate backup codes"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsRegenerating(false)
    }
  }

  if (isPending) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Link
          href="/settings/security"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Security Settings
        </Link>
        <h1 className="text-3xl font-bold">Backup Codes</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your two-factor authentication backup codes
        </p>
      </div>

      {newBackupCodes.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle>Your New Backup Codes</CardTitle>
            </div>
            <CardDescription>
              These codes replace your old backup codes. Save them in a secure location.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BackupCodesDisplay codes={newBackupCodes} />
            <div className="mt-6">
              <Button
                onClick={() => router.push("/settings/security")}
                className="w-full sm:w-auto"
              >
                Return to Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle>Regenerate Backup Codes</CardTitle>
            </div>
            <CardDescription>
              Create a new set of backup codes. This will invalidate your existing codes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Regenerating backup codes will invalidate all existing
                codes. Make sure you have access to your authenticator app or save the new codes
                immediately.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Why regenerate backup codes?</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>You've used most or all of your existing codes</li>
                  <li>You suspect your codes may have been compromised</li>
                  <li>You've lost access to your saved codes</li>
                </ul>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="text-center text-xl tracking-widest"
                  disabled={isRegenerating}
                  aria-describedby="code-help"
                />
                <p id="code-help" className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <Button
                onClick={handleRegenerate}
                disabled={isRegenerating || verificationCode.length !== 6}
                className="w-full"
              >
                {isRegenerating && <Spinner className="mr-2 h-4 w-4" />}
                {isRegenerating ? "Regenerating..." : "Regenerate Backup Codes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
