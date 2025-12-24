-- Tenant status enum (active, suspended, trial)
-- This migration adds the status column to tenants table if it doesn't exist.
-- Safe to run once after 001_create_tenants.sql

DO $$ BEGIN
    CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'trial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column only if it doesn't exist
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS status tenant_status NOT NULL DEFAULT 'active';

-- Index on status
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
