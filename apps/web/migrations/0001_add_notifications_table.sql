-- Create notifications table
-- Story 8.1: In-App Notification System

CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"project_id" text,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_user_id_users_id_fk"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
ON DELETE cascade ON UPDATE no action;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_project_id_projects_id_fk"
FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id")
ON DELETE cascade ON UPDATE no action;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "notifications_user_id_read_idx" ON "notifications" USING btree ("user_id","read");
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "notifications_project_id_idx" ON "notifications" USING btree ("project_id");
