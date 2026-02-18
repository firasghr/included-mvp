# Included MVP

Private AI assistant for SMBs to automate emails, documents, CRM updates, and reporting. Production-ready MVP.

## Features

- **Task Processing**: Automated LLM-powered task processing with database persistence
- **Daily Reporting**: Automated generation of daily task reports
- **Production-Ready**: Built with TypeScript, Express, and Supabase for scalability

## Architecture

```
database/
└── supabase.ts          # Supabase client with lazy initialization

orchestrator/
└── index.ts             # Main Express server

workers/
├── llmWorker.ts         # OpenAI GPT-4o-mini LLM processing worker
└── automationWorker.ts  # Automation and reporting worker

types/
└── task.ts              # TypeScript type definitions
```

## API Endpoints

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
  "status": "processing",
  "message": "Task created and processing started"
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
```
Daily Report:
- Summary of email: The team needs to schedule a meeting next week to discuss Q1 results and plan for Q2. Team members should share their availability.
- Summary of document: AI trends in 2024 include increased adoption of large language models, improved multimodal AI capabilities, and focus on AI safety and alignment.
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  input TEXT NOT NULL,
  output TEXT,
  status TEXT NOT NULL CHECK (status IN ('processing', 'done', 'failed')),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_client_status ON tasks(client_id, status);
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
