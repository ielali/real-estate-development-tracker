ALTER TABLE "documents" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "uploaded_by_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "tax_deductible" boolean;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "tax_category" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_custom" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "created_by_id" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "created_at" timestamp;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;