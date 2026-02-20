import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requestLogger, errorHandler, notFoundHandler } from '../lib/middleware';
import clientRoutes from '../routes/clientRoutes';
import taskRoutes from '../routes/taskRoutes';
import reportRoutes from '../routes/reportRoutes';
import summaryRoutes from '../routes/summaryRoutes';
import emailWebhookRoutes from '../routes/emailWebhook';
import inboundEmailRoutes from '../routes/inboundEmailRoutes';
import notificationRoutes from '../routes/notificationRoutes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Allow the dashboard to call this API.
// In development, defaults to the Vite dev-server origin (localhost:5173).
// In production, set DASHBOARD_ORIGIN to your actual dashboard URL.
const allowedOrigin = process.env.DASHBOARD_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: false }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/clients', clientRoutes);
app.use('/task', taskRoutes);
app.use('/report', reportRoutes);
app.use('/summaries', summaryRoutes);
app.use('/email-webhook', emailWebhookRoutes);
app.use('/webhooks/resend-inbound', inboundEmailRoutes);
app.use('/notifications', notificationRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);

    // Start email worker: sends pending email notifications on a polling loop
    const EMAIL_BATCH_SIZE = 10;
    const EMAIL_INTERVAL_MS = 10000;

    import('../workers/emailWorker')
      .then(({ startEmailWorker }) => startEmailWorker(EMAIL_BATCH_SIZE, EMAIL_INTERVAL_MS))
      .catch(error => console.error('Email worker error:', error));

    // Start automation worker: recovers tasks stuck in pending state
    const AUTOMATION_INTERVAL_MS = 60000; // every 60 seconds

    import('../workers/automationWorker')
      .then(({ processPendingTasks }) => {
        const run = () =>
          processPendingTasks().catch(err => console.error('Automation worker error:', err));
        run();
        setInterval(run, AUTOMATION_INTERVAL_MS);
      })
      .catch(error => console.error('Automation worker load error:', error));
  });
}

export default app;
