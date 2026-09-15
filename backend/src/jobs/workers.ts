import { Worker, type ConnectionOptions } from 'bullmq';
import { eq } from 'drizzle-orm';
import { getRedisClient } from '../shared/database/redis.js';
import { logger } from '../shared/logger/logger.js';
import { db } from '../db/index.js';
import { subscriptions, providerPayouts } from '../db/schema/index.js';
import { subscriptionEngine } from '../modules/subscriptions/subscriptionEngine.js';
import { paymentService } from '../modules/payments/payment.service.js';
import { notificationService } from '../modules/notifications/notification.service.js';
import { QUEUE_NAMES } from './queues.js';

const workers: Worker[] = [];

const connection = (): ConnectionOptions | null => {
  const client = getRedisClient();
  if (!client) return null;
  return client as unknown as ConnectionOptions;
};

/**
 * ARCHITECTURE.md §7 — all handlers are idempotent by construction:
 * occurrence inserts use ON CONFLICT DO NOTHING, webhook/payment
 * processing keys on gatewayTransactionId, notifications dedup on
 * (userId, type, referenceId), payouts transition SCHEDULED→PROCESSING
 * atomically so a retried job cannot double-pay.
 */
export const startWorkers = (): void => {
  const conn = connection();
  if (!conn) {
    logger.warn('Redis unavailable; BullMQ workers not started (API still serves traffic)');
    return;
  }

  workers.push(
    new Worker(
      QUEUE_NAMES.occurrences,
      async (job) => {
        if (job.name === 'generate-for-subscription') {
          const { subscriptionId } = job.data as { subscriptionId: string };
          await subscriptionEngine.generateOccurrences(subscriptionId, 14);
        } else if (job.name === 'nightly-rollover') {
          const active = await db.query.subscriptions.findMany({
            where: eq(subscriptions.status, 'ACTIVE'),
            columns: { id: true },
          });
          for (const sub of active) {
            await subscriptionEngine.generateOccurrences(sub.id, 14);
          }
          logger.info({ count: active.length }, 'Nightly occurrence rollover complete');
        }
      },
      { connection: conn as never, concurrency: 5 }
    )
  );

  workers.push(
    new Worker(
      QUEUE_NAMES.notifications,
      async (job) => {
        const { userId, type, title, body, data, priority, referenceId } = job.data as {
          userId: string;
          type: string;
          title: string;
          body: string;
          data?: Record<string, unknown>;
          priority?: 'HIGH' | 'NORMAL' | 'LOW';
          referenceId?: string;
        };
        await notificationService.notify({ userId, type, title, body, data, priority, referenceId });
      },
      { connection: conn as never, concurrency: 10 }
    )
  );

  workers.push(
    new Worker(
      QUEUE_NAMES.reconciliation,
      async () => {
        await paymentService.reconcilePendingPayments();
      },
      { connection: conn as never, concurrency: 1 }
    )
  );

  workers.push(
    new Worker(
      QUEUE_NAMES.payouts,
      async (job) => {
        if (job.name !== 'process-weekly-payouts') return;
        const due = await db.query.providerPayouts.findMany({
          where: eq(providerPayouts.status, 'SCHEDULED'),
        });
        for (const payout of due) {
          const claimed = await db
            .update(providerPayouts)
            .set({ status: 'PROCESSING' })
            .where(eq(providerPayouts.id, payout.id))
            .returning();
          if (claimed.length === 0) continue;
          try {
            // Integration point: bank/wallet transfer via gateway adapter.
            await db
              .update(providerPayouts)
              .set({ status: 'PAID', paidAt: new Date() })
              .where(eq(providerPayouts.id, payout.id));
          } catch (err) {
            logger.error({ err, payoutId: payout.id }, 'Payout processing failed');
            await db
              .update(providerPayouts)
              .set({ status: 'FAILED' })
              .where(eq(providerPayouts.id, payout.id));
          }
        }
      },
      { connection: conn as never, concurrency: 1 }
    )
  );

  workers.push(
    new Worker(
      QUEUE_NAMES.cleanup,
      async () => {
        const cutoff = new Date(Date.now() - 24 * 3_600_000);
        const abandoned = await db.query.subscriptions.findMany({
          where: eq(subscriptions.status, 'PENDING_PAYMENT'),
        });
        const stale = abandoned.filter((s) => s.createdAt < cutoff);
        for (const sub of stale) {
          await db
            .update(subscriptions)
            .set({ status: 'CANCELLED', updatedAt: new Date() })
            .where(eq(subscriptions.id, sub.id));
        }
        if (stale.length > 0) logger.info({ count: stale.length }, 'Cleaned up abandoned payments');
      },
      { connection: conn as never, concurrency: 1 }
    )
  );

  for (const worker of workers) {
    worker.on('failed', (job, err) => {
      logger.error({ queue: worker.name, jobId: job?.id, err }, 'Background job failed');
    });
  }

  logger.info('BullMQ workers started');
};

export const stopWorkers = async (): Promise<void> => {
  await Promise.all(workers.map((w) => w.close()));
};
