-- Migration: Add junction tables for cost-document and contact-document relationships
-- This migration creates the infrastructure for linking documents to costs and contacts

-- Create cost_documents junction table
CREATE TABLE IF NOT EXISTS "cost_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT current_timestamp NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp NOT NULL,
	"deleted_at" timestamp,
	"cost_id" text NOT NULL,
	"document_id" text NOT NULL
);
--> statement-breakpoint

-- Create contact_documents junction table
CREATE TABLE IF NOT EXISTS "contact_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT current_timestamp NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp NOT NULL,
	"deleted_at" timestamp,
	"contact_id" text NOT NULL,
	"document_id" text NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints for cost_documents
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cost_documents_cost_id_costs_id_fk') THEN
    ALTER TABLE "cost_documents" ADD CONSTRAINT "cost_documents_cost_id_costs_id_fk"
      FOREIGN KEY ("cost_id") REFERENCES "public"."costs"("id") ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cost_documents_document_id_documents_id_fk') THEN
    ALTER TABLE "cost_documents" ADD CONSTRAINT "cost_documents_document_id_documents_id_fk"
      FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for contact_documents
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contact_documents_contact_id_contacts_id_fk') THEN
    ALTER TABLE "contact_documents" ADD CONSTRAINT "contact_documents_contact_id_contacts_id_fk"
      FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contact_documents_document_id_documents_id_fk') THEN
    ALTER TABLE "contact_documents" ADD CONSTRAINT "contact_documents_document_id_documents_id_fk"
      FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- Create unique indexes on junction tables (prevent duplicate links)
CREATE UNIQUE INDEX IF NOT EXISTS "unique_cost_document_idx" ON "cost_documents" USING btree ("cost_id","document_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_contact_document_idx" ON "contact_documents" USING btree ("contact_id","document_id") WHERE deleted_at IS NULL;--> statement-breakpoint

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS "cost_documents_cost_idx" ON "cost_documents" USING btree ("cost_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cost_documents_document_idx" ON "cost_documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_documents_contact_idx" ON "contact_documents" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_documents_document_idx" ON "contact_documents" USING btree ("document_id");
