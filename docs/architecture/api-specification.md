# API Specification

Based on the chosen API style (tRPC) from the Tech Stack, this section defines the type-safe API layer that connects the frontend and backend.

## tRPC Router Definitions

The API uses tRPC for end-to-end type safety, automatic client generation, and excellent developer experience. All procedures include Zod validation for runtime safety.

### Partners Router

```typescript
export const partnersRouter = router({
  // Invite partner to project
  invitePartner: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      email: z.string().email(),
      permission: z.enum(['read', 'write']).default('read'),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user owns the project
      const project = await ctx.db.projects.findUnique({
        where: { id: input.projectId, ownerId: ctx.user.id },
      });
      
      if (!project) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      // Check if already invited
      const existing = await ctx.db.users.findUnique({
        where: { email: input.email },
      });
      
      if (existing) {
        // Update existing access
        const access = await ctx.db.projectAccess.upsert({
          where: {
            projectId_userId: {
              projectId: input.projectId,
              userId: existing.id,
            },
          },
          create: {
            projectId: input.projectId,
            userId: existing.id,
            permission: input.permission,
            invitedAt: new Date(),
            acceptedAt: new Date(),
          },
          update: {
            permission: input.permission,
            invitedAt: new Date(),
          },
        });
        
        return access;
      }
      
      // Create invitation token for new user
      const invitationToken = crypto.randomUUID();
      const invitation = await ctx.db.projectAccess.create({
        data: {
          projectId: input.projectId,
          userId: null, // Will be set on registration
          permission: input.permission,
          invitedAt: new Date(),
          // Store token temporarily in metadata or separate table
        },
      });
      
      // Send invitation email via Resend
      await ctx.email.sendInvitation({
        to: input.email,
        projectName: project.name,
        inviterName: `${ctx.user.firstName} ${ctx.user.lastName}`,
        invitationUrl: `${process.env.NEXTAUTH_URL}/invite/${invitationToken}`,
      });
      
      await ctx.auditLog.create({
        action: 'invited',
        entityType: 'user',
        entityId: invitation.id,
        metadata: {
          displayName: `Invited ${input.email} to project`,
          email: input.email,
          permission: input.permission,
        },
      });
      
      return invitation;
    }),
    
  // Accept invitation (used during registration)
  acceptInvitation: publicProcedure
    .input(z.object({
      token: z.string().uuid(),
      userId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const invitation = await ctx.db.projectAccess.findFirst({
        where: {
          // Token lookup logic here
          userId: null, // Pending invitation
        },
      });
      
      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid invitation' });
      }
      
      // Accept invitation
      const accepted = await ctx.db.projectAccess.update({
        where: { id: invitation.id },
        data: {
          userId: input.userId,
          acceptedAt: new Date(),
        },
      });
      
      return accepted;
    }),
    
  // List project partners
  listPartners: protectedProcedure
    .input(z.string().uuid()) // projectId
    .query(async ({ input, ctx }) => {
      return await ctx.db.projectAccess.findMany({
        where: { projectId: input },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { invitedAt: 'asc' },
      });
    }),
    
  // Remove partner access
  removePartner: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      userId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const removed = await ctx.db.projectAccess.update({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
        data: { deletedAt: new Date() },
      });
      
      await ctx.auditLog.create({
        action: 'removed',
        entityType: 'user',
        entityId: removed.userId,
        metadata: {
          displayName: 'Removed partner access',
        },
      });
      
      return removed;
    }),
    
  // Update partner permissions
  updatePermissions: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      userId: z.string().uuid(),
      permission: z.enum(['read', 'write']),
    }))
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.projectAccess.update({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
        data: { permission: input.permission },
      });
      
      return updated;
    }),
});
```

## Core API Patterns

**Authentication Integration:** All protected procedures validate user sessions via Better-auth middleware

**Audit Trail Integration:** Every mutation automatically creates audit log entries for partner transparency

**Type Safety:** Zod schemas ensure runtime validation matches TypeScript types

**Error Handling:** Standardized tRPC error codes with descriptive messages

**Performance:** Cursor-based pagination and selective database includes for mobile optimization

**Mobile Optimization:** Procedures like `quickAdd` designed for minimal payload and fast responses

---

**Detailed Rationale:**

The Partners Router addresses the critical partner transparency goal by providing:

1. **Complete Invitation Flow:** Email-based invitations with secure tokens
2. **Access Control:** Read/write permissions with audit logging 
3. **User Management:** Partner listing, removal, and permission updates
4. **Security:** Project ownership validation and token-based verification

This API enables the PRD's key objective of reducing partner update preparation from 3-5 hours to instant transparency via secure dashboard access.
