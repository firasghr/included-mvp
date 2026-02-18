import { Request, Response } from 'express';
import reportService from '../services/reportService';

/**
 * Report Controller
 * Handles HTTP requests for report endpoints
 */
export class ReportController {
  /**
   * GET /report
   * Generate a daily report for a specific client
   */
  async generateReport(req: Request, res: Response): Promise<Response> {
    try {
      const { clientId } = req.query;

      // Validate clientId
      if (!clientId || typeof clientId !== 'string' || clientId.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Query parameter "clientId" is required',
        });
      }

      console.log(`Generating daily report for client: ${clientId}...`);
      const report = await reportService.generateReport(clientId);

      return res.status(200).json({ report });
    } catch (error) {
      console.error('Error generating report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return res.status(500).json({
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  }
}

export default new ReportController();
