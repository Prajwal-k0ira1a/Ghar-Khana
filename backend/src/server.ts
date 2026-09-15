import { createApp } from './app';
import { env } from './shared/config/env';
import { logger } from './shared/logger/logger';
import { sqlClient } from './db/index';
import { getRedisClient } from './shared/database/redis';
import { startWorkers, stopWorkers } from './jobs/workers';
import { registerSchedules } from './jobs/schedule';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`GharKhana API server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`Health check: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
  // Initialize Redis + background workers (non-blocking; API serves traffic regardless)
  getRedisClient();
  try {
    startWorkers();
    registerSchedules().catch((err) => logger.warn({ err }, 'Failed to register job schedules'));
  } catch (err) {
    logger.warn({ err }, 'Background workers unavailable; continuing without them');
  }
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await stopWorkers();
    } catch (err) {
      logger.error({ err }, 'Error stopping background workers');
    }
    try {
      await sqlClient.end();
      logger.info('Closed database connection pool');
    } catch (err) {
      logger.error({ err }, 'Error closing database pool');
    }
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after 10s timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

