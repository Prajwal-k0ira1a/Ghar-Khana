import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './shared/config/env';
import { errorHandler } from './shared/middleware/errorHandler';
import { NotFoundError } from './shared/errors/AppError';
import { authRouter } from './modules/auth/auth.routes.js';
import { userRouter } from './modules/users/user.routes.js';
import { locationRouter } from './modules/locations/location.routes.js';
import { providerRouter } from './modules/providers/provider.routes.js';
import { menuRouter } from './modules/menus/menu.routes.js';
import { subscriptionRouter } from './modules/subscriptions/subscription.routes.js';
import { mealOccurrenceRouter } from './modules/meal-occurrences/mealOccurrence.routes.js';
import { providerOperationsRouter } from './modules/provider-operations/providerOperations.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { paymentRouter } from './modules/payments/payment.routes.js';
import { walletRouter } from './modules/wallets/wallet.routes.js';
import { deliveryRouter } from './modules/deliveries/delivery.routes.js';
import { notificationRouter } from './modules/notifications/notification.routes.js';
import { reviewRouter } from './modules/reviews/review.routes.js';
import { disputeRouter } from './modules/disputes/dispute.routes.js';
import { generalRateLimit } from './shared/middleware/rateLimit.js';

export const createApp = (): Application => {
  const app = express();

  // Security & standard middlewares
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get(`${env.API_PREFIX}/health`, (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'gharkhana-api',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API modules
  app.use(`${env.API_PREFIX}/auth`, authRouter);
  app.use(`${env.API_PREFIX}/users`, generalRateLimit, userRouter);
  app.use(`${env.API_PREFIX}/locations`, generalRateLimit, locationRouter);
  app.use(`${env.API_PREFIX}/providers`, generalRateLimit, providerRouter);
  app.use(`${env.API_PREFIX}/provider`, generalRateLimit, providerOperationsRouter);
  app.use(`${env.API_PREFIX}/provider`, generalRateLimit, walletRouter);
  app.use(`${env.API_PREFIX}/admin`, generalRateLimit, adminRouter);
  app.use(`${env.API_PREFIX}/menus`, generalRateLimit, menuRouter);
  app.use(`${env.API_PREFIX}/subscriptions`, subscriptionRouter);
  app.use(`${env.API_PREFIX}/meals`, generalRateLimit, mealOccurrenceRouter);
  app.use(`${env.API_PREFIX}/payments`, paymentRouter);
  app.use(`${env.API_PREFIX}/deliveries`, generalRateLimit, deliveryRouter);
  app.use(`${env.API_PREFIX}/notifications`, generalRateLimit, notificationRouter);
  app.use(`${env.API_PREFIX}/reviews`, generalRateLimit, reviewRouter);
  app.use(`${env.API_PREFIX}/disputes`, generalRateLimit, disputeRouter);

  // Catch-all 404 handler
  app.use((req: Request, _res: Response, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
};

