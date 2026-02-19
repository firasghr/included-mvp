/**
 * Email Sync Service Test Suite
 * Tests for email synchronization and webhook processing
 */

import { EmailSyncService, EmailData, ClientEmailConfig, EmailMessage } from '../services/emailSyncService';
import taskService from '../services/taskService';

// Mock the taskService
jest.mock('../services/taskService', () => ({
  __esModule: true,
  default: {
    createTask: jest.fn(),
  },
}));

describe('EmailSyncService', () => {
  let emailSyncService: EmailSyncService;
  const mockCreateTask = taskService.createTask as jest.MockedFunction<typeof taskService.createTask>;

  beforeEach(() => {
    emailSyncService = new EmailSyncService();
    jest.clearAllMocks();
  });

  describe('processIncomingEmail', () => {
    it('should successfully create a task from valid email data', async () => {
      const emailData: EmailData = {
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: 'Test Email Subject',
        body: 'This is the email body content',
        attachments: ['file1.pdf', 'file2.jpg'],
      };

      const mockTask = {
        id: 'task-456',
        input: 'Email from: test@example.com\nSubject: Test Email Subject\n\nThis is the email body content\n\nAttachments: file1.pdf, file2.jpg',
        output: null,
        status: 'pending' as const,
        client_id: 'client-123',
        created_at: new Date().toISOString(),
      };

      mockCreateTask.mockResolvedValue(mockTask);

      const result = await emailSyncService.processIncomingEmail(emailData);

      expect(result).toBe('task-456');
      expect(mockCreateTask).toHaveBeenCalledTimes(1);
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.stringContaining('Email from: test@example.com'),
        'client-123'
      );
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.stringContaining('Subject: Test Email Subject'),
        'client-123'
      );
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.stringContaining('This is the email body content'),
        'client-123'
      );
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.stringContaining('Attachments: file1.pdf, file2.jpg'),
        'client-123'
      );
    });

    it('should create task without attachments when not provided', async () => {
      const emailData: EmailData = {
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: 'Test Email',
        body: 'Email body',
      };

      const mockTask = {
        id: 'task-789',
        input: 'Email from: test@example.com\nSubject: Test Email\n\nEmail body',
        output: null,
        status: 'pending' as const,
        client_id: 'client-123',
        created_at: new Date().toISOString(),
      };

      mockCreateTask.mockResolvedValue(mockTask);

      const result = await emailSyncService.processIncomingEmail(emailData);

      expect(result).toBe('task-789');
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.not.stringContaining('Attachments:'),
        'client-123'
      );
    });

    it('should log errors and return null for missing clientId', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const emailData: EmailData = {
        clientId: '',
        sender: 'test@example.com',
        subject: 'Test Email',
        body: 'Email body',
      };

      const result = await emailSyncService.processIncomingEmail(emailData);

      expect(result).toBeNull();
      expect(mockCreateTask).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('missing or invalid clientId')
      );

      consoleSpy.mockRestore();
    });

    it('should log errors and return null for missing sender', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const emailData: EmailData = {
        clientId: 'client-123',
        sender: '',
        subject: 'Test Email',
        body: 'Email body',
      };

      const result = await emailSyncService.processIncomingEmail(emailData);

      expect(result).toBeNull();
      expect(mockCreateTask).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('missing or invalid sender')
      );

      consoleSpy.mockRestore();
    });

    it('should log errors and return null for missing subject', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const emailData: EmailData = {
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: undefined as any,
        body: 'Email body',
      };

      const result = await emailSyncService.processIncomingEmail(emailData);

      expect(result).toBeNull();
      expect(mockCreateTask).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('missing or invalid subject')
      );

      consoleSpy.mockRestore();
    });

    it('should log errors and return null for whitespace-only subject', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const emailData: EmailData = {
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: '   ',
        body: 'Email body',
      };

      const result = await emailSyncService.processIncomingEmail(emailData);

      expect(result).toBeNull();
      expect(mockCreateTask).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('missing or invalid subject')
      );

      consoleSpy.mockRestore();
    });

    it('should log errors and return null for missing body', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const emailData: EmailData = {
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: 'Test Email',
        body: '',
      };

      const result = await emailSyncService.processIncomingEmail(emailData);

      expect(result).toBeNull();
      expect(mockCreateTask).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('missing or invalid body')
      );

      consoleSpy.mockRestore();
    });

    it('should handle task creation errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const emailData: EmailData = {
        clientId: 'client-123',
        sender: 'test@example.com',
        subject: 'Test Email',
        body: 'Email body',
      };

      mockCreateTask.mockRejectedValue(new Error('Database connection failed'));

      const result = await emailSyncService.processIncomingEmail(emailData);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database connection failed')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('pollEmailProvider', () => {
    it('should call processIncomingEmail for each new email', async () => {
      const clientConfig: ClientEmailConfig = {
        clientId: 'client-123',
        emailProvider: 'imap',
        credentials: {
          host: 'imap.example.com',
          port: 993,
          username: 'user@example.com',
          password: 'password123',
        },
      };

      const mockEmails: EmailMessage[] = [
        {
          id: 'email-1',
          from: 'sender1@example.com',
          subject: 'Subject 1',
          body: 'Body 1',
          isRead: false,
        },
        {
          id: 'email-2',
          from: 'sender2@example.com',
          subject: 'Subject 2',
          body: 'Body 2',
          isRead: false,
          attachments: ['file.pdf'],
        },
      ];

      // Mock private methods
      const fetchUnreadEmailsSpy = jest
        .spyOn(emailSyncService as any, 'fetchUnreadEmails')
        .mockResolvedValue(mockEmails);

      const markEmailAsReadSpy = jest
        .spyOn(emailSyncService as any, 'markEmailAsRead')
        .mockResolvedValue(undefined);

      const processIncomingEmailSpy = jest
        .spyOn(emailSyncService, 'processIncomingEmail')
        .mockResolvedValue('task-id');

      const result = await emailSyncService.pollEmailProvider(clientConfig);

      expect(result).toBe(2);
      expect(fetchUnreadEmailsSpy).toHaveBeenCalledWith(clientConfig);
      expect(processIncomingEmailSpy).toHaveBeenCalledTimes(2);
      expect(markEmailAsReadSpy).toHaveBeenCalledTimes(2);
      expect(markEmailAsReadSpy).toHaveBeenCalledWith(clientConfig, 'email-1');
      expect(markEmailAsReadSpy).toHaveBeenCalledWith(clientConfig, 'email-2');

      fetchUnreadEmailsSpy.mockRestore();
      markEmailAsReadSpy.mockRestore();
      processIncomingEmailSpy.mockRestore();
    });

    it('should return 0 when no new emails are found', async () => {
      const clientConfig: ClientEmailConfig = {
        clientId: 'client-123',
        emailProvider: 'gmail',
        credentials: {
          accessToken: 'token123',
        },
      };

      const fetchUnreadEmailsSpy = jest
        .spyOn(emailSyncService as any, 'fetchUnreadEmails')
        .mockResolvedValue([]);

      const processIncomingEmailSpy = jest.spyOn(emailSyncService, 'processIncomingEmail');

      const result = await emailSyncService.pollEmailProvider(clientConfig);

      expect(result).toBe(0);
      expect(fetchUnreadEmailsSpy).toHaveBeenCalledWith(clientConfig);
      expect(processIncomingEmailSpy).not.toHaveBeenCalled();

      fetchUnreadEmailsSpy.mockRestore();
      processIncomingEmailSpy.mockRestore();
    });

    it('should skip marking as read if processIncomingEmail fails', async () => {
      const clientConfig: ClientEmailConfig = {
        clientId: 'client-123',
        emailProvider: 'outlook',
        credentials: {
          accessToken: 'token123',
        },
      };

      const mockEmails: EmailMessage[] = [
        {
          id: 'email-1',
          from: 'sender@example.com',
          subject: 'Subject',
          body: 'Body',
          isRead: false,
        },
      ];

      const fetchUnreadEmailsSpy = jest
        .spyOn(emailSyncService as any, 'fetchUnreadEmails')
        .mockResolvedValue(mockEmails);

      const markEmailAsReadSpy = jest
        .spyOn(emailSyncService as any, 'markEmailAsRead')
        .mockResolvedValue(undefined);

      const processIncomingEmailSpy = jest
        .spyOn(emailSyncService, 'processIncomingEmail')
        .mockResolvedValue(null); // Simulate failure

      const result = await emailSyncService.pollEmailProvider(clientConfig);

      expect(result).toBe(0);
      expect(processIncomingEmailSpy).toHaveBeenCalledTimes(1);
      expect(markEmailAsReadSpy).not.toHaveBeenCalled();

      fetchUnreadEmailsSpy.mockRestore();
      markEmailAsReadSpy.mockRestore();
      processIncomingEmailSpy.mockRestore();
    });

    it('should handle errors and return 0', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const clientConfig: ClientEmailConfig = {
        clientId: 'client-123',
        emailProvider: 'imap',
        credentials: {
          host: 'imap.example.com',
          port: 993,
          username: 'user@example.com',
          password: 'password123',
        },
      };

      const fetchUnreadEmailsSpy = jest
        .spyOn(emailSyncService as any, 'fetchUnreadEmails')
        .mockRejectedValue(new Error('Connection failed'));

      const result = await emailSyncService.pollEmailProvider(clientConfig);

      expect(result).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Connection failed')
      );

      fetchUnreadEmailsSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('startPolling and stopPolling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start polling at specified intervals', async () => {
      const clientConfig: ClientEmailConfig = {
        clientId: 'client-123',
        emailProvider: 'gmail',
        credentials: {
          accessToken: 'token123',
        },
      };

      const pollEmailProviderSpy = jest
        .spyOn(emailSyncService, 'pollEmailProvider')
        .mockResolvedValue(0);

      const intervalId = emailSyncService.startPolling(clientConfig, 1000);

      // Initial call happens immediately
      await Promise.resolve();
      expect(pollEmailProviderSpy).toHaveBeenCalledTimes(1);

      // Fast-forward time
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      expect(pollEmailProviderSpy).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      expect(pollEmailProviderSpy).toHaveBeenCalledTimes(3);

      emailSyncService.stopPolling(intervalId);
      pollEmailProviderSpy.mockRestore();
    });

    it('should stop polling when stopPolling is called', async () => {
      const clientConfig: ClientEmailConfig = {
        clientId: 'client-123',
        emailProvider: 'gmail',
        credentials: {
          accessToken: 'token123',
        },
      };

      const pollEmailProviderSpy = jest
        .spyOn(emailSyncService, 'pollEmailProvider')
        .mockResolvedValue(0);

      const intervalId = emailSyncService.startPolling(clientConfig, 1000);

      await Promise.resolve();
      expect(pollEmailProviderSpy).toHaveBeenCalledTimes(1);

      emailSyncService.stopPolling(intervalId);

      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      // Should still be 1, not called again after stopping
      expect(pollEmailProviderSpy).toHaveBeenCalledTimes(1);

      pollEmailProviderSpy.mockRestore();
    });
  });
});
