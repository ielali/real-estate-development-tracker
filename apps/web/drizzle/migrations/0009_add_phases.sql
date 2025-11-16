-- Migration: Add construction phases table and link events to phases
-- Created: 2025-11-16

-- Create phases table
CREATE TABLE IF NOT EXISTS "phases" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"phase_number" integer NOT NULL,
	"phase_type" varchar(100),
	"planned_start_date" timestamp,
	"planned_end_date" timestamp,
	"actual_start_date" timestamp,
	"actual_end_date" timestamp,
	"progress" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'planned' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint for project_id
DO $$ BEGIN
 ALTER TABLE "phases" ADD CONSTRAINT "phases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add phaseId column to events table
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "phase_id" text;

-- Add foreign key constraint for phase_id
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "phases_project_id_idx" ON "phases" ("project_id");
CREATE INDEX IF NOT EXISTS "phases_status_idx" ON "phases" ("status");
CREATE INDEX IF NOT EXISTS "events_phase_id_idx" ON "events" ("phase_id");
