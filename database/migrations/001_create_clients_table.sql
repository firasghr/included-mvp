-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
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

-- Create summaries table to store LLM processing results
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on task_id for faster lookups
CREATE INDEX idx_summaries_task_id ON summaries(task_id);

-- Create index on client_id for client-specific queries
CREATE INDEX idx_summaries_client_id ON summaries(client_id);

-- Create notification_events table for notification-ready architecture
CREATE TABLE notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on client_id for client-specific queries
CREATE INDEX idx_notification_events_client_id ON notification_events(client_id);

-- Create index on status for processing pending notifications
CREATE INDEX idx_notification_events_status ON notification_events(status);

-- Create index on summary_id for linking notifications to summaries
CREATE INDEX idx_notification_events_summary_id ON notification_events(summary_id);
