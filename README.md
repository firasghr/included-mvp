# Included — AI Assistant for SMBs

**Included** is a production-ready, multi-client AI assistant platform that automates email processing, document summarization, and client notifications for small and medium-sized businesses.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
  - [Running the Dashboard](#running-the-dashboard)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
  - [Health](#health)
  - [Clients](#clients)
  - [Tasks](#tasks)
  - [Summaries](#summaries)
  - [Notifications](#notifications)
  - [Reports](#reports)
  - [Email Webhooks](#email-webhooks)
- [Client Onboarding](#client-onboarding)
- [Email Flow](#email-flow)
- [Background Workers](#background-workers)
- [Dashboard](#dashboard)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Overview

Each client in the Included platform gets a unique **forwarding email address** (`client_<uuid>@yourdomain.com`). When a client forwards an email to that address, the system:

1. Receives the inbound email via a Resend webhook
2. Routes it to the correct client by parsing the address
3. Creates a **task** for processing
4. Sends the task through an **LLM worker** (GPT-4o Mini) to generate a 1–2 sentence summary
5. Stores the summary and creates **notification events**
6. The **email worker** picks up pending email notifications and delivers them via Resend

All of this is visible in the **React dashboard** in real time.

---

## Features

| Feature | Status |
|---|---|
| Multi-client isolation (UUID-based) | ✅ Live |
| Client onboarding form (dashboard) | ✅ Live |
| Unique inbound email per client | ✅ Live |
| Inbound email → task pipeline (Resend webhook) | ✅ Live |
| LLM summarization (GPT-4o Mini, retry logic) | ✅ Live |
| Email notifications (Resend, batch worker) | ✅ Live |
| Dashboard: clients, notifications, logs, reports | ✅ Live |
| WhatsApp notifications | 🔒 Planned |
| Multi-Mac orchestration | 🔒 Planned |
| Historical trend charts | 🔒 Planned |
| Live log streaming | 🔒 Planned |

---

## Architecture

```
Client email → Resend inbound webhook
                   │
                   ▼
         inboundEmailService
         (extract client ID,
          store email record)
                   │
                   ▼
            taskService
       (create task, async LLM)
                   │
                   ▼
            llmWorker
        (GPT-4o Mini, retry)
                   │
                   ▼
          summaryService
      (store summary, fire
       notification events)
                   │
                   ▼
         emailWorker (polling)
      (fetch pending notifs,
       send via Resend, update
       status to sent/failed)
```

---

## Project Structure

```
included-mvp/
├── orchestrator/
│   └── index.ts              # Express server entry point, starts workers
│
├── controllers/              # HTTP request handlers
│   ├── clientController.ts
│   ├── taskController.ts
│   ├── summaryController.ts
│   ├── notificationController.ts
│   └── reportController.ts
│
├── routes/                   # Express route definitions
│   ├── clientRoutes.ts
│   ├── taskRoutes.ts
│   ├── summaryRoutes.ts
│   ├── notificationRoutes.ts
│   ├── reportRoutes.ts
│   ├── emailWebhook.ts
│   └── inboundEmailRoutes.ts
│
├── services/                 # Business logic
│   ├── clientService.ts      # Client CRUD, inbound email generation
│   ├── taskService.ts        # Task lifecycle (pending→processing→completed)
│   ├── summaryService.ts     # LLM summary storage
│   ├── notificationService.ts # Notification event management
│   ├── emailService.ts       # Resend API integration, retry logic
│   ├── emailSyncService.ts   # Webhook → task conversion
│   ├── inboundEmailService.ts # Resend inbound webhook handler
│   └── reportService.ts      # Daily report generation
│
├── workers/
│   ├── emailWorker.ts        # Polls and sends pending email notifications
│   ├── automationWorker.ts   # Recovery worker for stuck pending tasks
│   └── llmWorker.ts          # OpenAI GPT-4o Mini wrapper with retry
│
├── lib/
│   └── middleware.ts         # Request logging, 404, error handlers
│
├── database/
│   ├── supabase.ts           # Supabase client singleton
│   └── migrations/
│       ├── 001_create_clients_table.sql
│       └── 002_add_phone_and_workflow_settings_to_clients.sql
│
├── types/
│   └── task.ts               # Shared TypeScript interfaces
│
├── tests/                    # Jest test suites (107 tests)
│   ├── __mocks__/
│   │   ├── supabase.mock.ts
│   │   └── openai.mock.ts
│   ├── setup.ts
│   ├── clients.test.ts
│   ├── task.test.ts
│   ├── email.test.ts
│   ├── emailWebhook.test.ts
│   ├── emailSyncService.test.ts
│   ├── inboundEmailService.test.ts
│   ├── inboundEmailRoutes.test.ts
│   └── report.test.ts
│
└── dashboard/                # React + Vite frontend
    └── src/
        ├── App.tsx
        ├── api/client.ts     # Typed API calls to backend
        ├── types.ts          # Frontend TypeScript interfaces
        ├── pages/
        │   ├── DashboardPage.tsx
        │   ├── ClientsPage.tsx
        │   ├── NotificationsPage.tsx
        │   ├── LogsPage.tsx
        │   └── SettingsPage.tsx
        └── components/
            ├── layout/       # Layout, Header, Sidebar
            └── ui/           # Button, Card, Badge, Modal, etc.
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (20 recommended)
- **npm** 9+
- A **Supabase** project (free tier works)
- An **OpenAI** API key
- A **Resend** account with a verified domain

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase `anon` (or `service_role`) key |
| `OPENAI_API_KEY` | OpenAI API key |
| `RESEND_API_KEY` | Resend API key |
| `FROM_EMAIL` | Verified sender email (e.g. `noreply@yourdomain.com`) |
| `INBOUND_EMAIL_DOMAIN` | Domain for client inbound addresses (e.g. `mail.yourdomain.com`) |
| `DASHBOARD_ORIGIN` | Dashboard URL for CORS (default: `http://localhost:5173`) |
| `PORT` | Server port (default: `3000`) |

### Running Locally

```bash
# Install dependencies
npm install

# Start the API server with ts-node (hot reload)
npm run dev
```

The server starts on `http://localhost:3000`. It also automatically:
- Starts the **email worker** (polls every 10 s)
- Starts the **automation worker** as a recovery mechanism (runs every 60 s)

### Running the Dashboard

```bash
cd dashboard
npm install
npm run dev
```

The dashboard starts on `http://localhost:5173` and proxies `/api/*` calls to `http://localhost:3000`.

---

## Database Setup

Run the migration files in order against your Supabase database using the SQL Editor or `psql`:

```sql
-- Migration 1: Create all core tables
\i database/migrations/001_create_clients_table.sql

-- Migration 2: Add phone, workflow_settings, inbound_email to clients
\i database/migrations/002_add_phone_and_workflow_settings_to_clients.sql
```

> **Note:** Migration 001 creates `clients`, `tasks`, `summaries`, and `notification_events` tables. Migration 002 adds the `phone`, `workflow_settings`, and `inbound_email` columns to `clients`.

---

## API Reference

All endpoints return JSON. Error responses follow the shape `{ error: string, message: string }`.

### Health

```
GET /health
```
Returns `{ status: "ok", timestamp: "..." }`.

---

### Clients

#### Create a client
```
POST /clients
Content-Type: application/json

{
  "name": "Jane Smith",          // required
  "email": "jane@example.com",   // optional
  "company": "Acme Corp",        // optional
  "phone": "+1 555 000 0000",    // optional
  "workflow_settings": {         // optional
    "reportFrequency": "daily",  // "daily" | "weekly" | "none"
    "emailNotifications": true,
    "whatsappNotifications": false
  }
}
```

Response `201`:
```json
{
  "success": true,
  "client": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "inbound_email": "client_<uuid>@mail.yourdomain.com",
    "created_at": "..."
  }
}
```

#### List all clients
```
GET /clients
```

#### Get client by ID
```
GET /clients/:id
```

---

### Tasks

#### Create a task (manual)
```
POST /task
Content-Type: application/json

{
  "text": "Email content or document to summarise",
  "clientId": "client-uuid"
}
```

Response `201`:
```json
{ "success": true, "taskId": "uuid", "status": "processing" }
```

The task is processed asynchronously — poll `GET /task` to track status.

#### List recent tasks
```
GET /task?limit=50
```

---

### Summaries

#### List summaries
```
GET /summaries?limit=50
GET /summaries?clientId=<uuid>
```

---

### Notifications

#### List notifications
```
GET /notifications
GET /notifications?status=pending|sent|failed
GET /notifications?clientId=<uuid>
```

---

### Reports

#### Generate daily report
```
GET /report?clientId=<uuid>
```

Returns a formatted plain-text report of all summaries for that client.

---

### Email Webhooks

#### Manual email-to-task webhook
```
POST /email-webhook
Content-Type: application/json

{
  "clientId": "uuid",
  "sender": "sender@example.com",
  "subject": "Meeting notes",
  "body": "Full email body...",
  "attachments": []  // optional
}
```

#### Resend inbound email webhook
Configure Resend to `POST` to:
```
POST /webhooks/resend-inbound
```

The payload must include `from`, `to` (must match `client_<uuid>@domain`), `subject`, and `text`.

---

## Client Onboarding

### Via Dashboard (recommended)

1. Navigate to the **Clients** page
2. Click **+ New Client**
3. Fill in the form: name, email, phone, company, workflow settings
4. Click **Create Client**
5. The modal shows the auto-generated **Client ID (UUID)** and **Forwarding Email**
6. Share the forwarding email with the client — they forward emails to it for AI processing

### Via API

```bash
curl -X POST http://localhost:3000/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "workflow_settings": { "reportFrequency": "daily", "emailNotifications": true, "whatsappNotifications": false }
  }'
```

---

## Email Flow

```
1. Client forwards email to client_<uuid>@mail.yourdomain.com
2. Resend delivers it to POST /webhooks/resend-inbound
3. inboundEmailService extracts the UUID from the To address
4. Validates the client exists in Supabase
5. Stores an email record (status: pending)
6. Fires a task through taskService.createTask (non-blocking)
7. taskService processes the task async:
   a. status → processing
   b. llmWorker generates a 1–2 sentence summary
   c. summaryService stores the summary
   d. notificationService creates email + whatsapp notification events
   e. status → completed
8. emailWorker (polling every 10s) picks up pending email notifications
9. emailService sends the summary email via Resend
10. Notification event status → sent
```

---

## Background Workers

Both workers start automatically with the server:

### Email Worker (`workers/emailWorker.ts`)
- Polls for `pending` email notification events every 10 seconds
- Processes in batches of 10
- Uses exponential back-off retry (3 attempts, up to 10 s delay)
- Updates notification status to `sent` or `failed`

### Automation Worker (`workers/automationWorker.ts`)
- Recovery mechanism — runs every 60 seconds
- Picks up tasks stuck in `pending` state (e.g., after a server restart)
- Processes them through the full LLM → summary → notification pipeline

---

## Dashboard

The React dashboard (`dashboard/`) communicates with the backend API and auto-refreshes every 12 seconds.

| Page | Description |
|---|---|
| **Dashboard** | System health, client count, notification stats, recent notifications |
| **Clients** | Full client list with forwarding email. "+ New Client" button opens onboarding form |
| **Notifications** | All notification events with status filter tabs (All / Pending / Sent / Failed) |
| **Logs** | Recent tasks with status, input preview, and generated output summary |
| **Settings** | Configuration placeholders (inbound email domain, Mac management, alerts, retries) |

### Building the dashboard
```bash
cd dashboard
npm run build
# Output in dashboard/dist/
```

---

## Testing

```bash
# Run all 107 tests
npm test

# Run with coverage
npm test -- --coverage
```

Tests use in-memory Supabase and OpenAI mocks — no real API calls are made.

Test files:
- `tests/clients.test.ts` — Client CRUD endpoints
- `tests/task.test.ts` — Task creation, async LLM processing, notifications
- `tests/email.test.ts` — Email service, retry logic, HTML escaping
- `tests/emailWebhook.test.ts` — Manual email webhook
- `tests/emailSyncService.test.ts` — Email sync service
- `tests/inboundEmailService.test.ts` — Resend inbound webhook service
- `tests/inboundEmailRoutes.test.ts` — Resend inbound webhook route
- `tests/report.test.ts` — Report generation

---

## Deployment

### Mac Mini (recommended for production)

```bash
# Build TypeScript
npm run build

# Start the compiled server
npm start
# → runs dist/orchestrator/index.js
```

Use `pm2` or `launchd` to keep the server running as a daemon:

```bash
# With pm2
npm install -g pm2
pm2 start dist/orchestrator/index.js --name included-api
pm2 save
pm2 startup
```

### Dashboard

```bash
cd dashboard
npm run build
# Serve dashboard/dist/ with nginx, Caddy, or similar
```

Point Nginx at `dashboard/dist/` and proxy `/api/*` to `http://localhost:3000`.

### Environment variables checklist

- [ ] `SUPABASE_URL` and `SUPABASE_KEY` pointing to production database
- [ ] `OPENAI_API_KEY` with sufficient quota
- [ ] `RESEND_API_KEY` with verified sending domain
- [ ] `FROM_EMAIL` set to your verified sender
- [ ] `INBOUND_EMAIL_DOMAIN` set to the domain you've configured in Resend for inbound routing
- [ ] `DASHBOARD_ORIGIN` set to your production dashboard URL
- [ ] Resend inbound webhook configured to `POST /webhooks/resend-inbound`

---

## License

MIT
