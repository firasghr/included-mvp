import 'dotenv/config';
import emailService from '../services/emailService';

/**
 * Email Worker
 * Background worker that processes pending email notifications in batches.
 * Runs on a polling interval started by the orchestrator.
 */

/**
 * Process pending email notifications in batches.
 *
 * @param batchSize - Number of notifications to process per run (1–100, default 10)
 * @returns Batch statistics: total processed, successful, and failed counts
 */
export async function processPendingEmails(batchSize: number = 10): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  const stats = { processed: 0, successful: 0, failed: 0 };

  if (batchSize < 1 || batchSize > 100) batchSize = 10;

  const pendingEmails = await emailService.fetchPendingEmails(batchSize);

  if (pendingEmails.length === 0) return stats;

  console.log(`[EmailWorker] Processing ${pendingEmails.length} pending notification(s)…`);

  for (const notification of pendingEmails) {
    stats.processed++;
    try {
      const success = await emailService.processEmailNotification(notification);
      if (success) {
        stats.successful++;
      } else {
        stats.failed++;
      }
      // Small delay to avoid hitting rate limits
      if (stats.processed < pendingEmails.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      stats.failed++;
      console.error(`[EmailWorker] Error processing notification ${notification.id}:`, error);
    }
  }

  console.log(`[EmailWorker] Done — ${stats.successful} sent, ${stats.failed} failed`);
  return stats;
}

/**
 * Start continuous email processing on a polling interval.
 *
 * @param batchSize  - Notifications per batch
 * @param intervalMs - Milliseconds between polling cycles (default 60 000)
 */
export async function startEmailWorker(batchSize: number = 10, intervalMs: number = 60000): Promise<void> {
  console.log(`[EmailWorker] Started — batch ${batchSize}, interval ${intervalMs}ms`);

  try {
    await processPendingEmails(batchSize);
  } catch (error) {
    console.error('[EmailWorker] Initial run error:', error);
  }

  setInterval(() => {
    processPendingEmails(batchSize).catch(err =>
      console.error('[EmailWorker] Scheduled run error:', err)
    );
  }, intervalMs);
}

// Direct execution (ts-node workers/emailWorker.ts)
if (require.main === module) {
  processPendingEmails(10)
    .then(stats => console.log('[EmailWorker] One-shot complete:', stats))
    .catch(error => {
      console.error('[EmailWorker] Fatal error:', error);
      process.exit(1);
    });
}

