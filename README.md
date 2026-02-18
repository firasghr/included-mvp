# Included MVP

Private AI assistant for SMBs to automate emails, documents, CRM updates, and reporting. Production-ready MVP.

## Features

- **Task Processing**: Automated LLM-powered task processing with database persistence
- **Daily Reporting**: Automated generation of daily task reports
- **Production-Ready**: Built with TypeScript, Express, and Supabase for scalability

## Architecture

```
orchestrator/
├── index.ts              # Main Express server
├── supabase.ts          # Supabase client and database operations
├── llmWorker.ts         # LLM processing worker
└── automationWorker.ts  # Automation and reporting worker
```

## API Endpoints

### POST /task
Creates and processes a new task with LLM.

**Request:**
```json
{
  "text": "Your input text here"
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
Generates a daily report of all tasks.

**Response:**
```json
{
  "success": true,
  "report": {
    "date": "2024-01-01",
    "totalTasks": 10,
    "completedTasks": 8,
    "failedTasks": 1,
    "pendingTasks": 1,
    "successRate": 80,
    "summary": "Daily Report: 10 total tasks. 8 completed (80.0% success rate). 1 failed. 1 pending/processing."
  }
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
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
LLM_API_KEY=your_llm_api_key
LLM_MODEL=gpt-4
```

4. Create Supabase table:
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  input_text TEXT NOT NULL,
  output_text TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
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
