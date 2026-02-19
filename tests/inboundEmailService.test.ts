/**
 * Inbound Email Service Test Suite
 */

import { clearMockData, getMockData } from './__mocks__/supabase.mock';

// Mock taskService to prevent async LLM pipeline from running during tests
jest.mock('../services/taskService', () => ({
  __esModule: true,
  default: {
    createTask: jest.fn().mockResolvedValue({ id: 'mock-task-id' }),
  },
}));

import { InboundEmailService } from '../services/inboundEmailService';
import taskService from '../services/taskService';

const mockCreateTask = taskService.createTask as jest.MockedFunction<typeof taskService.createTask>;

describe('InboundEmailService', () => {
  let service: InboundEmailService;

  beforeEach(() => {
    clearMockData();
    jest.clearAllMocks();
    service = new InboundEmailService();
  });

  afterEach(() => {
    clearMockData();
  });

  // -------------------------------------------------------------------------
  // processInboundEmail – happy path
  // -------------------------------------------------------------------------
  describe('processInboundEmail – success', () => {
    it('should create an email record and trigger the task pipeline', async () => {
      const mockData = getMockData();
      const clientId = '77fa1cc0-f5b0-459e-9164-a997cef8a3f9';

      mockData.clients.push({
        id: clientId,
        name: 'Test Client',
        email: 'client@example.com',
        inbound_email: `client_${clientId}@included.yourdomain.com`,
        created_at: new Date().toISOString(),
      });

      const payload = {
        from: 'sender@example.com',
        to: `client_${clientId}@included.yourdomain.com`,
        subject: 'Hello there',
        text: 'Plain text body',
        html: '<p>Plain text body</p>',
      };

      const email = await service.processInboundEmail(payload);

      // Email record was returned
      expect(email).toMatchObject({
        client_id: clientId,
        sender: 'sender@example.com',
        subject: 'Hello there',
        body: 'Plain text body',
        status: 'pending',
        source: 'inbound',
      });
      expect(email.id).toBeDefined();

      // Email persisted in mock DB
      expect(mockData.emails).toHaveLength(1);
      expect(mockData.emails[0].client_id).toBe(clientId);

      // Task pipeline was triggered
      expect(mockCreateTask).toHaveBeenCalledTimes(1);
      const [taskInput, taskClientId] = mockCreateTask.mock.calls[0];
      expect(taskClientId).toBe(clientId);
      expect(taskInput).toContain('sender@example.com');
      expect(taskInput).toContain('Hello there');
      expect(taskInput).toContain('Plain text body');
    });

    it('should work without an optional html field', async () => {
      const mockData = getMockData();
      const clientId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

      mockData.clients.push({
        id: clientId,
        name: 'No HTML Client',
        created_at: new Date().toISOString(),
      });

      const email = await service.processInboundEmail({
        from: 'a@b.com',
        to: `client_${clientId}@included.yourdomain.com`,
        subject: 'No HTML',
        text: 'Just text',
      });

      expect(email.body).toBe('Just text');
      expect(mockCreateTask).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // processInboundEmail – client ID extraction errors
  // -------------------------------------------------------------------------
  describe('processInboundEmail – invalid "to" address', () => {
    it('should throw when the "to" address has no client_ prefix', async () => {
      await expect(
        service.processInboundEmail({
          from: 'a@b.com',
          to: 'unknown@included.yourdomain.com',
          subject: 'Test',
          text: 'Body',
        })
      ).rejects.toThrow('Could not extract client ID from address');
    });

    it('should throw when the UUID part is malformed', async () => {
      await expect(
        service.processInboundEmail({
          from: 'a@b.com',
          to: 'client_not-a-uuid@included.yourdomain.com',
          subject: 'Test',
          text: 'Body',
        })
      ).rejects.toThrow('Could not extract client ID from address');
    });
  });

  // -------------------------------------------------------------------------
  // processInboundEmail – client validation errors
  // -------------------------------------------------------------------------
  describe('processInboundEmail – client not found', () => {
    it('should throw when no matching client exists in the DB', async () => {
      await expect(
        service.processInboundEmail({
          from: 'a@b.com',
          to: 'client_77fa1cc0-f5b0-459e-9164-a997cef8a3f9@included.yourdomain.com',
          subject: 'Test',
          text: 'Body',
        })
      ).rejects.toThrow('Client not found: 77fa1cc0-f5b0-459e-9164-a997cef8a3f9');
    });
  });

  // -------------------------------------------------------------------------
  // pipeline failure does not bubble up
  // -------------------------------------------------------------------------
  describe('pipeline failure handling', () => {
    it('should still return the email record when the task pipeline rejects', async () => {
      const mockData = getMockData();
      const clientId = '11111111-2222-3333-4444-555555555555';

      mockData.clients.push({
        id: clientId,
        name: 'Pipeline Fail Client',
        created_at: new Date().toISOString(),
      });

      mockCreateTask.mockRejectedValueOnce(new Error('LLM unavailable'));

      const email = await service.processInboundEmail({
        from: 'x@y.com',
        to: `client_${clientId}@included.yourdomain.com`,
        subject: 'Pipeline fail',
        text: 'Body text',
      });

      // Email record still created
      expect(email.status).toBe('pending');
      expect(mockData.emails).toHaveLength(1);
    });
  });
});
