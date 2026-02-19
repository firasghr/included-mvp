# Included MVP

Private AI assistant for SMBs to automate emails, documents, CRM updates, and reporting. Production-ready MVP.

## Features

- **Multi-Client Architecture**: Complete data isolation between clients with client-specific tasks and reports
- **Client Management**: Create and manage multiple clients with company information
- **Task Processing**: Automated LLM-powered task processing with robust lifecycle management (pending → processing → completed/failed)
- **Summary Storage**: Dedicated summaries table for storing LLM-generated summaries
- **Daily Reporting**: Automated generation of daily task reports filtered by client
- **Email Notifications**: Robust email notification system with Resend API integration, batch processing, and retry logic
- **Notification-Ready**: Built-in notification event system (email, WhatsApp) ready for integration
- **Clean Architecture**: Separation of concerns with controllers, services, routes, and middleware
- **Retry Logic**: Automatic retry with exponential backoff for LLM processing and email sending
- **Production-Ready**: Built with TypeScript, Express, and Supabase for scalability

## Architecture

The backend follows clean architecture principles with clear separation of concerns:

```
controllers/
├── clientController.ts    # Client endpoint handlers
├── taskController.ts      # Task endpoint handlers
└── reportController.ts    # Report endpoint handlers

routes/
├── clientRoutes.ts        # Client route definitions
├── taskRoutes.ts          # Task route definitions
└── reportRoutes.ts        # Report route definitions

services/
├── clientService.ts       # Client business logic
├── taskService.ts         # Task business logic
├── summaryService.ts      # Summary business logic
├── notificationService.ts # Notification event management
├── emailService.ts        # Email sending with Resend API
└── reportService.ts       # Report generation logic

lib/
└── middleware.ts          # Express middleware (logging, error handling)

database/
├── supabase.ts            # Supabase client with lazy initialization
└── migrations/            # SQL migration scripts

orchestrator/
└── index.ts               # Main Express server

workers/
├── llmWorker.ts           # OpenAI GPT-4o-mini LLM processing with retry logic
├── automationWorker.ts    # Background task processing worker
└── emailWorker.ts         # Email notification batch processing worker

types/
└── task.ts                # TypeScript type definitions
```

## API Endpoints

### POST /clients
Create a new client.

**Request:**
```json
{
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "company": "Acme Corp"
}
```

**Response:**
```json
{
  "success": true,
  "client": {
    "id": "uuid",
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "company": "Acme Corp",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /clients
Get all clients.

**Response:**
```json
{
  "success": true,
  "clients": [
    {
      "id": "uuid",
      "name": "Acme Corporation",
      "email": "contact@acme.com",
      "company": "Acme Corp",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /clients/:id
Get a single client by ID.

**Response:**
```json
{
  "success": true,
  "client": {
    "id": "uuid",
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "company": "Acme Corp",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /task
Creates and processes a new task with LLM for a specific client.

**Request:**
```json
{
  "text": "Your input text here",
  "clientId": "client-uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "uuid",
  "status": "processing"
}
```

### GET /report
Generates a daily report of all tasks for a specific client.

**Query Parameters:**
- `clientId` (required): The UUID of the client

**Example:**
```
GET /report?clientId=client-uuid-here
```

**Response:**
```json
{
  "report": "📝 Daily Report:\n- Summary of email: The team needs to schedule a meeting next week to discuss Q1 results and plan for Q2. Team members should share their availability.\n- Summary of document: AI trends in 2024 include increased adoption of large language models, improved multimodal AI capabilities, and focus on AI safety and alignment."
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- LLM API key (optional for production)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/firasghr/included-mvp.git
cd included-mvp
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
PORT=3000
```

4. Create Supabase tables:

**For new installations**, run this SQL in your Supabase SQL editor:

```sql
-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  input TEXT NOT NULL,
  output TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create summaries table
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notification_events table
CREATE TABLE notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_client_status ON tasks(client_id, status);
CREATE INDEX idx_summaries_task_id ON summaries(task_id);
CREATE INDEX idx_summaries_client_id ON summaries(client_id);
CREATE INDEX idx_notification_events_client_id ON notification_events(client_id);
CREATE INDEX idx_notification_events_status ON notification_events(status);
CREATE INDEX idx_notification_events_summary_id ON notification_events(summary_id);
```

**For existing installations** with data, see the migration guide:
```bash
cat database/migrations/001_create_clients_table.sql
# Also see MULTI_CLIENT_ARCHITECTURE.md for detailed migration steps
```

### Running the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

## Email Notification System

The email notification system provides robust email sending capabilities with the following features:

### Features
- ✅ **Batch Processing**: Process notifications in configurable batches (default: 10-20 emails)
- ✅ **Retry Logic**: Exponential backoff for failed email sends (3 retries with increasing delays)
- ✅ **Multi-Client Isolation**: Each notification is tied to a specific client_id
- ✅ **Status Tracking**: Automatic status updates (pending → sent/failed)
- ✅ **Comprehensive Logging**: Detailed logs for monitoring and debugging
- ✅ **Resend Integration**: Uses Resend API for reliable email delivery

### Usage

#### Manual Processing
Process pending email notifications once:

```typescript
import { processPendingEmails } from './workers/emailWorker';

// Process up to 10 pending emails
const stats = await processPendingEmails(10);
console.log(stats); // { processed: 10, successful: 9, failed: 1 }
```

#### Continuous Mode
Run the email worker continuously with automatic polling:

```typescript
import { startEmailWorker } from './workers/emailWorker';

// Process 10 emails every 60 seconds
await startEmailWorker(10, 60000);
```

#### Run from Command Line
```bash
# Process emails once
npx ts-node workers/emailWorker.ts

# Or use the compiled version
node dist/workers/emailWorker.js
```

### Email Service API

The `EmailService` class provides the following methods:

- `fetchPendingEmails(limit)` - Fetch pending email notifications from Supabase
- `sendEmail(to, subject, html)` - Send an email via Resend API
- `updateStatus(eventId, status, errorMessage?)` - Update notification status
- `handleRetry(fn, maxRetries, baseDelayMs)` - Execute function with exponential backoff
- `processEmailNotification(event)` - Process a single notification end-to-end

### Configuration

Add these environment variables to your `.env` file:

```env
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

Get your Resend API key from [resend.com](https://resend.com).

## Development

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Test
```bash
npm test
```

## Production Deployment

The server is production-ready with:

- ✅ TypeScript for type safety
- ✅ Error handling and logging
- ✅ Input validation
- ✅ Environment variable configuration
- ✅ Health check endpoint
- ✅ Modular architecture
- ✅ Asynchronous task processing

### Recommended Enhancements for Production:

1. **Message Queue**: Integrate Bull or RabbitMQ for background job processing
2. **Rate Limiting**: Add express-rate-limit for API protection
3. **Authentication**: Implement JWT or OAuth for secure endpoints
4. **Monitoring**: Add application monitoring (e.g., Sentry, DataDog)
5. **Logging**: Implement structured logging (e.g., Winston, Pino)
6. **Caching**: Add Redis for caching frequently accessed data
7. **Testing**: Add comprehensive unit and integration tests

## License

MIT
