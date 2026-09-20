import { Router } from 'express';
import { paymentController } from './payment.controller.js';
import { authenticate, requireRole } from '../../shared/middleware/authenticate.js';
import { validate } from '../../shared/middleware/validate.js';
import { mutationRateLimit } from '../../shared/middleware/rateLimit.js';
import { initiatePaymentSchema, refundPaymentSchema } from '@gharkhana/validation';

export const paymentRouter: Router = Router();

// 1. Webhook endpoint (Public, signature-verified inside controller/adapter)
paymentRouter.post('/webhook/:gateway', (req, res, next) =>
  paymentController.handleWebhook(req, res, next)
);

// 2. Customer payment endpoints
paymentRouter.post(
  '/',
  authenticate,
  mutationRateLimit,
  validate(initiatePaymentSchema),
  (req, res, next) => paymentController.initiatePayment(req, res, next)
);

paymentRouter.get('/:id', authenticate, (req, res, next) =>
  paymentController.getPaymentById(req, res, next)
);

paymentRouter.get('/subscription/:subscriptionId', authenticate, (req, res, next) =>
  paymentController.getSubscriptionPayments(req, res, next)
);

// 3. Admin payment operations
paymentRouter.post(
  '/:id/refund',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  validate(refundPaymentSchema),
  (req, res, next) => paymentController.processRefund(req, res, next)
);

paymentRouter.post(
  '/reconcile',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  (req, res, next) => paymentController.reconcilePayments(req, res, next)
);
