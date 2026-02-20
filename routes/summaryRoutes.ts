import { Router } from 'express';
import summaryController from '../controllers/summaryController';

const router = Router();

/**
 * Summary routes
 */
router.get('/', (req, res) => summaryController.getSummaries(req, res));

export default router;
