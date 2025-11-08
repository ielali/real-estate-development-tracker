-- Migration: Add two_factor_enabled column to users table
-- This column is used by Better-auth for two-factor authentication support

-- Add two_factor_enabled column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'two_factor_enabled') THEN
    ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;
  END IF;
END $$;

