# Test Suite

Comprehensive test suite for the Included MVP backend with 59+ test cases.

## Quick Start

```bash
# Run all tests
npm test

# Run specific suite
npm test -- --testPathPattern=clients.test.ts
npm test -- --testPathPattern=task.test.ts
npm test -- --testPathPattern=report.test.ts

# Run with coverage
npm test -- --coverage
```

## Test Suites

- **clients.test.ts** - 23 tests for client CRUD operations
- **task.test.ts** - 20 tests for task processing with LLM
- **report.test.ts** - 16 tests for report generation

## Key Features

✅ In-memory mocks for Supabase and OpenAI
✅ No external dependencies required
✅ Fast execution (~5-10 seconds)
✅ Comprehensive coverage of all endpoints
✅ Tests for data isolation between clients
✅ LLM retry logic verification
✅ Async task processing validation

## Documentation

See **[TESTING_GUIDE.md](../TESTING_GUIDE.md)** for comprehensive testing documentation including:
- Detailed test descriptions
- Mock system architecture
- Debugging guide
- Troubleshooting
- Integration testing recommendations

## Test Structure

```
tests/
├── __mocks__/
│   ├── supabase.mock.ts    # In-memory Supabase mock
│   └── openai.mock.ts      # OpenAI API mock
├── setup.ts                # Global test setup
├── clients.test.ts         # Client endpoint tests
├── task.test.ts            # Task endpoint tests
└── report.test.ts          # Report endpoint tests
```

## Notes

- Tests use mocked data - no real API calls
- Each test suite is independent
- Mock data is cleared between tests
- TypeScript errors in tests don't affect build
