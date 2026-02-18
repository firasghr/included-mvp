import taskService from '../services/taskService';
import summaryService from '../services/summaryService';
import { processWithLLM } from './llmWorker';

/**
 * Background worker function that processes pending tasks
 * Fetches pending tasks, processes them with LLM, and updates status
 */
export async function processPendingTasks(): Promise<void> {
  try {
    console.log('Starting background worker to process pending tasks...');

    const tasks = await taskService.getPendingTasks(10);

    if (tasks.length === 0) {
      console.log('No pending tasks to process.');
      return;
    }

    console.log(`Found ${tasks.length} pending tasks to process.`);

    // Process each task
    for (const task of tasks) {
      try {
        // Update status to processing
        await taskService.updateTaskStatus(task.id, 'processing');
        console.log(`Processing task: ${task.id}`);

        // Process with LLM
        const summary = await processWithLLM(task.input);

        // Check if there was an error
        if (summary === 'Error processing input.') {
          await taskService.updateTaskStatus(task.id, 'failed', summary);
          console.error(`Task failed: ${task.id}`);
        } else {
          // Save summary (this will also create notification events)
          await summaryService.createSummary(task.id, task.client_id, summary);

          // Update task status to completed
          await taskService.updateTaskStatus(task.id, 'completed', summary);
          console.log(`Task completed: ${task.id}`);
        }
      } catch (taskError) {
        console.error(`Error processing task ${task.id}:`, taskError);
        const errorMessage = taskError instanceof Error ? taskError.message : 'Unknown error';
        await taskService.updateTaskStatus(task.id, 'failed', `Error: ${errorMessage}`);
      }
    }

    console.log('Background worker finished processing pending tasks.');
  } catch (error) {
    console.error('Error in background worker:', error);
  }
}
