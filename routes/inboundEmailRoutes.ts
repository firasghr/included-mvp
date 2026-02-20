import { Router, Request, Response } from 'express';
import inboundEmailService from '../services/inboundEmailService';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('🧠 Resend inbound webhook payload:', JSON.stringify(req.body, null, 2));

    const { from, to, subject, text, html } = req.body;

    // Validate required fields and include the field name in the error message
    if (!from) return res.status(400).json({ error: 'Invalid payload', message: 'Missing required field: from' });
    if (!to) return res.status(400).json({ error: 'Invalid payload', message: 'Missing required field: to' });
    if (!subject) return res.status(400).json({ error: 'Invalid payload', message: 'Missing required field: subject' });
    if (!text) return res.status(400).json({ error: 'Invalid payload', message: 'Missing required field: text' });

    // Service errors (invalid address, client not found, DB failure) propagate as 500 so
    // callers can detect and retry. Structural validation (missing fields) is handled above with 400.
    await inboundEmailService.processInboundEmail({ from, to, subject, text, html });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing inbound email webhook:', error);
    return res.status(500).json({ error: 'Internal server error', message: error instanceof Error ? error.message : '' });
  }
});

export default router;
