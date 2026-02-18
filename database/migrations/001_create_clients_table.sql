-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add client_id to tasks table
ALTER TABLE tasks
ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Create index on client_id for faster queries
CREATE INDEX idx_tasks_client_id ON tasks(client_id);

-- Create index on tasks client_id and status for report queries
CREATE INDEX idx_tasks_client_status ON tasks(client_id, status);
