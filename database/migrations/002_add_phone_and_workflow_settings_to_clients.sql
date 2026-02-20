-- Add phone and workflow_settings columns to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS workflow_settings JSONB;
