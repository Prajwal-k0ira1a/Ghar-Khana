import { Router } from 'express';
import { subscriptionController } from './subscription.controller.js';
import { mealOccurrenceController } from '../meal-occurrences/mealOccurrence.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { mutationRateLimit } from '../../shared/middleware/rateLimit.js';
import { createSubscriptionSchema } from '@gharkhana/validation';

export const subscriptionRouter: Router = Router();

subscriptionRouter.get('/', authenticate, (req, res, next) =>
  subscriptionController.listSubscriptions(req, res, next)
);

subscriptionRouter.post('/', authenticate, mutationRateLimit, validateBody(createSubscriptionSchema), (req, res, next) =>
  subscriptionController.createSubscription(req, res, next)
);

subscriptionRouter.get('/:id', authenticate, (req, res, next) =>
  subscriptionController.getSubscriptionById(req, res, next)
);

subscriptionRouter.post('/:id/activate', authenticate, (req, res, next) =>
  subscriptionController.activateSubscription(req, res, next)
);

subscriptionRouter.post('/:id/pause', authenticate, (req, res, next) =>
  subscriptionController.pauseSubscription(req, res, next)
);

subscriptionRouter.post('/:id/resume', authenticate, (req, res, next) =>
  subscriptionController.resumeSubscription(req, res, next)
);

subscriptionRouter.post('/:id/cancel', authenticate, (req, res, next) =>
  subscriptionController.cancelSubscription(req, res, next)
);

subscriptionRouter.get('/:id/meals', authenticate, (req, res, next) =>
  mealOccurrenceController.getSubscriptionMeals(req, res, next)
);
