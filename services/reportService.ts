import summaryService from './summaryService';

const REPORT_PREFIX = '📝 Daily Report:';

/**
 * Report Service
 * Handles report generation business logic
 */
export class ReportService {
  /**
   * Generate a daily report for a specific client
   * Fetches summaries from the summaries table and formats them
   */
  async generateReport(clientId: string): Promise<string> {
    try {
      const summaries = await summaryService.getSummariesByClient(clientId);

      if (summaries.length === 0) {
        return `${REPORT_PREFIX}\n- No completed tasks found.`;
      }

      let report = REPORT_PREFIX;

      for (const item of summaries) {
        if (item.summary) {
          report += `\n- ${item.summary}`;
        }
      }

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `${REPORT_PREFIX}\n- Error generating report: ${errorMessage}`;
    }
  }
}

export default new ReportService();
