"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, ShieldCheck, ShieldOff, Key, Smartphone, KeyRound } from "lucide-react"
import { TwoFactorSetupDialog } from "./TwoFactorSetupDialog"
import { Disable2FADialog } from "./Disable2FADialog"
import { ChangePasswordForm } from "./ChangePasswordForm"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

/**
 * SecuritySettingsSection - Display 2FA status and management controls
 *
 * Shows current 2FA status and provides buttons to:
 * - Enable 2FA
 * - Disable 2FA
 * - Regenerate backup codes
 * - View trusted devices
 */
export function SecuritySettingsSection() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)

  // Check if user has 2FA enabled
  const twoFactorEnabled = session?.user?.twoFactorEnabled ?? false

  const handleEnable2FA = () => {
    setShowSetupDialog(true)
  }

  const handleSetupSuccess = () => {
    // Refresh session to get updated 2FA status
    // QA Fix (PERF-001): Use router.refresh() instead of window.location.reload()
    // This re-fetches server data without full page reload, preserving client state
    router.refresh()
  }

  const handleDisableSuccess = () => {
    // Refresh session to get updated 2FA status
    // QA Fix (PERF-001): Use router.refresh() instead of window.location.reload()
    router.refresh()
  }

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle>Two-Factor Authentication</CardTitle>
                {twoFactorEnabled ? (
                  <Badge variant="default" className="gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <ShieldOff className="h-3 w-3" />
                    Disabled
                  </Badge>
                )}
              </div>
              <CardDescription>
                Add an extra layer of security to your account with two-factor authentication
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!twoFactorEnabled ? (
            <>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Enable two-factor authentication to protect your account from unauthorized access.
                  You'll need an authenticator app like Google Authenticator or Authy.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">How it works:</h4>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>Download an authenticator app if you don't have one</li>
                  <li>Scan the QR code with your authenticator app</li>
                  <li>Enter the 6-digit code to verify</li>
                  <li>Save your backup codes in a secure location</li>
                </ol>
              </div>

              <Button onClick={handleEnable2FA} className="w-full sm:w-auto">
                <Smartphone className="mr-2 h-4 w-4" />
                Enable Two-Factor Authentication
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  Your account is protected with two-factor authentication. You'll be asked for a
                  code from your authenticator app when you sign in.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" size="sm" asChild>
                  <a href="/settings/security/backup-codes">
                    <Key className="mr-2 h-4 w-4" />
                    View Backup Codes
                  </a>
                </Button>

                <Button variant="outline" size="sm" asChild>
                  <a href="/settings/security/devices">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Manage Trusted Devices
                  </a>
                </Button>
              </div>

              <div className="border-t pt-4">
                <Button variant="destructive" size="sm" onClick={() => setShowDisableDialog(true)}>
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Disable Two-Factor Authentication
                </Button>
                <p className="mt-2 text-sm text-muted-foreground">
                  This will remove the extra security layer from your account
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password</CardDescription>
        </CardHeader>
        <CardContent>
          {!showChangePassword ? (
            <Button variant="outline" onClick={() => setShowChangePassword(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          ) : (
            <ChangePasswordForm
              onSuccess={() => setShowChangePassword(false)}
              onCancel={() => setShowChangePassword(false)}
            />
          )}
        </CardContent>
      </Card>

      <TwoFactorSetupDialog
        open={showSetupDialog}
        onOpenChange={setShowSetupDialog}
        onSuccess={handleSetupSuccess}
      />
      <Disable2FADialog
        open={showDisableDialog}
        onOpenChange={setShowDisableDialog}
        onSuccess={handleDisableSuccess}
      />
    </div>
  )
}
