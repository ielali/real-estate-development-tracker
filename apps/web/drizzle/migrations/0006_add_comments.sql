-- Migration: Add comments table for threaded comments on entities
-- Story 8.3: Threaded Comments on Entities
-- Date: 2025-11-04

-- Create comments table
CREATE TABLE IF NOT EXISTS "comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "project_id" text NOT NULL,
  "content" text NOT NULL,
  "parent_comment_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

-- Add foreign keys
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "comments" ADD CONSTRAINT "comments_project_id_projects_id_fk"
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_comments_id_fk"
  FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id")
  ON DELETE set null ON UPDATE no action;

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS "comments_entity_idx"
  ON "comments" USING btree ("entity_type", "entity_id");

CREATE INDEX IF NOT EXISTS "comments_user_id_idx"
  ON "comments" USING btree ("user_id");

CREATE INDEX IF NOT EXISTS "comments_project_id_idx"
  ON "comments" USING btree ("project_id");

CREATE INDEX IF NOT EXISTS "comments_parent_id_idx"
  ON "comments" USING btree ("parent_comment_id");
