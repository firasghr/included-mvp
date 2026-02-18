/**
 * Test Setup
 * Configures test environment and global mocks
 */

// Import mocks before anything else
import './__mocks__/supabase.mock';
import './__mocks__/openai.mock';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_KEY = 'test-supabase-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.NODE_ENV = 'test';

// Suppress console output during tests unless debugging
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // Keep error for debugging
    error: console.error,
};
