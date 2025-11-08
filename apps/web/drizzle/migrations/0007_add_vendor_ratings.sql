-- Migration: Add vendor_ratings table for vendor performance tracking
-- Story 9.3: Vendor Performance Metrics & Rating System
-- Date: 2025-11-07

-- Create vendor_ratings table
CREATE TABLE IF NOT EXISTS "vendor_ratings" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "contact_id" text NOT NULL,
  "project_id" text NOT NULL,
  "rating" integer NOT NULL,
  "review" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  CONSTRAINT "rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- Add foreign keys
ALTER TABLE "vendor_ratings" ADD CONSTRAINT "vendor_ratings_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "vendor_ratings" ADD CONSTRAINT "vendor_ratings_contact_id_contacts_id_fk"
  FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "vendor_ratings" ADD CONSTRAINT "vendor_ratings_project_id_projects_id_fk"
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id")
  ON DELETE cascade ON UPDATE no action;

-- Add unique constraint for one rating per user per vendor per project
-- Note: Partial unique index to allow multiple soft-deleted ratings
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_vendor_project"
  ON "vendor_ratings" ("user_id", "contact_id", "project_id")
  WHERE "deleted_at" IS NULL;

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS "idx_vendor_ratings_contact"
  ON "vendor_ratings" USING btree ("contact_id")
  WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_vendor_ratings_user"
  ON "vendor_ratings" USING btree ("user_id")
  WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_vendor_ratings_project"
  ON "vendor_ratings" USING btree ("project_id")
  WHERE "deleted_at" IS NULL;
