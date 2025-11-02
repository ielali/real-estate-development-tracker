-- Migration: Add full-text search infrastructure
-- Story 7.1: Implement Global Search with Command Palette

-- Add search_vector columns to all searchable tables
ALTER TABLE "projects" ADD COLUMN "search_vector" tsvector;--> statement-breakpoint
ALTER TABLE "costs" ADD COLUMN "search_vector" tsvector;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "search_vector" tsvector;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "search_vector" tsvector;--> statement-breakpoint

-- Create GIN indexes for fast full-text search
CREATE INDEX "projects_search_idx" ON "projects" USING GIN("search_vector");--> statement-breakpoint
CREATE INDEX "costs_search_idx" ON "costs" USING GIN("search_vector");--> statement-breakpoint
CREATE INDEX "contacts_search_idx" ON "contacts" USING GIN("search_vector");--> statement-breakpoint
CREATE INDEX "documents_search_idx" ON "documents" USING GIN("search_vector");--> statement-breakpoint

-- Create trigger function for projects
CREATE OR REPLACE FUNCTION projects_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

-- Create trigger for projects
CREATE TRIGGER projects_search_trigger
  BEFORE INSERT OR UPDATE ON "projects"
  FOR EACH ROW EXECUTE FUNCTION projects_search_update();--> statement-breakpoint

-- Create trigger function for costs
CREATE OR REPLACE FUNCTION costs_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

-- Create trigger for costs
CREATE TRIGGER costs_search_trigger
  BEFORE INSERT OR UPDATE ON "costs"
  FOR EACH ROW EXECUTE FUNCTION costs_search_update();--> statement-breakpoint

-- Create trigger function for contacts
CREATE OR REPLACE FUNCTION contacts_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.first_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.last_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.company, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.email, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

-- Create trigger for contacts
CREATE TRIGGER contacts_search_trigger
  BEFORE INSERT OR UPDATE ON "contacts"
  FOR EACH ROW EXECUTE FUNCTION contacts_search_update();--> statement-breakpoint

-- Create trigger function for documents
CREATE OR REPLACE FUNCTION documents_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', regexp_replace(coalesce(NEW.file_name, ''), '[^a-zA-Z0-9\s]', ' ', 'g'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

-- Create trigger for documents
CREATE TRIGGER documents_search_trigger
  BEFORE INSERT OR UPDATE ON "documents"
  FOR EACH ROW EXECUTE FUNCTION documents_search_update();--> statement-breakpoint

-- Backfill existing records with search vectors
UPDATE "projects" SET search_vector =
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
WHERE search_vector IS NULL;--> statement-breakpoint

UPDATE "costs" SET search_vector =
  to_tsvector('english', coalesce(description, ''))
WHERE search_vector IS NULL;--> statement-breakpoint

UPDATE "contacts" SET search_vector =
  setweight(to_tsvector('english', coalesce(first_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(last_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(company, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(email, '')), 'C')
WHERE search_vector IS NULL;--> statement-breakpoint

UPDATE "documents" SET search_vector =
  to_tsvector('english', regexp_replace(coalesce(file_name, ''), '[^a-zA-Z0-9\s]', ' ', 'g'))
WHERE search_vector IS NULL;
