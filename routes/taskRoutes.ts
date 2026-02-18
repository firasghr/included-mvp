import { Router } from 'express';
import taskController from '../controllers/taskController';

const router = Router();

/**
 * Task routes
 */
router.post('/', (req, res) => taskController.createTask(req, res));

export default router;
