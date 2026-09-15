import { Redis } from 'ioredis';
import { env } from '../config/env';
import { logger } from '../logger/logger';

let redisInstance: Redis | null = null;

export const getRedisClient = (): Redis | null => {
  if (redisInstance) {
    return redisInstance;
  }

  try {
    const client = new Redis(env.REDIS_URL, {
      // BullMQ workers use blocking Redis commands and require retries to stay
      // enabled indefinitely on their shared connection.
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis connection failed, continuing in memory/fallback mode');
          return null;
        }
        return Math.min(times * 100, 1000);
      },
      lazyConnect: true,
    });

    client.on('error', (err) => {
      logger.warn({ err: err.message }, 'Redis connection warning (running without external cache)');
    });

    client.on('connect', () => {
      logger.info('Connected to Redis');
    });

    // Attempt connection
    client.connect().catch(() => {
      logger.warn('Redis is not currently available. BullMQ queues will initialize when Redis is up.');
    });

    redisInstance = client;
    return client;
  } catch (err) {
    logger.warn({ err }, 'Could not initialize Redis client');
    return null;
  }
};

