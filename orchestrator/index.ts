import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { requestLogger, errorHandler, notFoundHandler } from '../lib/middleware';
import clientRoutes from '../routes/clientRoutes';
import taskRoutes from '../routes/taskRoutes';
import reportRoutes from '../routes/reportRoutes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/clients', clientRoutes);
app.use('/task', taskRoutes);
app.use('/report', reportRoutes);

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
    import('../workers/emailWorker').then(({ startEmailWorker }) => {
      startEmailWorker(10, 10000).catch(error => {
        console.error('Email worker error:', error);
      });
    }).catch(error => {
      console.error('Failed to load email worker:', error);
    });
  });
}

export default app;
