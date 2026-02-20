import { Router, Request, Response } from 'express';
// We import the singleton service correctly rather than redeclaring it
import inboundEmailService from '../services/inboundEmailService';

// --- Express route ---
const router = Router();

router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('🧠 Resend inbound webhook payload:', JSON.stringify(req.body, null, 2));

    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'Invalid payload', message: 'Missing data object' });

    const from = data.from;
    const toArray = data.to;
    const subject = data.subject;
    const text = data.text || '';
    const html = data.html || '';

    if (!from || !toArray || !Array.isArray(toArray) || toArray.length === 0 || !subject) {
      return res.status(400).json({ error: 'Invalid payload', message: 'Missing required fields' });
    }

    const to = toArray[0]; // first recipient

    // Use the correctly imported service instance
    await inboundEmailService.processInboundEmail({ from, to, subject, text, html });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing inbound email webhook:', error);
    return res.status(500).json({ error: 'Internal server error', message: error instanceof Error ? error.message : '' });
  }
});

export default router;