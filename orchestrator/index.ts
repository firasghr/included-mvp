import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { createTask, updateTask } from './supabase';
import { processWithLLM } from './llmWorker';
import * as automationWorker from './automationWorker';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /task
 * Receives input text, saves task to Supabase, processes with LLM, and updates task
 */
app.post('/task', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain a non-empty "text" field',
      });
    }

    // Generate unique task ID
    const taskId = uuidv4();

    // Create task in database
    const task = await createTask(taskId, text);
    console.log(`Task created: ${taskId}`);

    // Update task status to processing
    await updateTask(taskId, { status: 'processing' });

    // Process with LLM (non-blocking - could be moved to background queue in production)
    processTaskAsync(taskId, text);

    // Return task immediately
    return res.status(201).json({
      success: true,
      taskId: task.id,
      status: 'processing',
      message: 'Task created and processing started',
    });
  } catch (error) {
    console.error('Error creating task:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

/**
 * Process task asynchronously
 * In production, this would be handled by a message queue (e.g., Bull, RabbitMQ)
 */
async function processTaskAsync(taskId: string, inputText: string): Promise<void> {
  try {
    // Process with LLM
    const result = await processWithLLM(inputText);

    if (result.success) {
      // Update task with output
      await updateTask(taskId, {
        output_text: result.output,
        status: 'completed',
      });
      console.log(`Task completed: ${taskId}`);
    } else {
      // Update task as failed
      await updateTask(taskId, {
        output_text: result.error || 'Processing failed',
        status: 'failed',
      });
      console.error(`Task failed: ${taskId} - ${result.error}`);
    }
  } catch (error) {
    console.error(`Error processing task ${taskId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    try {
      await updateTask(taskId, {
        output_text: `Error: ${errorMessage}`,
        status: 'failed',
      });
    } catch (updateError) {
      console.error(`Failed to update task status: ${updateError}`);
    }
  }
}

/**
 * GET /report
 * Generates a daily report using automation worker
 */
app.get('/report', async (_req: Request, res: Response) => {
  try {
    console.log('Generating daily report...');
    const report = await automationWorker.generateReport();

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

export default app;
