import { enqueue, QUEUE_NAMES } from './queues.js';
import { logger } from '../shared/logger/logger.js';

/** Register repeatable schedules (ARCHITECTURE.md §7). Safe to call on every boot. */
export const registerSchedules = async (): Promise<void> => {
  await enqueue(QUEUE_NAMES.occurrences, 'nightly-rollover', {}, {
    jobId: 'nightly-rollover',
    repeat: { pattern: '0 0 * * *' },
  });
  await enqueue(QUEUE_NAMES.reconciliation, 'hourly-reconciliation', {}, {
    jobId: 'hourly-reconciliation',
    repeat: { pattern: '0 * * * *' },
  });
  await enqueue(QUEUE_NAMES.payouts, 'process-weekly-payouts', {}, {
    jobId: 'weekly-payouts',
    repeat: { pattern: '0 2 * * 1' },
  });
  await enqueue(QUEUE_NAMES.cleanup, 'nightly-cleanup', {}, {
    jobId: 'nightly-cleanup',
    repeat: { pattern: '30 3 * * *' },
  });
  logger.info('Background job schedules registered');
};
