import supabase from '../database/supabase';

/**
 * Generate a daily report of completed tasks
 * @returns Text report with all completed task outputs
 */
export async function generateReport(): Promise<string> {
  try {
    const { data: tasks, error } = await supabase()
      .from('tasks')
      .select('output')
      .eq('status', 'done')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    if (!tasks || tasks.length === 0) {
      return '📝 Daily Report:\n- No completed tasks found.';
    }

    let report = '📝 Daily Report:';
    
    for (const task of tasks) {
      if (task.output) {
        report += `\n- ${task.output}`;
      }
    }

    return report;
  } catch (error) {
    console.error('Error generating report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `📝 Daily Report:\n- Error generating report: ${errorMessage}`;
  }
}
