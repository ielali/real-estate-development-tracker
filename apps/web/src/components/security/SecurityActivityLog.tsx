"use client"

/**
 * Security Activity Log Component
 *
 * Story 6.3: Displays last 50 security events for the current user
 *
 * Features:
 * - Fetches activity log from security.getActivityLog tRPC endpoint
 * - Displays events in table format with: type, timestamp, IP, device
 * - Read-only display (no edit/delete functionality)
 * - Responsive design for mobile
 */

import Link from "next/link"
import { api } from "@/lib/trpc/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  Clock,
  MapPin,
  Monitor,
  FileArchive,
  Key,
  Shield,
  ExternalLink,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

/**
 * Get human-readable label for event type
 */
function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    "2fa_enabled": "Two-Factor Authentication Enabled",
    "2fa_disabled": "Two-Factor Authentication Disabled",
    "2fa_login_success": "Successful 2FA Login",
    "2fa_login_failure": "Failed 2FA Login Attempt",
    backup_code_generated: "Backup Codes Generated",
    backup_code_used: "Backup Code Used for Login",
    backup_downloaded: "Project Backup Downloaded",
  }
  return labels[eventType] || eventType
}

/**
 * Get icon for event type
 */
function getEventTypeIcon(eventType: string) {
  switch (eventType) {
    case "2fa_enabled":
    case "2fa_disabled":
      return <Shield className="h-4 w-4" />
    case "2fa_login_success":
    case "2fa_login_failure":
      return <Key className="h-4 w-4" />
    case "backup_code_generated":
    case "backup_code_used":
      return <Key className="h-4 w-4" />
    case "backup_downloaded":
      return <FileArchive className="h-4 w-4" />
    default:
      return <Shield className="h-4 w-4" />
  }
}

/**
 * Get badge variant for event type
 */
function getEventTypeBadgeVariant(
  eventType: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (eventType) {
    case "2fa_enabled":
    case "backup_code_generated":
      return "default"
    case "2fa_disabled":
    case "2fa_login_failure":
      return "destructive"
    case "backup_downloaded":
    case "2fa_login_success":
      return "secondary"
    default:
      return "outline"
  }
}

/**
 * Parse user agent to extract device/browser information
 */
function parseUserAgent(userAgent: string): string {
  if (userAgent === "unknown") return "Unknown Device"

  // Basic parsing - extract browser and OS
  const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)/)
  const osMatch = userAgent.match(/(Windows|Mac OS X|Linux|Android|iOS)/)

  const browser = browserMatch ? browserMatch[1] : "Unknown Browser"
  const os = osMatch ? osMatch[1] : "Unknown OS"

  return `${browser} on ${os}`
}

/**
 * Mask IP address for privacy (show first 3 octets only)
 */
function maskIpAddress(ipAddress: string): string {
  if (ipAddress === "unknown") return "Unknown Location"

  const parts = ipAddress.split(".")
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`
  }
  return ipAddress
}

export function SecurityActivityLog() {
  const { data: events, isLoading, error } = api.security.getActivityLog.useQuery()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Activity Log</CardTitle>
          <CardDescription>Loading your recent security events...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Activity Log</CardTitle>
          <CardDescription>Error loading security events</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Activity Log</CardTitle>
          <CardDescription>Your security event history will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Events Yet</AlertTitle>
            <AlertDescription>
              Security events like 2FA changes, backup code usage, and project backup downloads will
              be logged here for your review.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Activity Log</CardTitle>
        <CardDescription>
          Last {events.length} security events • This log is read-only for security purposes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Device</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event: (typeof events)[0]) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={getEventTypeBadgeVariant(event.eventType)}>
                        <span className="mr-1">{getEventTypeIcon(event.eventType)}</span>
                        {getEventTypeLabel(event.eventType)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {maskIpAddress(event.ipAddress)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Monitor className="h-4 w-4" />
                      {parseUserAgent(event.userAgent)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p>
            Security events are logged automatically and cannot be deleted. If you notice any
            suspicious activity, please contact support immediately.
          </p>
          <p>
            <Link
              href="https://github.com/ielali/real-estate-development-tracker/blob/main/docs/guides/backup-restoration.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Learn more about backup security and restoration
              <ExternalLink className="h-3 w-3" />
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
