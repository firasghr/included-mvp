import supabase from '../database/supabase';
import { NotificationEvent } from '../types/task';

/**
 * Notification Service
 * Handles notification event creation and management
 * Prepares notifications but does not send them yet
 */
export class NotificationService {
  /**
   * Create notification events for a summary
   * Creates both email and whatsapp notification events in pending status
   */
  async createNotificationEvents(clientId: string, summaryId: string): Promise<NotificationEvent[]> {
    const events = [
      {
        client_id: clientId,
        summary_id: summaryId,
        type: 'email' as const,
        status: 'pending' as const,
      },
      {
        client_id: clientId,
        summary_id: summaryId,
        type: 'whatsapp' as const,
        status: 'pending' as const,
      },
    ];

    const { data: notificationEvents, error } = await supabase()
      .from('notification_events')
      .insert(events)
      .select();

    if (error) {
      throw new Error(`Failed to create notification events: ${error.message}`);
    }

    console.log(`Created ${notificationEvents?.length || 0} notification events for summary ${summaryId}`);

    return notificationEvents || [];
  }

  /**
   * Get pending notification events
   */
  async getPendingNotifications(limit: number = 50): Promise<NotificationEvent[]> {
    const { data: events, error } = await supabase()
      .from('notification_events')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch pending notifications: ${error.message}`);
    }

    return events || [];
  }

  /**
   * Update notification event status
   */
  async updateNotificationStatus(eventId: string, status: 'sent' | 'failed'): Promise<void> {
    const { error } = await supabase()
      .from('notification_events')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) {
      throw new Error(`Failed to update notification status: ${error.message}`);
    }
  }
}

export default new NotificationService();
