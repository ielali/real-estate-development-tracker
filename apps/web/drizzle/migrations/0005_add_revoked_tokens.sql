-- Story 8.2: QA Fix - Token revocation mechanism
-- Migration: Add revoked_tokens table for preventing token reuse

CREATE TABLE IF NOT EXISTS "revoked_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jti" text NOT NULL,
	"user_id" text NOT NULL,
	"purpose" text NOT NULL,
	"revoked_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"reason" text,
	CONSTRAINT "revoked_tokens_jti_unique" UNIQUE("jti")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revoked_tokens" ADD CONSTRAINT "revoked_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revoked_tokens_jti_idx" ON "revoked_tokens" USING btree ("jti");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revoked_tokens_user_id_idx" ON "revoked_tokens" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revoked_tokens_expires_at_idx" ON "revoked_tokens" USING btree ("expires_at");
