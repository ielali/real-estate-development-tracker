"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { api } from "@/lib/trpc/client"
import { formatDistance } from "date-fns"
import { RefreshCw, X, Send } from "lucide-react"

interface InvitationsListProps {
  projectId: string
}

/**
 * InvitationsList - Display table of pending and accepted invitations
 *
 * Shows invitation status with enhanced visibility including expiration countdown,
 * status badges, and action buttons for resend, cancel, and revoke operations.
 *
 * @param projectId - The project ID to list invitations for
 */
export function InvitationsList({ projectId }: InvitationsListProps): JSX.Element {
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedAccessId, setSelectedAccessId] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<string>("")

  const { data: invitations, isLoading } = api.partners.listInvitations.useQuery(projectId)

  const utils = api.useUtils()

  const revokeMutation = api.partners.revokeAccess.useMutation({
    onSuccess: () => {
      toast.success("Access Revoked", {
        description: `Access revoked for ${selectedEmail}`,
      })
      void utils.partners.listInvitations.invalidate(projectId)
      setRevokeDialogOpen(false)
      setSelectedAccessId(null)
      setSelectedEmail("")
    },
    onError: (error) => {
      toast.error("Failed to Revoke Access", {
        description: error.message,
      })
    },
  })

  const cancelMutation = api.partners.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation Cancelled", {
        description: `Invitation cancelled for ${selectedEmail}`,
      })
      void utils.partners.listInvitations.invalidate(projectId)
      setCancelDialogOpen(false)
      setSelectedAccessId(null)
      setSelectedEmail("")
    },
    onError: (error) => {
      toast.error("Failed to Cancel Invitation", {
        description: error.message,
      })
    },
  })

  const resendMutation = api.partners.resendInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation Resent", {
        description: "A new invitation has been sent.",
      })
      void utils.partners.listInvitations.invalidate(projectId)
    },
    onError: (error) => {
      toast.error("Failed to Resend Invitation", {
        description: error.message,
      })
    },
  })

  const handleRevoke = (accessId: string, email: string): void => {
    setSelectedAccessId(accessId)
    setSelectedEmail(email)
    setRevokeDialogOpen(true)
  }

  const handleCancel = (accessId: string, email: string): void => {
    setSelectedAccessId(accessId)
    setSelectedEmail(email)
    setCancelDialogOpen(true)
  }

  const handleResend = (accessId: string): void => {
    resendMutation.mutate({ accessId })
  }

  const confirmRevoke = (): void => {
    if (selectedAccessId) {
      revokeMutation.mutate({
        projectId,
        accessId: selectedAccessId,
      })
    }
  }

  const confirmCancel = (): void => {
    if (selectedAccessId) {
      cancelMutation.mutate({ accessId: selectedAccessId })
    }
  }

  const getStatusBadge = (invitation: NonNullable<typeof invitations>[number]): JSX.Element => {
    if (invitation.status === "accepted") {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          Active
        </Badge>
      )
    }

    if (invitation.status === "expired") {
      return (
        <Badge variant="secondary" className="bg-gray-400">
          Expired
        </Badge>
      )
    }

    // Pending with days remaining
    const daysText =
      invitation.daysRemaining === 1 ? "Expires tomorrow" : `${invitation.daysRemaining} days left`

    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
        {daysText}
      </Badge>
    )
  }

  const getPermissionBadge = (permission: "read" | "write"): JSX.Element => {
    if (permission === "write") {
      return <Badge variant="default">Write</Badge>
    }
    return <Badge variant="secondary">Read</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No invitations yet. Invite partners to collaborate on this project.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email / Name</TableHead>
              <TableHead>Permission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited</TableHead>
              <TableHead>Expires / Accepted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>
                  {invitation.user ? (
                    <div>
                      <div className="font-medium">
                        {invitation.user.firstName} {invitation.user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">{invitation.email}</div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">{invitation.email}</div>
                  )}
                </TableCell>
                <TableCell>{getPermissionBadge(invitation.permission)}</TableCell>
                <TableCell>{getStatusBadge(invitation)}</TableCell>
                <TableCell>
                  {invitation.invitedAt
                    ? formatDistance(new Date(invitation.invitedAt), new Date(), {
                        addSuffix: true,
                      })
                    : "-"}
                </TableCell>
                <TableCell>
                  {invitation.acceptedAt ? (
                    <span>
                      {formatDistance(new Date(invitation.acceptedAt), new Date(), {
                        addSuffix: true,
                      })}
                    </span>
                  ) : invitation.expiresAt ? (
                    <span className="text-muted-foreground">
                      {formatDistance(new Date(invitation.expiresAt), new Date(), {
                        addSuffix: true,
                      })}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {invitation.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResend(invitation.id)}
                          disabled={resendMutation.isPending}
                          title="Resend invitation email"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancel(invitation.id, invitation.email)}
                          disabled={cancelMutation.isPending}
                          title="Cancel pending invitation"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {invitation.status === "accepted" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRevoke(invitation.id, invitation.email)}
                        disabled={revokeMutation.isPending}
                      >
                        Revoke
                      </Button>
                    )}
                    {invitation.status === "expired" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResend(invitation.id)}
                        disabled={resendMutation.isPending}
                      >
                        Resend
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Revoke Access Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Partner Access?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke access for <strong>{selectedEmail}</strong>? They will
              no longer be able to view or edit this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invitation Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation for <strong>{selectedEmail}</strong>?
              The invitation link will no longer work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>Cancel Invitation</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
