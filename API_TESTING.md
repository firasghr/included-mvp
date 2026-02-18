# API Testing Guide

This document provides sample curl commands to test the API endpoints.

## Prerequisites

Make sure the server is running:
```bash
npm run dev
# or
npm start
```

## 1. POST /task - Create and Process a Task

### Command:
```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Please summarize this email: Hello team, we need to schedule a meeting next week to discuss Q1 results and plan for Q2. Let me know your availability."
  }'
```

### Expected Output:
```json
{
  "success": true,
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "message": "Task created and processing started"
}
```

### Alternative Test - Simple Input:
```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{"text": "Summarize this document about AI trends in 2024"}'
```

### Error Case - Missing Text:
```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected Output:
```json
{
  "error": "Invalid request",
  "message": "Request body must contain a non-empty \"text\" field"
}
```

## 2. GET /report - Generate Daily Report

### Command:
```bash
curl http://localhost:3000/report
```

### Expected Output:
```
Daily Report:
- Summary of email: The team needs to schedule a meeting next week to discuss Q1 results and plan for Q2. Team members should share their availability.
- Summary of document: AI trends in 2024 include increased adoption of large language models, improved multimodal AI capabilities, and focus on AI safety and alignment.
```

### Alternative Output (No Completed Tasks):
```
Daily Report:
- No completed tasks found.
```

## 3. GET /health - Health Check

### Command:
```bash
curl http://localhost:3000/health
```

### Expected Output:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Testing Workflow

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Check health:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Create a task:**
   ```bash
   curl -X POST http://localhost:3000/task \
     -H "Content-Type: application/json" \
     -d '{"text": "Test input for processing"}'
   ```

4. **Wait a few seconds for processing, then generate report:**
   ```bash
   curl http://localhost:3000/report
   ```

## Using jq for Pretty Output

For better formatted JSON output, pipe to `jq`:

```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{"text": "Test"}' | jq .
```

```bash
curl http://localhost:3000/health | jq .
```

## Testing with Different Scenarios

### Long Document Summarization:
```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a long business document discussing company performance, market trends, competitive analysis, and strategic recommendations for the upcoming quarter. Include details about revenue growth, customer acquisition, and operational efficiency."
  }' | jq .
```

### Email Thread Summarization:
```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Email Thread:\nFrom: John\nSubject: Project Update\n\nHi team, the project is on track. We completed phase 1 and are moving to phase 2.\n\nFrom: Sarah\nGreat! When is the deadline?\n\nFrom: John\nMarch 15th."
  }' | jq .
```

## Error Handling Tests

### Test with empty string:
```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{"text": ""}' | jq .
```

### Test with invalid JSON:
```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

### Test 404 endpoint:
```bash
curl http://localhost:3000/nonexistent | jq .
```

Expected Output:
```json
{
  "error": "Not found",
  "message": "Route GET /nonexistent not found"
}
```
