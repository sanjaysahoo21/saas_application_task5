-- Ensure task_status enum includes completed; migrate 'done' -> 'completed'
DO $$ BEGIN
    ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'completed';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Normalize existing 'done' values to 'completed'
UPDATE tasks SET status = 'completed' WHERE status = 'done';

-- Priority enum
DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add priority column if missing
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS priority task_priority NOT NULL DEFAULT 'medium';

-- Index on priority
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
