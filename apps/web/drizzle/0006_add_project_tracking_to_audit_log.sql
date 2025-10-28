-- Migration: Add project tracking to audit log
-- Story 4.3: Partner Dashboard - Activity Timeline feature
-- Adds projectId and createdAt columns to audit_log table for project-specific activity tracking

-- Add project_id column (nullable initially for existing rows)
ALTER TABLE "audit_log" ADD COLUMN "project_id" text;

-- Add foreign key constraint to projects table with CASCADE delete
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_project_id_projects_id_fk"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade;

-- Add created_at column (default to timestamp for compatibility)
ALTER TABLE "audit_log" ADD COLUMN "created_at" timestamp DEFAULT current_timestamp NOT NULL;

-- Update existing rows: set created_at = timestamp for data consistency
UPDATE "audit_log" SET "created_at" = "timestamp" WHERE "created_at" IS NULL;

-- Create index on project_id for efficient timeline queries
CREATE INDEX IF NOT EXISTS "audit_log_project_id_idx" ON "audit_log"("project_id");

-- Create index on created_at for efficient time-based queries
CREATE INDEX IF NOT EXISTS "audit_log_created_at_idx" ON "audit_log"("created_at");
