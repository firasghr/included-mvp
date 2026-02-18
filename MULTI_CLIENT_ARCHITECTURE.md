# Multi-Client Architecture

This document describes the multi-client architecture implementation in the Included MVP backend.

## Overview

The backend now supports multiple clients through a multi-client architecture where:
- Each task belongs to a specific client via `client_id`
- Reports are generated per client
- Data isolation ensures one client's tasks never appear in another client's reports

## Database Schema

### Clients Table
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tasks Table (Updated)
The tasks table now includes a `client_id` foreign key:
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  input TEXT NOT NULL,
  output TEXT,
  status TEXT NOT NULL CHECK (status IN ('processing', 'done', 'failed')),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes
For optimal query performance:
- `idx_tasks_client_id` - Index on client_id for faster task lookups
- `idx_tasks_client_status` - Composite index for report generation queries

## API Changes

### POST /task
**Before:**
```json
{
  "text": "Task description"
}
```

**After:**
```json
{
  "text": "Task description",
  "clientId": "uuid-of-client"
}
```

The `clientId` field is now required and validated.

### GET /report
**Before:**
```
GET /report
```

**After:**
```
GET /report?clientId=uuid-of-client
```

The `clientId` query parameter is now required and validated.

## Data Isolation

Data isolation is enforced at multiple levels:

1. **Database Level**: Foreign key constraint ensures tasks belong to valid clients
2. **Query Level**: All report queries filter by `client_id` explicitly
3. **API Level**: Client ID is required and validated for all operations

### Example: Report Generation

When Client A requests a report (`GET /report?clientId=client-a-uuid`):
```sql
SELECT output FROM tasks 
WHERE client_id = 'client-a-uuid' 
AND status = 'done'
ORDER BY created_at DESC
```

This query ensures:
- Only tasks belonging to Client A are returned
- No cross-client data leakage is possible
- Client B's tasks are completely isolated

## Migration Guide

### For Existing Databases

If you have an existing database with tasks:

1. Create a default client:
```sql
INSERT INTO clients (name) VALUES ('Default Client') RETURNING id;
```

2. Update existing tasks with the default client ID:
```sql
UPDATE tasks SET client_id = 'client-id-from-step-1';
```

3. Make client_id NOT NULL (if not already):
```sql
ALTER TABLE tasks ALTER COLUMN client_id SET NOT NULL;
```

### For New Databases

Simply run the migration script:
```bash
cat database/migrations/001_create_clients_table.sql
```

## Testing Client Isolation

### Create Test Clients
```sql
INSERT INTO clients (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Client A'),
  ('00000000-0000-0000-0000-000000000002', 'Client B');
```

### Create Tasks for Each Client
```bash
# Client A Task
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Client A task",
    "clientId": "00000000-0000-0000-0000-000000000001"
  }'

# Client B Task
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Client B task",
    "clientId": "00000000-0000-0000-0000-000000000002"
  }'
```

### Verify Data Isolation
```bash
# Get Client A Report (should only show Client A tasks)
curl "http://localhost:3000/report?clientId=00000000-0000-0000-0000-000000000001"

# Get Client B Report (should only show Client B tasks)
curl "http://localhost:3000/report?clientId=00000000-0000-0000-0000-000000000002"
```

## Security Considerations

1. **Authentication**: In production, implement proper authentication to validate that users can only access their own client's data
2. **Authorization**: Add middleware to verify the user has permission to access the specified client
3. **Rate Limiting**: Implement per-client rate limiting to prevent abuse
4. **Input Validation**: Client IDs are validated as non-empty strings (UUID validation recommended)

## Production Recommendations

1. **Add Client Authentication**: Implement JWT or OAuth with client context
2. **Add Client Context Middleware**: Extract clientId from authentication token
3. **Audit Logging**: Log all client operations for security auditing
4. **Multi-tenancy**: Consider row-level security (RLS) in Supabase for additional protection
5. **Client Quotas**: Implement usage limits per client

## Example Client Management

### Create a New Client
```sql
INSERT INTO clients (name, email)
VALUES ('Acme Corporation', 'contact@acme.com')
RETURNING id;
```

### List All Clients
```sql
SELECT id, name, email, created_at FROM clients ORDER BY created_at DESC;
```

### View Client Statistics
```sql
SELECT 
  c.name,
  COUNT(t.id) as total_tasks,
  SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
  SUM(CASE WHEN t.status = 'processing' THEN 1 ELSE 0 END) as processing_tasks,
  SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_tasks
FROM clients c
LEFT JOIN tasks t ON t.client_id = c.id
GROUP BY c.id, c.name;
```

## TypeScript Types

The following TypeScript interfaces are available:

```typescript
interface Task {
  id: string;
  input: string;
  output: string | null;
  status: 'processing' | 'done' | 'failed';
  client_id: string;
  created_at?: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}
```
