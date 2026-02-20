import { Request, Response } from 'express';
import summaryService from '../services/summaryService';

/**
 * Summary Controller
 * Handles HTTP requests for summary endpoints
 */
export class SummaryController {
  /**
   * GET /summaries
   * Return recent summaries, optionally filtered by clientId
   */
  async getSummaries(req: Request, res: Response): Promise<Response> {
    try {
      const { clientId } = req.query as Record<string, string | undefined>;
      const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10) || 50, 200);

      const summaries = clientId
        ? await summaryService.getSummariesByClient(clientId)
        : await summaryService.getRecentSummaries(limit);

      return res.status(200).json({ success: true, summaries });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ error: 'Internal server error', message: errorMessage });
    }
  }
}

export default new SummaryController();
