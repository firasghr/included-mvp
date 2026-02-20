-- Add phone, workflow_settings, and inbound_email columns to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS workflow_settings JSONB,
ADD COLUMN IF NOT EXISTS inbound_email TEXT;
