import { Router } from 'express';
import reportController from '../controllers/reportController';

const router = Router();

/**
 * Report routes
 */
router.get('/', (req, res) => reportController.generateReport(req, res));

export default router;
