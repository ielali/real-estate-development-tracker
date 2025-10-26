"use client"

import React, { useState } from "react"
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { api } from "@/lib/trpc/client"

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  permission: z.enum(["read", "write"]).default("read"),
})

type InviteFormValues = z.infer<typeof inviteSchema>

interface InvitePartnerDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/**
 * InvitePartnerDialog - Dialog component for inviting partners to a project
 *
 * Handles partner invitation with email input and permission selection.
 * Provides clear messaging for duplicate invitation scenarios and validates
 * input before submission.
 *
 * @param projectId - The project ID to invite the partner to
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback to change dialog open state
 * @param onSuccess - Optional callback fired after successful invitation
 */
export function InvitePartnerDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
}: InvitePartnerDialogProps): JSX.Element {
  const [showResendOption, setShowResendOption] = useState(false)
  const [pendingAccessId, setPendingAccessId] = useState<string | null>(null)

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      permission: "read",
    },
  })

  const utils = api.useUtils()

  const inviteMutation = api.partners.invitePartner.useMutation({
    onSuccess: (data) => {
      if (data.status === "already_partner") {
        toast.info("Already a Partner", {
          description: "This person already has access to this project.",
        })
        return
      }

      if (data.status === "pending_invitation") {
        toast.info("Invitation Pending", {
          description: "An invitation is already pending for this email.",
        })
        setShowResendOption(true)
        setPendingAccessId(data.accessId || null)
        return
      }

      if (data.status === "reinvite_sent") {
        toast.success("Invitation Sent", {
          description: "Invitation sent to previously revoked partner.",
        })
      } else {
        toast.success("Invitation Sent", {
          description: `Invitation sent to ${form.getValues("email")}. They have 7 days to accept.`,
        })
      }

      // Invalidate queries to refresh the list
      void utils.partners.listInvitations.invalidate(projectId)

      // Reset form and close dialog
      form.reset()
      setShowResendOption(false)
      setPendingAccessId(null)
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error) => {
      toast.error("Failed to Send Invitation", {
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

      form.reset()
      setShowResendOption(false)
      setPendingAccessId(null)
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error) => {
      toast.error("Failed to Resend Invitation", {
        description: error.message,
      })
    },
  })

  const handleSubmit = (values: InviteFormValues): void => {
    inviteMutation.mutate({
      projectId,
      email: values.email,
      permission: values.permission,
    })
  }

  const handleResend = (): void => {
    if (pendingAccessId) {
      resendMutation.mutate({ accessId: pendingAccessId })
    }
  }

  const handleCancel = (): void => {
    form.reset()
    setShowResendOption(false)
    setPendingAccessId(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Partner</DialogTitle>
          <DialogDescription>
            Invite someone to collaborate on this project. They will receive an email with
            instructions to accept the invitation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="partner@example.com"
                      {...field}
                      disabled={inviteMutation.isPending || resendMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={inviteMutation.isPending || resendMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="read">Read - View only access</SelectItem>
                      <SelectItem value="write">Write - Full editing access</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Read access allows viewing only. Write access allows full editing.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              {showResendOption && pendingAccessId ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={resendMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleResend} disabled={resendMutation.isPending}>
                    {resendMutation.isPending ? "Resending..." : "Resend Invitation"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={inviteMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
