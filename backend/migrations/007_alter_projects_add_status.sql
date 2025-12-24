-- Project status enum (active, archived, completed)
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('active', 'archived', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column if missing
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS status project_status NOT NULL DEFAULT 'active';

-- Index on status
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
