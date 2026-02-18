import { Router } from 'express';
import clientController from '../controllers/clientController';

const router = Router();

/**
 * Client routes
 */
router.post('/', (req, res) => clientController.createClient(req, res));
router.get('/', (req, res) => clientController.getAllClients(req, res));
router.get('/:id', (req, res) => clientController.getClientById(req, res));

export default router;
