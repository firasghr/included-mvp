import supabase from '../database/supabase';
import { Summary } from '../types/task';
import notificationService from './notificationService';

/**
 * Summary Service
 * Handles all summary-related business logic
 */
export class SummaryService {
  /**
   * Create a new summary
   * Also creates notification events for the client
   */
  async createSummary(taskId: string, clientId: string, summary: string): Promise<Summary> {
    const { data: summaryRecord, error } = await supabase
      .from('summaries')
      .insert([
        {
          task_id: taskId,
          client_id: clientId,
          summary,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save summary: ${error.message}`);
    }

    console.log(`Summary created: ${summaryRecord.id}`);

    // Create notification events (non-blocking)
    notificationService.createNotificationEvents(clientId, summaryRecord.id).catch((err) => {
      console.error(`Failed to create notification events for summary ${summaryRecord.id}:`, err);
    });

    return summaryRecord;
  }

  /**
   * Get recent summaries (for dashboard)
   */
  async getRecentSummaries(limit: number = 50): Promise<Summary[]> {
    const { data: summaries, error } = await supabase
      .from('summaries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch summaries: ${error.message}`);
    }

    return summaries || [];
  }

  /**
   * Get summaries for a specific client
   */
  async getSummariesByClient(clientId: string): Promise<Summary[]> {
    const { data: summaries, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch summaries: ${error.message}`);
    }

    return summaries || [];
  }
}

export default new SummaryService();
