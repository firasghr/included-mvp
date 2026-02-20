import { Router } from 'express';
import notificationController from '../controllers/notificationController';

const router = Router();

/**
 * Notification routes
 * Read-only endpoints consumed by the dashboard.
 */

/** GET /notifications — list all notifications with optional filters */
router.get('/', (req, res) => notificationController.getAllNotifications(req, res));

export default router;
