import supabase from '../database/supabase';

const REPORT_PREFIX = '📝 Daily Report:';

/**
 * Generate a daily report of completed tasks for a specific client
 * @param clientId - The client ID to filter tasks by
 * @returns Text report with all completed task outputs for the client
 */
export async function generateReport(clientId: string): Promise<string> {
  try {
    const { data: tasks, error } = await supabase()
      .from('tasks')
      .select('output')
      .eq('client_id', clientId)
      .eq('status', 'done')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    if (!tasks || tasks.length === 0) {
      return `${REPORT_PREFIX}\n- No completed tasks found.`;
    }

    let report = REPORT_PREFIX;
    
    for (const task of tasks) {
      if (task.output) {
        report += `\n- ${task.output}`;
      }
    }

    return report;
  } catch (error) {
    console.error('Error generating report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `${REPORT_PREFIX}\n- Error generating report: ${errorMessage}`;
  }
}
