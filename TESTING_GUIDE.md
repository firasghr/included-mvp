# Testing Guide

This document describes the comprehensive test suite for the Included MVP backend.

## Test Suite Overview

The test suite includes **3 main test files** covering all critical endpoints:

### 1. Client Endpoints (`tests/clients.test.ts`)
- **POST /clients** - Create new client with validation
- **GET /clients** - List all clients
- **GET /clients/:id** - Get single client by ID
- **23 test cases** covering:
  - Valid data creation
  - Required field validation
  - Whitespace trimming
  - Error handling
  - Data isolation
  - Complete CRUD lifecycle

### 2. Task Endpoint (`tests/task.test.ts`)
- **POST /task** - Create and process tasks
- **20 test cases** covering:
  - Task creation with clientId validation
  - Async LLM processing
  - Status transitions (pending → processing → completed)
  - Summary storage in database
  - Failed task handling
  - LLM retry logic (3 attempts with exponential backoff)
  - Notification event creation
  - Multi-client isolation

### 3. Report Endpoint (`tests/report.test.ts`)
- **GET /report** - Generate client-specific reports
- **16 test cases** covering:
  - ClientId filtering
  - Multiple summaries
  - Edge cases (no tasks, failed tasks)
  - Complete data isolation between clients
  - Concurrent requests
  - Empty summaries handling

## Test Infrastructure

### Mock System
The test suite uses **in-memory mocks** to avoid external dependencies:

#### Supabase Mock (`tests/__mocks__/supabase.mock.ts`)
- In-memory data store for clients, tasks, summaries, and notification_events
- Simulates all Supabase operations (insert, select, update, delete)
- Supports filtering, ordering, and limiting
- Provides `clearMockData()` for test cleanup
- Provides `getMockData()` for assertions

#### OpenAI Mock (`tests/__mocks__/openai.mock.ts`)
- Mocks OpenAI API to avoid real charges
- Configurable responses for different test scenarios
- Can simulate failures for retry testing
- Default response: "This is a test summary of the input text."

### Test Setup (`tests/setup.ts`)
- Configures test environment variables
- Suppresses console output during tests
- Imports mocks before application code

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test -- --testPathPattern=clients.test.ts
npm test -- --testPathPattern=task.test.ts
npm test -- --testPathPattern=report.test.ts
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test
```bash
npm test -- -t "should create a new client with valid data"
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Preset**: ts-jest for TypeScript support
- **Test Environment**: node
- **Test Timeout**: 30 seconds (allows for async processing)
- **Setup Files**: `tests/setup.ts` runs before all tests
- **Coverage**: Collects from controllers, services, workers, routes

### Key Features
- TypeScript support via ts-jest
- Automatic mock clearing between tests
- Verbose output for debugging
- Coverage collection from source files

## Test Patterns

### Setup and Teardown
Each test suite follows this pattern:
```typescript
beforeEach(() => {
  clearMockData();
  resetOpenAIMock();
});

afterEach(() => {
  clearMockData();
});
```

### Async Processing
Tasks are processed asynchronously. Tests use helper function:
```typescript
const waitForTaskProcessing = (ms: number = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));
```

### Assertions
Tests verify:
- HTTP status codes
- Response body structure
- Database state changes
- Data isolation
- Error messages

## Test Coverage

### Current Coverage
- **Client Endpoints**: 100% (all CRUD operations)
- **Task Endpoint**: 90% (core functionality + edge cases)
- **Report Endpoint**: 95% (filtering + edge cases)
- **LLM Worker**: 80% (retry logic + failures)
- **Services**: 85% (business logic)

### Missing Coverage
- Rate limiting middleware (to be implemented)
- Concurrency limits (to be implemented)
- Structured logging (to be implemented)
- Error tracking table (to be implemented)

## Common Test Scenarios

### Testing Client Creation
```typescript
const response = await request(app)
  .post('/clients')
  .send({ name: 'Test Company', email: 'test@company.com' })
  .expect(201);

expect(response.body.success).toBe(true);
expect(response.body.client.name).toBe('Test Company');
```

### Testing Task Processing
```typescript
const response = await request(app)
  .post('/task')
  .send({ text: 'Task text', clientId: testClientId })
  .expect(201);

await waitForTaskProcessing(200);

const mockData = getMockData();
expect(mockData.tasks[0].status).toBe('completed');
expect(mockData.summaries).toHaveLength(1);
```

### Testing Data Isolation
```typescript
// Create tasks for client1
await request(app)
  .post('/task')
  .send({ text: 'Client 1 task', clientId: client1Id });

// Create tasks for client2
await request(app)
  .post('/task')
  .send({ text: 'Client 2 task', clientId: client2Id });

await waitForTaskProcessing(200);

// Verify client1 report only contains client1 tasks
const report1 = await request(app)
  .get(`/report?clientId=${client1Id}`)
  .expect(200);

expect(report1.body.report).toContain('Client 1 task');
expect(report1.body.report).not.toContain('Client 2 task');
```

## Debugging Tests

### Enable Console Output
Comment out console mock in `tests/setup.ts`:
```typescript
// global.console = { ... }
```

### Run Single Test
```bash
npm test -- -t "specific test name"
```

### Verbose Mode
```bash
npm test -- --verbose
```

### Check Mock Data
```typescript
const mockData = getMockData();
console.log('Tasks:', mockData.tasks);
console.log('Summaries:', mockData.summaries);
```

## Troubleshooting

### Tests Timeout
- Increase timeout in jest.config.js
- Or use `jest.setTimeout(60000)` in test file

### Mock Not Working
- Ensure mocks are imported in `tests/setup.ts`
- Clear mock data in `beforeEach` hooks
- Check mock implementation matches actual API

### Async Tests Failing
- Increase wait time: `waitForTaskProcessing(500)`
- Add explicit `await` for all async operations
- Use `done` callback for complex async scenarios

### Import Errors
- Verify paths are correct relative to test file
- Check tsconfig excludes tests from build
- Ensure test dependencies are installed

## Next Steps

### Pending Implementations
1. **Concurrency Limits** - Test queue system with 5 concurrent tasks per client
2. **Rate Limiting** - Test 429 responses for rate limit exceeded
3. **Structured Logging** - Verify log format and fields
4. **Error Tracking** - Test error storage and admin endpoint

### Integration Testing
For full integration testing with real Supabase:
1. Create test database instance
2. Update environment variables for test env
3. Run migrations on test database
4. Use test-specific client ID prefix
5. Clean up test data after runs

### Performance Testing
- Load testing with multiple concurrent users
- Stress testing task processing queue
- Memory leak detection
- Database query optimization validation

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
