import { v4 as uuidv4 } from 'uuid';
import supabase from '../database/supabase';
import { Task } from '../types/task';
import { processWithLLM } from '../workers/llmWorker';
import summaryService from './summaryService';

/**
 * Task Service
 * Handles all task-related business logic
 */
export class TaskService {
  /**
   * Create a new task
   */
  async createTask(text: string, clientId: string): Promise<Task> {
    const taskId = uuidv4();

    const { data: task, error } = await supabase()
      .from('tasks')
      .insert([
        {
          id: taskId,
          input: text,
          output: null,
          status: 'pending',
          client_id: clientId,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    console.log(`Task created: ${taskId}`);

    // Process task asynchronously (non-blocking)
    this.processTaskAsync(taskId, text, clientId).catch((err) => {
      console.error(`Error in async task processing for ${taskId}:`, err);
    });

    return task;
  }

  /**
   * Process task asynchronously
   * Updates status through the lifecycle: pending -> processing -> completed/failed
   */
  private async processTaskAsync(taskId: string, inputText: string, clientId: string): Promise<void> {
    try {
      // Update task status to processing
      await supabase()
        .from('tasks')
        .update({ status: 'processing' })
        .eq('id', taskId);

      console.log(`Processing task: ${taskId}`);

      // Process with LLM
      const summary = await processWithLLM(inputText);

      // Check if there was an error
      if (summary === 'Error processing input.') {
        await supabase()
          .from('tasks')
          .update({
            output: summary,
            status: 'failed',
          })
          .eq('id', taskId);
        console.error(`Task failed: ${taskId}`);
      } else {
        // Save summary and create notification events
        await summaryService.createSummary(taskId, clientId, summary);

        // Update task status to completed
        await supabase()
          .from('tasks')
          .update({
            output: summary,
            status: 'completed',
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
   * Get pending tasks for background processing
   */
  async getPendingTasks(limit: number = 10): Promise<Array<{ id: string; input: string; client_id: string }>> {
    const { data: tasks, error } = await supabase()
      .from('tasks')
      .select('id, input, client_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch pending tasks: ${error.message}`);
    }

    return tasks || [];
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: string, output?: string): Promise<void> {
    const updateData: Record<string, string> = { status };
    if (output !== undefined) {
      updateData.output = output;
    }

    const { error } = await supabase()
      .from('tasks')
      .update(updateData)
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to update task status: ${error.message}`);
    }
  }
}

export default new TaskService();
