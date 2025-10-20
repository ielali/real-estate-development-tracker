-- Migration: Add junction tables for events and update events table
-- This migration:
-- 1. Creates event_contacts, event_documents, event_costs junction tables
-- 2. Adds created_by_id column to events table
-- 3. Removes array columns from events table (related_cost_ids, related_document_ids, related_contact_ids)

-- Create event_contacts junction table
CREATE TABLE IF NOT EXISTS "event_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"event_id" text NOT NULL,
	"contact_id" text NOT NULL
);
--> statement-breakpoint

-- Create event_documents junction table
CREATE TABLE IF NOT EXISTS "event_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"event_id" text NOT NULL,
	"document_id" text NOT NULL
);
--> statement-breakpoint

-- Create event_costs junction table
CREATE TABLE IF NOT EXISTS "event_costs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"event_id" text NOT NULL,
	"cost_id" text NOT NULL
);
--> statement-breakpoint

-- Add created_by_id column to events table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'created_by_id') THEN
    ALTER TABLE "events" ADD COLUMN "created_by_id" text;
    -- Set created_by_id to the oldest user for existing events
    UPDATE "events" SET "created_by_id" = (SELECT "id" FROM "users" ORDER BY "created_at" ASC LIMIT 1) WHERE "created_by_id" IS NULL;
    ALTER TABLE "events" ALTER COLUMN "created_by_id" SET NOT NULL;
  END IF;
END $$;
--> statement-breakpoint

-- Drop old array columns from events table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'related_cost_ids') THEN
    ALTER TABLE "events" DROP COLUMN "related_cost_ids";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'related_document_ids') THEN
    ALTER TABLE "events" DROP COLUMN "related_document_ids";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'related_contact_ids') THEN
    ALTER TABLE "events" DROP COLUMN "related_contact_ids";
  END IF;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for event_contacts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'event_contacts_event_id_events_id_fk') THEN
    ALTER TABLE "event_contacts" ADD CONSTRAINT "event_contacts_event_id_events_id_fk"
      FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'event_contacts_contact_id_contacts_id_fk') THEN
    ALTER TABLE "event_contacts" ADD CONSTRAINT "event_contacts_contact_id_contacts_id_fk"
      FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for event_documents
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'event_documents_event_id_events_id_fk') THEN
    ALTER TABLE "event_documents" ADD CONSTRAINT "event_documents_event_id_events_id_fk"
      FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'event_documents_document_id_documents_id_fk') THEN
    ALTER TABLE "event_documents" ADD CONSTRAINT "event_documents_document_id_documents_id_fk"
      FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for event_costs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'event_costs_event_id_events_id_fk') THEN
    ALTER TABLE "event_costs" ADD CONSTRAINT "event_costs_event_id_events_id_fk"
      FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'event_costs_cost_id_costs_id_fk') THEN
    ALTER TABLE "event_costs" ADD CONSTRAINT "event_costs_cost_id_costs_id_fk"
      FOREIGN KEY ("cost_id") REFERENCES "public"."costs"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- Add foreign key constraint for events.created_by_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'events_created_by_id_users_id_fk') THEN
    ALTER TABLE "events" ADD CONSTRAINT "events_created_by_id_users_id_fk"
      FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- Create unique indexes on junction tables (prevent duplicate links)
CREATE UNIQUE INDEX IF NOT EXISTS "unique_event_contact_idx" ON "event_contacts" ("event_id","contact_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_event_document_idx" ON "event_documents" ("event_id","document_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_event_cost_idx" ON "event_costs" ("event_id","cost_id") WHERE deleted_at IS NULL;--> statement-breakpoint

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS "event_contacts_event_idx" ON "event_contacts" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_contacts_contact_idx" ON "event_contacts" ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_documents_event_idx" ON "event_documents" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_documents_document_idx" ON "event_documents" ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_costs_event_idx" ON "event_costs" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_costs_cost_idx" ON "event_costs" ("cost_id");
