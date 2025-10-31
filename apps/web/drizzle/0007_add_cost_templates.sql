-- Migration: Add cost_templates table
-- This migration creates the cost_templates table to store user-defined cost templates

CREATE TABLE IF NOT EXISTS "cost_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT current_timestamp NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp NOT NULL,
	"deleted_at" timestamp,
	"user_id" text NOT NULL,
	"project_id" text,
	"name" text NOT NULL,
	"amount" bigint,
	"description" text NOT NULL,
	"category_id" text NOT NULL,
	"contact_id" text
);
--> statement-breakpoint

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cost_templates_user_id_users_id_fk') THEN
    ALTER TABLE "cost_templates" ADD CONSTRAINT "cost_templates_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cost_templates_project_id_projects_id_fk') THEN
    ALTER TABLE "cost_templates" ADD CONSTRAINT "cost_templates_project_id_projects_id_fk"
      FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cost_templates_category_id_categories_id_fk') THEN
    ALTER TABLE "cost_templates" ADD CONSTRAINT "cost_templates_category_id_categories_id_fk"
      FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cost_templates_contact_id_contacts_id_fk') THEN
    ALTER TABLE "cost_templates" ADD CONSTRAINT "cost_templates_contact_id_contacts_id_fk"
      FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS "cost_templates_user_idx" ON "cost_templates" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cost_templates_project_idx" ON "cost_templates" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cost_templates_category_idx" ON "cost_templates" ("category_id");
