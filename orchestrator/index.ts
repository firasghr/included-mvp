import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import supabase from '../database/supabase';
import { processWithLLM } from '../workers/llmWorker';
import { generateReport } from '../workers/automationWorker';

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
    const { data: task, error: insertError } = await supabase()
      .from('tasks')
      .insert([
        {
          id: taskId,
          input: text,
          output: null,
          status: 'processing',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create task: ${insertError.message}`);
    }

    console.log(`Task created: ${taskId}`);

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
    const output = await processWithLLM(inputText);

    // Check if there was an error
    if (output === 'Error processing input.') {
      // Update task as failed
      await supabase()
        .from('tasks')
        .update({
          output,
          status: 'failed',
        })
        .eq('id', taskId);
      console.error(`Task failed: ${taskId}`);
    } else {
      // Update task with output
      await supabase()
        .from('tasks')
        .update({
          output,
          status: 'done',
        })
        .eq('id', taskId);
      console.log(`Task completed: ${taskId}`);
    }
  } catch (error) {
    console.error(`Error processing task ${taskId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    try {
      await supabase()
        .from('tasks')
        .update({
          output: `Error: ${errorMessage}`,
          status: 'failed',
        })
        .eq('id', taskId);
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
    const report = await generateReport();

    return res.status(200).send(report);
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
