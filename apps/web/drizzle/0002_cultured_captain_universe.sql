-- Idempotent migration: only add columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'thumbnail_url') THEN
    ALTER TABLE "documents" ADD COLUMN "thumbnail_url" text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploaded_by_id') THEN
    ALTER TABLE "documents" ADD COLUMN "uploaded_by_id" text;
    UPDATE "documents" SET "uploaded_by_id" = (SELECT "id" FROM "users" ORDER BY "created_at" ASC LIMIT 1) WHERE "uploaded_by_id" IS NULL;
    ALTER TABLE "documents" ALTER COLUMN "uploaded_by_id" SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'tax_deductible') THEN
    ALTER TABLE "categories" ADD COLUMN "tax_deductible" boolean;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'tax_category') THEN
    ALTER TABLE "categories" ADD COLUMN "tax_category" text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'notes') THEN
    ALTER TABLE "categories" ADD COLUMN "notes" text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_custom') THEN
    ALTER TABLE "categories" ADD COLUMN "is_custom" boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_archived') THEN
    ALTER TABLE "categories" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'created_by_id') THEN
    ALTER TABLE "categories" ADD COLUMN "created_by_id" text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'created_at') THEN
    ALTER TABLE "categories" ADD COLUMN "created_at" timestamp;
  END IF;
END $$;--> statement-breakpoint
-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'documents_uploaded_by_id_users_id_fk') THEN
    ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'categories_created_by_id_users_id_fk') THEN
    ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;