import { Request, Response } from 'express';
import taskService from '../services/taskService';

/**
 * Task Controller
 * Handles HTTP requests for task endpoints
 */
export class TaskController {
  /**
   * POST /task
   * Create and process a new task
   */
  async createTask(req: Request, res: Response): Promise<Response> {
    try {
      const { text, clientId } = req.body;

      // Validate text
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Request body must contain a non-empty "text" field',
        });
      }

      // Validate clientId
      if (!clientId || typeof clientId !== 'string' || clientId.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Request body must contain a non-empty "clientId" field',
        });
      }

      const task = await taskService.createTask(text, clientId);

      return res.status(201).json({
        success: true,
        taskId: task.id,
        status: 'processing',
      });
    } catch (error) {
      console.error('Error creating task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return res.status(500).json({
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  }
}

export default new TaskController();
