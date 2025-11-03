-- Migration: Add email_logs and digest_queue tables
-- Story: 8.2 - Email Notifications with User Preferences

-- Email Logs table for delivery tracking and retry logic
CREATE TABLE IF NOT EXISTS "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"notification_id" uuid,
	"email_type" text NOT NULL,
	"recipient_email" text NOT NULL,
	"subject" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"resend_id" text,
	"attempts" integer DEFAULT 1 NOT NULL,
	"last_error" text,
	"sent_at" timestamp DEFAULT current_timestamp NOT NULL,
	"delivered_at" timestamp
);

-- Digest Queue table for batch email scheduling
CREATE TABLE IF NOT EXISTS "digest_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"notification_id" uuid NOT NULL,
	"digest_type" text NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT current_timestamp NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "digest_queue" ADD CONSTRAINT "digest_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "digest_queue" ADD CONSTRAINT "digest_queue_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for email_logs
CREATE INDEX IF NOT EXISTS "email_logs_user_id_idx" ON "email_logs" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "email_logs" USING btree ("status");
CREATE INDEX IF NOT EXISTS "email_logs_sent_at_idx" ON "email_logs" USING btree ("sent_at");

-- Create indexes for digest_queue
CREATE INDEX IF NOT EXISTS "digest_queue_user_id_idx" ON "digest_queue" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "digest_queue_processed_idx" ON "digest_queue" USING btree ("processed");
CREATE INDEX IF NOT EXISTS "digest_queue_scheduled_for_idx" ON "digest_queue" USING btree ("scheduled_for");
CREATE INDEX IF NOT EXISTS "digest_queue_digest_type_idx" ON "digest_queue" USING btree ("digest_type");
