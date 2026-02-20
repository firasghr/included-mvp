import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requestLogger, errorHandler, notFoundHandler } from '../lib/middleware';
import clientRoutes from '../routes/clientRoutes';
import taskRoutes from '../routes/taskRoutes';
import reportRoutes from '../routes/reportRoutes';
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
// Credentials (cookies/auth headers) are intentionally not forwarded by the
// dashboard, so `credentials: false` is safe here; we set it explicitly.
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

    // Start email worker in background (non-blocking)
    // Import lazily to avoid loading emailService during tests
    console.log('Starting email worker...');
    const BATCH_SIZE = 10; // Number of emails to process per batch
    const INTERVAL_MS = 10000; // Poll every 10 seconds (10000ms)

    import('../workers/emailWorker')
      .then(({ startEmailWorker }) => {
        return startEmailWorker(BATCH_SIZE, INTERVAL_MS);
      })
      .catch(error => {
        console.error('Email worker error:', error);
      });
  });
}

export default app;
