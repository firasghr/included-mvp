-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add client_id to tasks table
-- Note: This migration adds client_id as nullable initially to support existing data.
-- For new installations: After running this migration, you should:
--   1. Create default client(s) if you have existing tasks
--   2. Update all existing tasks with appropriate client_id values
--   3. Optionally run: ALTER TABLE tasks ALTER COLUMN client_id SET NOT NULL;
-- For new installations without existing data, client_id will be required at the application level.
ALTER TABLE tasks
ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Create index on client_id for faster queries
CREATE INDEX idx_tasks_client_id ON tasks(client_id);

-- Create index on tasks client_id and status for report queries
CREATE INDEX idx_tasks_client_status ON tasks(client_id, status);
