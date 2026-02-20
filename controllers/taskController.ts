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

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Request body must contain a non-empty "text" field',
        });
      }

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
      return res.status(500).json({ error: 'Internal server error', message: errorMessage });
    }
  }

  /**
   * GET /task
   * Return recent tasks (for dashboard)
   */
  async getRecentTasks(req: Request, res: Response): Promise<Response> {
    try {
      const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10) || 50, 200);
      const tasks = await taskService.getRecentTasks(limit);
      return res.status(200).json({ success: true, tasks });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ error: 'Internal server error', message: errorMessage });
    }
  }
}

export default new TaskController();
