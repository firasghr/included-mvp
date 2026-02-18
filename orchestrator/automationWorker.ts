import { getSupabaseClient } from './supabase';

/**
 * Automation Worker - Handles automated reporting and background tasks
 */

export interface DailyReport {
  date: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  successRate: number;
  summary: string;
}

/**
 * Generate a daily report of tasks
 * @returns Daily report with statistics
 */
export async function generateReport(): Promise<DailyReport> {
  const supabase = getSupabaseClient();
  
  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    // Fetch all tasks for today
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (error) {
      throw new Error(`Failed to fetch tasks for report: ${error.message}`);
    }

    // Calculate statistics
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0;
    const failedTasks = tasks?.filter((t) => t.status === 'failed').length || 0;
    const pendingTasks = tasks?.filter((t) => t.status === 'pending' || t.status === 'processing').length || 0;
    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Generate summary
    const summary = generateSummary(totalTasks, completedTasks, failedTasks, pendingTasks, successRate);

    return {
      date: today.toISOString().split('T')[0],
      totalTasks,
      completedTasks,
      failedTasks,
      pendingTasks,
      successRate: Math.round(successRate * 100) / 100,
      summary,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Return error report
    return {
      date: today.toISOString().split('T')[0],
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      pendingTasks: 0,
      successRate: 0,
      summary: `Error generating report: ${errorMessage}`,
    };
  }
}

/**
 * Generate a human-readable summary
 */
function generateSummary(
  total: number,
  completed: number,
  failed: number,
  pending: number,
  successRate: number
): string {
  if (total === 0) {
    return 'No tasks processed today.';
  }

  const parts = [
    `Daily Report: ${total} total task${total !== 1 ? 's' : ''}.`,
    `${completed} completed (${successRate.toFixed(1)}% success rate).`,
  ];

  if (failed > 0) {
    parts.push(`${failed} failed.`);
  }

  if (pending > 0) {
    parts.push(`${pending} pending/processing.`);
  }

  return parts.join(' ');
}
