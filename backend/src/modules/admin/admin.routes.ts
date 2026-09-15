import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate, requireRole } from '../../shared/middleware/authenticate.js';
import { validate } from '../../shared/middleware/validate.js';
import { reviewProviderSchema, updateDisputeSchema, refundPaymentSchema } from '@gharkhana/validation';

export const adminRouter: Router = Router();

// All admin routes require ADMIN or SUPER_ADMIN role
adminRouter.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

adminRouter.get('/providers/pending', (req, res, next) =>
  adminController.listPendingProviders(req, res, next)
);

adminRouter.post('/providers/:id/verify', (req, res, next) =>
  adminController.verifyProvider(req, res, next)
);

adminRouter.post(
  '/providers/:id/reject',
  validate(reviewProviderSchema.partial()),
  (req, res, next) => adminController.rejectProvider(req, res, next)
);

adminRouter.get('/disputes', (req, res, next) =>
  adminController.listDisputes(req, res, next)
);

adminRouter.patch('/disputes/:id', validate(updateDisputeSchema), (req, res, next) =>
  adminController.updateDispute(req, res, next)
);

adminRouter.post(
  '/subscriptions/:id/refund',
  validate(refundPaymentSchema),
  (req, res, next) => adminController.refundSubscription(req, res, next)
);
