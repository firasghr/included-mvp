import taskService from './taskService';

/**
 * Email Sync Service
 * Handles incoming emails from external integrations (Gmail, Outlook, IMAP, webhooks)
 * and creates tasks from email content
 */

export interface EmailData {
  clientId: string;
  sender: string;
  subject: string;
  body: string;
  attachments?: string[];
}

export interface ClientEmailConfig {
  clientId: string;
  emailProvider: 'gmail' | 'outlook' | 'imap';
  credentials: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    accessToken?: string;
  };
}

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  isRead: boolean;
  attachments?: string[];
}

export class EmailSyncService {
  /**
   * Process an incoming email and create a task
   * @param emailData - Email data containing clientId, sender, subject, body, and optional attachments
   * @returns Task ID or null if processing failed
   */
  async processIncomingEmail(emailData: EmailData): Promise<string | null> {
    try {
      console.log(`Processing incoming email from ${emailData.sender} for client ${emailData.clientId}`);

      // Validate required fields
      if (!emailData.clientId || typeof emailData.clientId !== 'string' || emailData.clientId.trim().length === 0) {
        console.error('Invalid email data: missing or invalid clientId');
        return null;
      }

      if (!emailData.sender || typeof emailData.sender !== 'string' || emailData.sender.trim().length === 0) {
        console.error('Invalid email data: missing or invalid sender');
        return null;
      }

      if (!emailData.subject || typeof emailData.subject !== 'string') {
        console.error('Invalid email data: missing or invalid subject');
        return null;
      }

      if (!emailData.body || typeof emailData.body !== 'string' || emailData.body.trim().length === 0) {
        console.error('Invalid email data: missing or invalid body');
        return null;
      }

      // Construct task input from email content
      const taskInput = this.constructTaskInput(emailData);

      // Create task using existing TaskService
      const task = await taskService.createTask(taskInput, emailData.clientId);

      console.log(`Task created successfully from email: ${task.id}`);
      return task.id;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing incoming email: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Construct task input text from email data
   * @param emailData - Email data
   * @returns Formatted task input string
   */
  private constructTaskInput(emailData: EmailData): string {
    let taskInput = `Email from: ${emailData.sender}\n`;
    taskInput += `Subject: ${emailData.subject}\n\n`;
    taskInput += `${emailData.body}`;

    if (emailData.attachments && emailData.attachments.length > 0) {
      taskInput += `\n\nAttachments: ${emailData.attachments.join(', ')}`;
    }

    return taskInput;
  }

  /**
   * Poll email provider for new unread emails
   * @param clientConfig - Client email configuration
   * @returns Number of emails processed
   */
  async pollEmailProvider(clientConfig: ClientEmailConfig): Promise<number> {
    try {
      console.log(`Polling email provider for client ${clientConfig.clientId}`);

      // Fetch new unread emails from provider
      const unreadEmails = await this.fetchUnreadEmails(clientConfig);

      if (unreadEmails.length === 0) {
        console.log(`No new emails found for client ${clientConfig.clientId}`);
        return 0;
      }

      console.log(`Found ${unreadEmails.length} unread emails for client ${clientConfig.clientId}`);

      let processedCount = 0;

      // Process each email
      for (const email of unreadEmails) {
        const emailData: EmailData = {
          clientId: clientConfig.clientId,
          sender: email.from,
          subject: email.subject,
          body: email.body,
          attachments: email.attachments,
        };

        // Process the email
        const taskId = await this.processIncomingEmail(emailData);

        if (taskId) {
          // Mark email as read after successful processing
          await this.markEmailAsRead(clientConfig, email.id);
          processedCount++;
        }
      }

      console.log(`Successfully processed ${processedCount}/${unreadEmails.length} emails for client ${clientConfig.clientId}`);
      return processedCount;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error polling email provider for client ${clientConfig.clientId}: ${errorMessage}`);
      return 0;
    }
  }

  /**
   * Fetch unread emails from email provider (mock implementation)
   * In production, this would connect to actual email providers (Gmail API, Outlook API, IMAP)
   * @param clientConfig - Client email configuration
   * @returns Array of unread email messages
   */
  private async fetchUnreadEmails(clientConfig: ClientEmailConfig): Promise<EmailMessage[]> {
    // Mock implementation - in production, implement actual email provider connections
    console.log(`Fetching unread emails from ${clientConfig.emailProvider} for client ${clientConfig.clientId}`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return empty array for now - this would be replaced with actual email fetching logic
    return [];
  }

  /**
   * Mark email as read in email provider (mock implementation)
   * @param clientConfig - Client email configuration
   * @param emailId - Email message ID
   */
  private async markEmailAsRead(clientConfig: ClientEmailConfig, emailId: string): Promise<void> {
    // Mock implementation - in production, implement actual email provider connections
    console.log(`Marking email ${emailId} as read for client ${clientConfig.clientId}`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Start polling emails at regular intervals
   * @param clientConfig - Client email configuration
   * @param intervalMs - Polling interval in milliseconds (default: 5 minutes)
   * @returns Interval ID that can be used to stop polling
   */
  startPolling(clientConfig: ClientEmailConfig, intervalMs: number = 300000): NodeJS.Timeout {
    console.log(`Starting email polling for client ${clientConfig.clientId} every ${intervalMs / 1000} seconds`);

    // Poll immediately
    this.pollEmailProvider(clientConfig).catch(error => {
      console.error(`Error in initial email poll: ${error}`);
    });

    // Then continue polling at intervals
    const intervalId = setInterval(() => {
      this.pollEmailProvider(clientConfig).catch(error => {
        console.error(`Error in scheduled email poll: ${error}`);
      });
    }, intervalMs);

    return intervalId;
  }

  /**
   * Stop polling emails
   * @param intervalId - Interval ID returned by startPolling
   */
  stopPolling(intervalId: NodeJS.Timeout): void {
    console.log('Stopping email polling');
    clearInterval(intervalId);
  }
}

export default new EmailSyncService();

/**
 * Convenience function for processing incoming emails
 * @param emailData - Email data
 * @returns Task ID or null if processing failed
 */
export async function processIncomingEmail(emailData: EmailData): Promise<string | null> {
  return await new EmailSyncService().processIncomingEmail(emailData);
}
