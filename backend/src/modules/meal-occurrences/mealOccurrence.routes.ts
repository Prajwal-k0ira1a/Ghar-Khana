import { Router } from 'express';
import { mealOccurrenceController } from './mealOccurrence.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { customizeMealSchema } from '@gharkhana/validation';

export const mealOccurrenceRouter: Router = Router();

mealOccurrenceRouter.get('/:id', authenticate, (req, res, next) =>
  mealOccurrenceController.getMealById(req, res, next)
);

mealOccurrenceRouter.patch('/:id', authenticate, validateBody(customizeMealSchema), (req, res, next) =>
  mealOccurrenceController.customizeMeal(req, res, next)
);

mealOccurrenceRouter.post('/:id/skip', authenticate, (req, res, next) =>
  mealOccurrenceController.skipMeal(req, res, next)
);

mealOccurrenceRouter.post('/:id/restore', authenticate, (req, res, next) =>
  mealOccurrenceController.restoreMeal(req, res, next)
);
