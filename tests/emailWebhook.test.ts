/**
 * Email Webhook Test Suite
 * Tests for email webhook endpoint
 */

import request from 'supertest';
import app from '../orchestrator/index';
import { clearMockData } from './__mocks__/supabase.mock';
import emailSyncService from '../services/emailSyncService';

// Mock emailSyncService
jest.mock('../services/emailSyncService', () => ({
  __esModule: true,
  default: {
    processIncomingEmail: jest.fn(),
  },
}));

describe('Email Webhook Endpoint', () => {
  const mockProcessIncomingEmail = emailSyncService.processIncomingEmail as jest.MockedFunction<
    typeof emailSyncService.processIncomingEmail
  >;

  beforeEach(() => {
    clearMockData();
    jest.clearAllMocks();
  });

  afterEach(() => {
    clearMockData();
  });

  describe('POST /email-webhook', () => {
    it('should successfully process valid email payload', async () => {
      const emailPayload = {
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: 'Test Email Subject',
        body: 'This is the email body content',
        attachments: ['file1.pdf', 'file2.jpg'],
      };

      mockProcessIncomingEmail.mockResolvedValue('task-456');

      const response = await request(app)
        .post('/email-webhook')
        .send(emailPayload)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Email processed successfully');
      expect(response.body).toHaveProperty('taskId', 'task-456');

      expect(mockProcessIncomingEmail).toHaveBeenCalledTimes(1);
      expect(mockProcessIncomingEmail).toHaveBeenCalledWith({
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: 'Test Email Subject',
        body: 'This is the email body content',
        attachments: ['file1.pdf', 'file2.jpg'],
      });
    });

    it('should process email without attachments', async () => {
      const emailPayload = {
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: 'Test Email',
        body: 'Email body',
      };

      mockProcessIncomingEmail.mockResolvedValue('task-789');

      const response = await request(app)
        .post('/email-webhook')
        .send(emailPayload)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('taskId', 'task-789');

      expect(mockProcessIncomingEmail).toHaveBeenCalledWith({
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: 'Test Email',
        body: 'Email body',
        attachments: [],
      });
    });

    it('should return 400 if clientId is missing', async () => {
      const emailPayload = {
        sender: 'test@example.com',
        subject: 'Test Email',
        body: 'Email body',
      };

      const response = await request(app)
        .post('/email-webhook')
        .send(emailPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid payload');
      expect(response.body.message).toContain('clientId');
      expect(mockProcessIncomingEmail).not.toHaveBeenCalled();
    });

    it('should return 400 if clientId is empty string', async () => {
      const emailPayload = {
        clientId: '',
        sender: 'test@example.com',
        subject: 'Test Email',
        body: 'Email body',
      };

      const response = await request(app)
        .post('/email-webhook')
        .send(emailPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid payload');
      expect(response.body.message).toContain('clientId');
      expect(mockProcessIncomingEmail).not.toHaveBeenCalled();
    });

    it('should return 400 if sender is missing', async () => {
      const emailPayload = {
        clientId: 'client-123',
        subject: 'Test Email',
        body: 'Email body',
      };

      const response = await request(app)
        .post('/email-webhook')
        .send(emailPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid payload');
      expect(response.body.message).toContain('sender');
      expect(mockProcessIncomingEmail).not.toHaveBeenCalled();
    });

    it('should return 400 if sender is empty string', async () => {
      const emailPayload = {
        clientId: 'client-123',
        sender: '',
        subject: 'Test Email',
        body: 'Email body',
      };

      const response = await request(app)
        .post('/email-webhook')
        .send(emailPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid payload');
      expect(response.body.message).toContain('sender');
      expect(mockProcessIncomingEmail).not.toHaveBeenCalled();
    });

    it('should return 400 if subject is missing', async () => {
      const emailPayload = {
        clientId: 'client-123',
        sender: 'test@example.com',
        body: 'Email body',
      };

      const response = await request(app)
        .post('/email-webhook')
        .send(emailPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid payload');
      expect(response.body.message).toContain('subject');
      expect(mockProcessIncomingEmail).not.toHaveBeenCalled();
    });

    it('should return 400 if body is missing', async () => {
      const emailPayload = {
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: 'Test Email',
      };

      const response = await request(app)
        .post('/email-webhook')
        .send(emailPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid payload');
      expect(response.body.message).toContain('body');
      expect(mockProcessIncomingEmail).not.toHaveBeenCalled();
    });

    it('should return 400 if body is empty string', async () => {
      const emailPayload = {
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: 'Test Email',
        body: '',
      };

      const response = await request(app)
        .post('/email-webhook')
        .send(emailPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid payload');
      expect(response.body.message).toContain('body');
      expect(mockProcessIncomingEmail).not.toHaveBeenCalled();
    });

    it('should return 400 if attachments is not an array', async () => {
      const emailPayload = {
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: 'Test Email',
        body: 'Email body',
        attachments: 'invalid-not-array',
      };

      const response = await request(app)
        .post('/email-webhook')
        .send(emailPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid payload');
      expect(response.body.message).toContain('attachments');
      expect(mockProcessIncomingEmail).not.toHaveBeenCalled();
    });

    it('should return 500 if processIncomingEmail returns null', async () => {
      const emailPayload = {
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: 'Test Email',
        body: 'Email body',
      };

      mockProcessIncomingEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/email-webhook')
        .send(emailPayload)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Processing failed');
      expect(response.body.message).toContain('Failed to create task');
      expect(mockProcessIncomingEmail).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if processIncomingEmail throws error', async () => {
      const emailPayload = {
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: 'Test Email',
        body: 'Email body',
      };

      mockProcessIncomingEmail.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/email-webhook')
        .send(emailPayload)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body.message).toContain('Database error');
      expect(mockProcessIncomingEmail).toHaveBeenCalledTimes(1);
    });

    it('should trim whitespace from clientId, sender, subject, and body', async () => {
      const emailPayload = {
        clientId: '  client-123  ',
        sender: '  test@example.com  ',
        subject: '  Test Email  ',
        body: '  Email body  ',
      };

      mockProcessIncomingEmail.mockResolvedValue('task-999');

      const response = await request(app)
        .post('/email-webhook')
        .send(emailPayload)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(mockProcessIncomingEmail).toHaveBeenCalledWith({
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: 'Test Email',
        body: 'Email body',
        attachments: [],
      });
    });
  });
});
