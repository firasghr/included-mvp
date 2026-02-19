import { Router, Request, Response } from 'express';
import emailSyncService, { EmailData } from '../services/emailSyncService';

const router = Router();

/**
 * Email Webhook Routes
 * Handles incoming email webhooks from external integrations
 */

/**
 * POST /email-webhook
 * Accept incoming email payloads and create tasks
 */
router.post('/', async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('Received email webhook request');

    const { clientId, sender, subject, body, attachments } = req.body;

    // Validate required fields
    if (!clientId || typeof clientId !== 'string' || clientId.trim().length === 0) {
      console.error('Email webhook validation failed: missing or invalid clientId');
      return res.status(400).json({
        error: 'Invalid payload',
        message: 'Request body must contain a non-empty "clientId" field',
      });
    }

    if (!sender || typeof sender !== 'string' || sender.trim().length === 0) {
      console.error('Email webhook validation failed: missing or invalid sender');
      return res.status(400).json({
        error: 'Invalid payload',
        message: 'Request body must contain a non-empty "sender" field',
      });
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      console.error('Email webhook validation failed: missing or invalid subject');
      return res.status(400).json({
        error: 'Invalid payload',
        message: 'Request body must contain a non-empty "subject" field',
      });
    }

    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      console.error('Email webhook validation failed: missing or invalid body');
      return res.status(400).json({
        error: 'Invalid payload',
        message: 'Request body must contain a non-empty "body" field',
      });
    }

    // Validate attachments if provided
    if (attachments !== undefined && !Array.isArray(attachments)) {
      console.error('Email webhook validation failed: invalid attachments format');
      return res.status(400).json({
        error: 'Invalid payload',
        message: '"attachments" field must be an array if provided',
      });
    }

    // Construct email data
    const emailData: EmailData = {
      clientId: clientId.trim(),
      sender: sender.trim(),
      subject: subject.trim(),
      body: body.trim(),
      attachments: attachments || [],
    };

    // Process the email
    const taskId = await emailSyncService.processIncomingEmail(emailData);

    if (!taskId) {
      console.error('Failed to process email webhook: task creation failed');
      return res.status(500).json({
        error: 'Processing failed',
        message: 'Failed to create task from email',
      });
    }

    console.log(`Email webhook processed successfully: created task ${taskId}`);

    return res.status(200).json({
      success: true,
      message: 'Email processed successfully',
      taskId,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error processing email webhook: ${errorMessage}`);

    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

export default router;
