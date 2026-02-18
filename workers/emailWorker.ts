import emailService from '../services/emailService';

/**
 * Email Worker
 * Background worker that processes pending email notifications in batches
 * 
 * Features:
 * - Batch processing (configurable batch size)
 * - Multi-client isolation (each notification has client_id)
 * - Exponential backoff retry logic (handled by emailService)
 * - Comprehensive logging for monitoring/debugging
 * - Updates notification status (sent/failed) in Supabase
 */

/**
 * Process pending email notifications in batches
 * 
 * @param batchSize - Number of emails to process per batch (default: 10, max recommended: 20)
 * @returns Object with statistics about the batch processing
 */
export async function processPendingEmails(batchSize: number = 10): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  console.log('\n========================================');
  console.log('Email Worker: Starting batch processing');
  console.log(`Batch size: ${batchSize}`);
  console.log('========================================\n');

  const stats = {
    processed: 0,
    successful: 0,
    failed: 0,
  };

  try {
    // Validate batch size
    if (batchSize < 1 || batchSize > 100) {
      console.warn(`Invalid batch size: ${batchSize}. Using default of 10.`);
      batchSize = 10;
    }

    // Fetch pending email notifications
    const pendingEmails = await emailService.fetchPendingEmails(batchSize);

    if (pendingEmails.length === 0) {
      console.log('No pending email notifications to process.');
      console.log('Email Worker: Finished (nothing to process)\n');
      return stats;
    }

    console.log(`Found ${pendingEmails.length} pending email notifications to process.\n`);

    // Process each notification
    for (const notification of pendingEmails) {
      stats.processed++;

      console.log(`[${stats.processed}/${pendingEmails.length}] Processing notification ${notification.id}`);
      console.log(`  Client ID: ${notification.client_id}`);
      console.log(`  Summary ID: ${notification.summary_id}`);
      console.log(`  Created: ${notification.created_at}`);

      try {
        // Process the email notification
        const success = await emailService.processEmailNotification(notification);

        if (success) {
          stats.successful++;
          console.log(`  ✓ Status: SUCCESS\n`);
        } else {
          stats.failed++;
          console.log(`  ✗ Status: FAILED\n`);
        }

        // Add a small delay between emails to avoid rate limiting
        if (stats.processed < pendingEmails.length) {
          const delayMs = 500; // 500ms delay between emails
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

      } catch (error) {
        stats.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`  ✗ Error processing notification ${notification.id}:`, errorMessage);
        console.error(`  Status: FAILED\n`);
      }
    }

    // Summary
    console.log('========================================');
    console.log('Email Worker: Batch Processing Complete');
    console.log('========================================');
    console.log(`Total processed: ${stats.processed}`);
    console.log(`Successful: ${stats.successful} (${Math.round(stats.successful / stats.processed * 100)}%)`);
    console.log(`Failed: ${stats.failed} (${Math.round(stats.failed / stats.processed * 100)}%)`);
    console.log('========================================\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('Email Worker: Fatal Error');
    console.error('========================================');
    console.error('Error in email worker:', error);
    console.error('========================================\n');
    throw error;
  }

  return stats;
}

/**
 * Start continuous email processing (poll for new emails at regular intervals)
 * This function runs indefinitely and should be called in a separate process
 * 
 * @param batchSize - Number of emails to process per batch
 * @param intervalMs - Time between polling cycles in milliseconds (default: 60000 = 1 minute)
 */
export async function startEmailWorker(batchSize: number = 10, intervalMs: number = 60000): Promise<void> {
  console.log('\n========================================');
  console.log('Email Worker: Starting continuous mode');
  console.log(`Batch size: ${batchSize}`);
  console.log(`Poll interval: ${intervalMs}ms (${intervalMs / 1000}s)`);
  console.log('========================================\n');

  // Process immediately on start
  try {
    await processPendingEmails(batchSize);
  } catch (error) {
    console.error('Error in initial processing:', error);
  }

  // Then continue polling at intervals
  setInterval(async () => {
    try {
      await processPendingEmails(batchSize);
    } catch (error) {
      console.error('Error in scheduled processing:', error);
      // Continue processing despite errors
    }
  }, intervalMs);
}

/**
 * Example usage function - can be called directly or imported
 * Demonstrates how to use the email worker
 */
export async function runEmailWorkerExample(): Promise<void> {
  console.log('Running email worker example...\n');

  // Option 1: Process once with custom batch size
  const stats = await processPendingEmails(10);
  console.log('Processing complete:', stats);

  // Option 2: Start continuous worker (commented out)
  // await startEmailWorker(10, 60000); // Process every 60 seconds
}

// If this file is run directly (e.g., ts-node workers/emailWorker.ts)
if (require.main === module) {
  runEmailWorkerExample().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
