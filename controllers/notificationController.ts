import { Request, Response } from 'express';
import notificationService from '../services/notificationService';

/**
 * Notification Controller
 * Handles HTTP requests for notification event endpoints used by the dashboard.
 */
export class NotificationController {
  /**
   * GET /notifications
   * List all notification events.
   * Query params:
   *   - status  (optional) 'pending' | 'sent' | 'failed'
   *   - clientId (optional) UUID
   */
  async getAllNotifications(req: Request, res: Response): Promise<Response> {
    try {
      const { status, clientId } = req.query as Record<string, string | undefined>;

      const notifications = await notificationService.getAllNotifications(
        { status, clientId },
        200
      );

      return res.status(200).json({ success: true, notifications });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Internal server error', message });
    }
  }
}

export default new NotificationController();
