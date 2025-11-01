"use client"

import { useState } from "react"
import { TwoFactorVerifyForm } from "@/components/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { twoFactor } from "@/lib/auth-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { logBackupCodeUsed } from "@/app/actions/log-2fa-login"

export default function Verify2FAPage() {
  const router = useRouter()
  const [showBackupCode, setShowBackupCode] = useState(false)
  const [backupCode, setBackupCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleBackupCodeSubmit = async () => {
    if (!backupCode || backupCode.length < 8) {
      setError("Please enter a valid backup code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await twoFactor.verifyBackupCode({
        code: backupCode,
      })

      if (!response.data) {
        throw new Error("Invalid backup code")
      }

      toast.success("Backup code verified successfully")

      // QA Fix (SEC-004): Log backup code usage and send email notification
      // Session is automatically updated by better-auth after successful verification
      // The response contains the user data we need
      if (response.data.user?.id && response.data.user?.email && response.data.user?.name) {
        await logBackupCodeUsed({
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
        })
      }

      router.push("/")
    } catch (err) {
      console.error("Backup code verification error:", err)
      setError("Invalid backup code")
      toast.error("Invalid backup code")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            {showBackupCode
              ? "Enter one of your backup codes"
              : "Enter the 6-digit code from your authenticator app"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!showBackupCode ? (
            <TwoFactorVerifyForm onUseBackupCode={() => setShowBackupCode(true)} />
          ) : (
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="backup-code">Backup Code</Label>
                <Input
                  id="backup-code"
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  className="font-mono text-center"
                  autoFocus
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  Enter one of the backup codes you saved when setting up 2FA
                </p>
              </div>

              <Button
                onClick={handleBackupCodeSubmit}
                className="w-full"
                disabled={isLoading || !backupCode}
              >
                {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                {isLoading ? "Verifying..." : "Verify Backup Code"}
              </Button>

              <Button
                type="button"
                variant="link"
                onClick={() => setShowBackupCode(false)}
                className="w-full"
                disabled={isLoading}
              >
                Use authenticator code instead
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
