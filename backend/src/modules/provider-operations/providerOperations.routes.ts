import { Router } from 'express';
import { providerOperationsController } from './providerOperations.controller.js';
import { authenticate, requireRole } from '../../shared/middleware/authenticate.js';
import { validate } from '../../shared/middleware/validate.js';
import { updateMealStatusSchema } from '@gharkhana/validation';

export const providerOperationsRouter: Router = Router();

// All operational routes require authenticated PROVIDER role
providerOperationsRouter.use(authenticate, requireRole('PROVIDER'));

// FR-13: Daily Preparation Dashboard
providerOperationsRouter.get('/meals/today', (req, res, next) =>
  providerOperationsController.getTodayMeals(req, res, next)
);

// Upcoming multi-day forecast
providerOperationsRouter.get('/meals/upcoming', (req, res, next) =>
  providerOperationsController.getUpcomingMeals(req, res, next)
);

// Meal status advancement (SCHEDULED -> PREPARING -> READY)
providerOperationsRouter.patch(
  '/meals/:id/status',
  validate(updateMealStatusSchema),
  (req, res, next) => providerOperationsController.updateMealStatus(req, res, next)
);

// Subscriber management
providerOperationsRouter.get('/subscriptions', (req, res, next) =>
  providerOperationsController.getSubscribers(req, res, next)
);

// FR-19: Provider Earnings & Revenue breakdown
providerOperationsRouter.get('/earnings', (req, res, next) =>
  providerOperationsController.getEarnings(req, res, next)
);
