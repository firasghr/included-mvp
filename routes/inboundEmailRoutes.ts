import { Router, Request, Response } from 'express';
import inboundEmailService from '../services/inboundEmailService';

const router = Router();

/**
 * POST /webhooks/resend-inbound
 * Receives an inbound email webhook from Resend and processes it.
 */
router.post('/', async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('Received Resend inbound email webhook');

    const { from, to, subject, text, html } = req.body;

    if (!from || typeof from !== 'string' || from.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid payload',
        message: 'Request body must contain a non-empty "from" field',
      });
    }

    if (!to || typeof to !== 'string' || to.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid payload',
        message: 'Request body must contain a non-empty "to" field',
      });
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid payload',
        message: 'Request body must contain a non-empty "subject" field',
      });
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid payload',
        message: 'Request body must contain a non-empty "text" field',
      });
    }

    await inboundEmailService.processInboundEmail({ from, to, subject, text, html });

    return res.status(200).json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error processing inbound email webhook: ${errorMessage}`);

    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

export default router;
