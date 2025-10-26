"use client"

import { useState } from "react"
import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/Navbar"
import { InvitePartnerDialog } from "@/components/partners/InvitePartnerDialog"
import { InvitationsList } from "@/components/partners/InvitationsList"
import { UserPlus } from "lucide-react"

/**
 * PartnersPage - Project partners management page
 *
 * Allows project owners to invite partners, view pending and accepted invitations,
 * and manage partner access. Includes responsive layout optimized for mobile.
 *
 * @param params - Route parameters containing project ID
 */
export default function PartnersPage({ params }: { params: Promise<{ id: string }> }): JSX.Element {
  const { id: projectId } = use(params)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  return (
    <>
      <Navbar />
      <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href={`/projects/${projectId}` as never} className="text-blue-600 hover:underline">
            ← Back to Project
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Project Partners</h1>
            <p className="text-muted-foreground">
              Invite and manage partners who can collaborate on this project
            </p>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)} className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Partner
          </Button>
        </div>

        {/* Invitations List */}
        <InvitationsList projectId={projectId} />

        {/* Invite Dialog */}
        <InvitePartnerDialog
          projectId={projectId}
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
        />
      </div>
    </>
  )
}
