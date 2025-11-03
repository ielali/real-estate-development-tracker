-- Migration: Add notification_preferences table
-- Story: 8.2 - Email Notifications with User Preferences

CREATE TABLE IF NOT EXISTS "notification_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"email_on_cost" boolean DEFAULT true NOT NULL,
	"email_on_large_expense" boolean DEFAULT true NOT NULL,
	"email_on_document" boolean DEFAULT true NOT NULL,
	"email_on_timeline" boolean DEFAULT true NOT NULL,
	"email_on_comment" boolean DEFAULT true NOT NULL,
	"email_digest_frequency" text DEFAULT 'immediate' NOT NULL,
	"timezone" text DEFAULT 'Australia/Sydney' NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp NOT NULL
);

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS "notification_preferences_user_id_idx" ON "notification_preferences" USING btree ("user_id");
