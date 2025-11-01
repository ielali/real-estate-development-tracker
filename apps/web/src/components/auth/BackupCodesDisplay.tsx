"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Download, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

/**
 * Props for BackupCodesDisplay component
 */
interface BackupCodesDisplayProps {
  /** Array of backup codes (8-character alphanumeric strings) */
  codes: string[]
}

/**
 * BackupCodesDisplay - Display and allow download of 2FA backup codes
 *
 * Renders a grid of backup codes with copy/download functionality.
 * Each code can be used once as an alternative to TOTP when logging in.
 *
 * @component
 * @example
 * ```tsx
 * <BackupCodesDisplay codes={["ABCD1234", "EFGH5678", ...]} />
 * ```
 *
 * Features:
 * - Copy all codes to clipboard
 * - Download codes as text file
 * - Security warning about one-time display
 * - Grid layout (2 columns) for easy reading
 *
 * QA: Addresses CODE-001 (JSDoc documentation requirement)
 *
 * @param {BackupCodesDisplayProps} props - Component props
 * @returns {JSX.Element} Backup codes display UI
 */
export function BackupCodesDisplay({ codes }: BackupCodesDisplayProps) {
  const handleCopy = () => {
    const codesText = codes.join("\n")
    navigator.clipboard.writeText(codesText)
    toast.success("Backup codes copied to clipboard")
  }

  const handleDownload = () => {
    const codesText = codes.join("\n")
    const blob = new Blob([codesText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `2fa-backup-codes-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("Backup codes downloaded")
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Save these codes in a secure location. Each code can be used once if you lose access to
          your authenticator app.
        </AlertDescription>
      </Alert>

      <Card className="p-4">
        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
          {codes.map((code, index) => (
            <div key={index} className="rounded bg-muted p-2 text-center">
              {code}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleCopy} className="flex-1">
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </Button>
        <Button variant="outline" onClick={handleDownload} className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  )
}
