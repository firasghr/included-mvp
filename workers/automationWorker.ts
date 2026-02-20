import taskService from '../services/taskService';
import summaryService from '../services/summaryService';
import { processWithLLM } from './llmWorker';

/**
 * Automation Worker
 * Recovery mechanism: picks up tasks stuck in 'pending' state and processes them.
 * Runs periodically from the orchestrator as a safety net for tasks that were not
 * processed inline (e.g. after a server restart).
 */
export async function processPendingTasks(): Promise<void> {
  const tasks = await taskService.getPendingTasks(10);

  if (tasks.length === 0) return;

  console.log(`[AutomationWorker] Recovering ${tasks.length} pending task(s)…`);

  for (const task of tasks) {
    try {
      await taskService.updateTaskStatus(task.id, 'processing');

      const summary = await processWithLLM(task.input);

      if (summary === 'Error processing input.') {
        await taskService.updateTaskStatus(task.id, 'failed', summary);
        console.error(`[AutomationWorker] Task failed: ${task.id}`);
      } else {
        await summaryService.createSummary(task.id, task.client_id, summary);
        await taskService.updateTaskStatus(task.id, 'completed', summary);
        console.log(`[AutomationWorker] Task completed: ${task.id}`);
      }
    } catch (taskError) {
      console.error(`[AutomationWorker] Error processing task ${task.id}:`, taskError);
      const errorMessage = taskError instanceof Error ? taskError.message : 'Unknown error';
      await taskService.updateTaskStatus(task.id, 'failed', `Error: ${errorMessage}`);
    }
  }
}

