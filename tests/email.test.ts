/**
 * Email Service Test Suite
 * Tests for the email notification service
 */

import { clearMockData, getMockData } from './__mocks__/supabase.mock';

// Mock Resend before importing emailService
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: jest.fn().mockResolvedValue({
            data: { id: 'mock-email-id-123' },
            error: null,
          }),
        },
      };
    }),
  };
});

// Import after mocking
import { EmailService } from '../services/emailService';

describe('Email Service', () => {
  let emailService: EmailService;

  beforeEach(() => {
    clearMockData();
    // Set environment variables for testing
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.FROM_EMAIL = 'test@example.com';
    
    // Create a new instance for each test
    emailService = new EmailService();
  });

  afterEach(() => {
    clearMockData();
    jest.clearAllMocks();
  });

  describe('fetchPendingEmails', () => {
    it('should fetch pending email notifications', async () => {
      // Add test data
      const mockData = getMockData();
      mockData.notification_events.push({
        id: 'notif-1',
        client_id: 'client-1',
        summary_id: 'summary-1',
        type: 'email',
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      mockData.notification_events.push({
        id: 'notif-2',
        client_id: 'client-2',
        summary_id: 'summary-2',
        type: 'email',
        status: 'sent',
        created_at: new Date().toISOString(),
      });
      mockData.notification_events.push({
        id: 'notif-3',
        client_id: 'client-3',
        summary_id: 'summary-3',
        type: 'whatsapp',
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      const result = await emailService.fetchPendingEmails(10);

      // Should only return pending email notifications (not whatsapp or sent)
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('notif-1');
      expect(result[0].type).toBe('email');
      expect(result[0].status).toBe('pending');
    });

    it('should respect the limit parameter', async () => {
      const mockData = getMockData();
      
      // Add multiple pending emails
      for (let i = 0; i < 15; i++) {
        mockData.notification_events.push({
          id: `notif-${i}`,
          client_id: `client-${i}`,
          summary_id: `summary-${i}`,
          type: 'email',
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      }

      const result = await emailService.fetchPendingEmails(5);

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array when no pending emails', async () => {
      const result = await emailService.fetchPendingEmails(10);
      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update notification status to sent', async () => {
      const mockData = getMockData();
      mockData.notification_events.push({
        id: 'notif-1',
        client_id: 'client-1',
        summary_id: 'summary-1',
        type: 'email',
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      await emailService.updateStatus('notif-1', 'sent');

      const updated = mockData.notification_events.find(n => n.id === 'notif-1');
      expect(updated?.status).toBe('sent');
    });

    it('should update notification status to failed', async () => {
      const mockData = getMockData();
      mockData.notification_events.push({
        id: 'notif-1',
        client_id: 'client-1',
        summary_id: 'summary-1',
        type: 'email',
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      await emailService.updateStatus('notif-1', 'failed', 'Test error');

      const updated = mockData.notification_events.find(n => n.id === 'notif-1');
      expect(updated?.status).toBe('failed');
    });
  });

  describe('handleRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await emailService.handleRetry(mockFn, 3, 100);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const mockFn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve('success');
      });

      const result = await emailService.handleRetry(mockFn, 3, 100);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Permanent failure'));

      await expect(
        emailService.handleRetry(mockFn, 3, 100)
      ).rejects.toThrow('Permanent failure');

      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('getClientEmailForSummary', () => {
    it('should return client email for a valid summary', async () => {
      const mockData = getMockData();
      
      // Add test client
      mockData.clients.push({
        id: 'client-1',
        name: 'Test Client',
        email: 'client@example.com',
        created_at: new Date().toISOString(),
      });

      // Add test summary
      mockData.summaries.push({
        id: 'summary-1',
        client_id: 'client-1',
        task_id: 'task-1',
        summary: 'Test summary',
        created_at: new Date().toISOString(),
      });

      const email = await emailService.getClientEmailForSummary('summary-1');
      expect(email).toBe('client@example.com');
    });

    it('should return null for non-existent summary', async () => {
      const email = await emailService.getClientEmailForSummary('non-existent');
      expect(email).toBeNull();
    });

    it('should return null when client has no email', async () => {
      const mockData = getMockData();
      
      // Add test client without email
      mockData.clients.push({
        id: 'client-1',
        name: 'Test Client',
        created_at: new Date().toISOString(),
      });

      // Add test summary
      mockData.summaries.push({
        id: 'summary-1',
        client_id: 'client-1',
        task_id: 'task-1',
        summary: 'Test summary',
        created_at: new Date().toISOString(),
      });

      const email = await emailService.getClientEmailForSummary('summary-1');
      expect(email).toBeNull();
    });
  });

  describe('getSummaryContent', () => {
    it('should return summary content and client name', async () => {
      const mockData = getMockData();
      
      // Add test client
      mockData.clients.push({
        id: 'client-1',
        name: 'Test Client',
        email: 'client@example.com',
        created_at: new Date().toISOString(),
      });

      // Add test summary
      mockData.summaries.push({
        id: 'summary-1',
        client_id: 'client-1',
        task_id: 'task-1',
        summary: 'This is a test summary',
        created_at: new Date().toISOString(),
      });

      const content = await emailService.getSummaryContent('summary-1');
      
      expect(content).not.toBeNull();
      expect(content?.summary).toBe('This is a test summary');
      expect(content?.clientName).toBe('Test Client');
    });

    it('should return null for non-existent summary', async () => {
      const content = await emailService.getSummaryContent('non-existent');
      expect(content).toBeNull();
    });
  });
});
