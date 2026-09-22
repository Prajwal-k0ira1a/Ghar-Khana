import { Router } from 'express';
import { reviewController } from './review.controller.js';
import { authenticate, requireRole } from '../../shared/middleware/authenticate.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { createReviewSchema } from '@gharkhana/validation';
import { z } from 'zod';

const moderateSchema = z.object({
  status: z.enum(['PUBLISHED', 'FLAGGED', 'REMOVED']),
});

export const reviewRouter: Router = Router();

reviewRouter.post(
  '/',
  authenticate,
  requireRole('CUSTOMER'),
  validateBody(createReviewSchema),
  (req, res, next) => reviewController.createReview(req, res, next)
);

reviewRouter.get('/provider/:providerId', (req, res, next) =>
  reviewController.listProviderReviews(req, res, next)
);

reviewRouter.patch(
  '/:id/moderate',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  validateBody(moderateSchema),
  (req, res, next) => reviewController.moderateReview(req, res, next)
);
