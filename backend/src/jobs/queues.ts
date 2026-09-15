import { Queue, type ConnectionOptions } from 'bullmq';
import { getRedisClient } from '../shared/database/redis.js';
import { logger } from '../shared/logger/logger.js';
import { env } from '../shared/config/env.js';

export const QUEUE_NAMES = {
  occurrences: 'occurrence-generation',
  notifications: 'notifications',
  reconciliation: 'payment-reconciliation',
  payouts: 'provider-payouts',
  cleanup: 'cleanup',
} as const;

const connection = (): ConnectionOptions | null => {
  const client = getRedisClient();
  if (!client) return null;
  return client as unknown as ConnectionOptions;
};

const queues = new Map<string, Queue>();

/** Returns null when Redis is unavailable — callers must no-op safely. */
export const getQueue = (name: string): Queue | null => {
  const existing = queues.get(name);
  if (existing) return existing;
  const conn = connection();
  if (!conn) {
    logger.warn({ queue: name }, 'Redis unavailable; queue writes skipped');
    return null;
  }
  const queue = new Queue(name, {
    connection: conn as never,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });
  queues.set(name, queue);
  return queue;
};

export const enqueue = async (
  queueName: string,
  jobName: string,
  data: Record<string, unknown>,
  options?: { jobId?: string; delay?: number; repeat?: { pattern: string } }
): Promise<void> => {
  const queue = getQueue(queueName);
  if (!queue) return;
  try {
    await queue.add(jobName, data, {
      jobId: options?.jobId,
      delay: options?.delay,
      repeat: options?.repeat as never,
    });
  } catch (err) {
    logger.warn({ err, queueName, jobName }, 'Failed to enqueue job');
  }
};

export const queuePrefix = () => (env.NODE_ENV === 'production' ? 'gharkhana' : 'gharkhana-dev');
