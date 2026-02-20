import axios from 'axios';
import supabase from '../database/supabase';
import { NotificationEvent } from '../types/task';

/**
 * Email Service
 * Handles robust email sending using Resend API with retry logic via Axios
 */
export class EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@yourdomain.com';

    if (!this.apiKey) {
      throw new Error('RESEND_API_KEY (or EMAIL_PROVIDER_API_KEY) environment variable is not set');
    }
  }

  /**
   * Fetch pending email notifications from Supabase
   * Filters by type='email' and status='pending'
   * 
   * @param limit - Maximum number of notifications to fetch (default: 10)
   * @returns Array of pending email notification events
   */
  async fetchPendingEmails(limit: number = 10): Promise<NotificationEvent[]> {
    try {
      console.log(`Fetching up to ${limit} pending email notifications...`);

      const { data: events, error } = await supabase
        .from('notification_events')
        .select('*')
        .eq('type', 'email')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch pending emails: ${error.message}`);
      }

      console.log(`Found ${events?.length || 0} pending email notifications`);
      return events || [];
    } catch (error) {
      console.error('Error fetching pending emails:', error);
      throw error;
    }
  }

  /**
   * Send an email using Resend API via Axios
   * 
   * @param to - Recipient email address
   * @param subject - Email subject line
   * @param html - HTML content of the email
   * @returns Resend email response with message ID
   */
  async sendEmail(to: string, subject: string, html: string): Promise<{ id: string }> {
    try {
      console.log(`Sending email to ${to} with subject: "${subject}"`);

      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: this.fromEmail,
          to: [to],
          subject,
          html,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const id = response.data?.id || 'unknown';
      console.log(`Email sent successfully to ${to}. Message ID: ${id}`);
      return { id };
    } catch (error: any) {
      const apiError = error.response?.data?.message || error.message;
      console.error(`Failed to send email to ${to} via Axios:`, apiError);
      throw new Error(`Resend Axios Error: ${apiError}`);
    }
  }

  /**
   * Update the status of a notification event in Supabase
   * 
   * @param eventId - The notification event ID
   * @param status - New status: 'sent' or 'failed'
   * @param errorMessage - Optional error message for failed notifications
   */
  async updateStatus(
    eventId: string,
    status: 'sent' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    try {
      console.log(`Updating notification ${eventId} status to: ${status}`);

      const updateData: {
        status: 'sent' | 'failed';
        updated_at: string;
      } = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Store error message if provided (you may want to add an error_message column)
      if (errorMessage) {
        console.error(`Error for notification ${eventId}: ${errorMessage}`);
      }

      const { error } = await supabase
        .from('notification_events')
        .update(updateData)
        .eq('id', eventId);

      if (error) {
        throw new Error(`Failed to update notification status: ${error.message}`);
      }

      console.log(`Successfully updated notification ${eventId} to ${status}`);
    } catch (error) {
      console.error(`Error updating status for notification ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Handle retry logic with exponential backoff
   * Attempts to execute a function with retries on failure
   * 
   * @param fn - Async function to retry
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @param baseDelayMs - Base delay in milliseconds for exponential backoff (default: 1000)
   * @returns Result of the function execution
   */
  async handleRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<T> {
    const MAX_DELAY_MS = 10000; // 10 seconds maximum delay
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries}`);
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);

        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, 8s, ... (capped at MAX_DELAY_MS)
          const delayMs = Math.min(baseDelayMs * Math.pow(2, attempt - 1), MAX_DELAY_MS);
          console.log(`Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    console.error(`Operation failed after ${maxRetries} attempts`);
    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Get client email address for a notification
   * Fetches the client's email from the database via summary
   * 
   * @param summaryId - Summary ID from notification event
   * @returns Client email address or null if not found
   */
  async getClientEmailForSummary(summaryId: string): Promise<string | null> {
    try {
      // First get the summary to find the client_id
      const { data: summary, error: summaryError } = await supabase
        .from('summaries')
        .select('client_id, summary')
        .eq('id', summaryId)
        .single();

      if (summaryError || !summary) {
        console.error(`Failed to fetch summary ${summaryId}:`, summaryError?.message);
        return null;
      }

      // Then get the client's email
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('email, name')
        .eq('id', summary.client_id)
        .single();

      if (clientError || !client || !client.email) {
        console.error(`Failed to fetch client for summary ${summaryId}:`, clientError?.message);
        return null;
      }

      return client.email;
    } catch (error) {
      console.error(`Error getting client email for summary ${summaryId}:`, error);
      return null;
    }
  }

  /**
   * Get summary content for email
   * 
   * @param summaryId - Summary ID from notification event
   * @returns Summary content or null if not found
   */
  async getSummaryContent(summaryId: string): Promise<{ summary: string; clientName: string } | null> {
    try {
      const { data: summary, error: summaryError } = await supabase
        .from('summaries')
        .select('client_id, summary')
        .eq('id', summaryId)
        .single();

      if (summaryError || !summary) {
        console.error(`Failed to fetch summary ${summaryId}:`, summaryError?.message);
        return null;
      }

      // Get client name
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('name')
        .eq('id', summary.client_id)
        .single();

      if (clientError || !client) {
        console.error(`Failed to fetch client for summary ${summaryId}:`, clientError?.message);
        return null;
      }

      return {
        summary: summary.summary,
        clientName: client.name,
      };
    } catch (error) {
      console.error(`Error getting summary content for ${summaryId}:`, error);
      return null;
    }
  }

  /**
   * Escape HTML special characters to prevent XSS
   * 
   * @param text - Text to escape
   * @returns HTML-safe text
   */
  private escapeHtml(text: string): string {
    const htmlEscapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
  }

  /**
   * Process a single email notification event
   * Fetches client info, sends email, and updates status
   * 
   * @param event - Notification event to process
   * @returns Success status
   */
  async processEmailNotification(event: NotificationEvent): Promise<boolean> {
    console.log(`\n--- Processing notification ${event.id} for client ${event.client_id} ---`);

    try {
      // Get client email address
      const clientEmail = await this.getClientEmailForSummary(event.summary_id);
      if (!clientEmail) {
        await this.updateStatus(event.id, 'failed', 'Client email not found');
        return false;
      }

      // Get summary content
      const summaryData = await this.getSummaryContent(event.summary_id);
      if (!summaryData) {
        await this.updateStatus(event.id, 'failed', 'Summary content not found');
        return false;
      }

      // Construct email HTML
      const subject = 'Included — New Summary Ready';
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Included — New Summary Ready</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hello,</p>
  
  <p>Here is your latest summary:</p>
  
  <div style="background-color: #f9f9f9; border-left: 4px solid #2c3e50; padding: 15px; margin: 20px 0;">
    <p style="margin: 0; font-size: 16px; line-height: 1.6;">${this.escapeHtml(summaryData.summary)}</p>
  </div>
  
  <p style="margin-top: 30px;">Included AI Assistant</p>
</body>
</html>
      `.trim();

      // Send email with retry logic
      await this.handleRetry(async () => {
        await this.sendEmail(clientEmail, subject, html);
      }, 3, 1000);

      // Mark as sent
      await this.updateStatus(event.id, 'sent');
      console.log(`✓ Successfully processed notification ${event.id}`);
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`✗ Failed to process notification ${event.id}:`, errorMessage);

      // Mark as failed
      await this.updateStatus(event.id, 'failed', errorMessage);
      return false;
    }
  }
}

export default new EmailService();
