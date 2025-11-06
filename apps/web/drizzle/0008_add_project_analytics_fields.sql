-- Migration: Add analytics fields to projects table
-- Story 9.2: Multi-Project Comparative Analytics

-- Add size field for cost-per-sqft calculation
ALTER TABLE "projects" ADD COLUMN "size" bigint;

-- Add comment for documentation
COMMENT ON COLUMN "projects"."size" IS 'Square footage of the project for cost-per-sqft calculations';
