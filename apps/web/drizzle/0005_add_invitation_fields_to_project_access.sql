-- Migration: Add invitation fields to project_access table
-- Story 4.2: Role-Based Access Control - Partner invitation feature
-- This migration adds columns needed for email-based partner invitations

-- Add invited_email column for pending invitations
ALTER TABLE "project_access" ADD COLUMN IF NOT EXISTS "invited_email" text;

-- Add invitation_token for secure invitation links
ALTER TABLE "project_access" ADD COLUMN IF NOT EXISTS "invitation_token" text;

-- Add expires_at for invitation expiration (7 days from invited_at)
ALTER TABLE "project_access" ADD COLUMN IF NOT EXISTS "expires_at" timestamp;

-- Make user_id nullable to support pending invitations
-- (user_id is null until invitation is accepted)
ALTER TABLE "project_access" ALTER COLUMN "user_id" DROP NOT NULL;

-- Add unique constraint on invitation_token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_access_invitation_token_key'
  ) THEN
    CREATE UNIQUE INDEX "project_access_invitation_token_key"
    ON "project_access"("invitation_token")
    WHERE "invitation_token" IS NOT NULL;
  END IF;
END $$;
