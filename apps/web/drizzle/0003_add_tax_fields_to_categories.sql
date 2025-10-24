-- Add tax fields to categories table (Story 2.3)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "tax_deductible" boolean;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "tax_category" text;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "is_custom" boolean DEFAULT false NOT NULL;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false NOT NULL;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "created_at" timestamp;

-- Add foreign key constraint for created_by_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'categories_created_by_id_users_id_fk'
  ) THEN
    ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_id_users_id_fk"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
