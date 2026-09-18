import { Router } from 'express';
import { providerController } from './provider.controller.js';
import { authenticate, requireRole } from '../../shared/middleware/authenticate.js';
import { validate } from '../../shared/middleware/validate.js';
import {
  submitDocumentSchema,
  updateProviderProfileSchema,
  createServiceAreaSchema,
  updateServiceAreaSchema,
  updateCutoffPolicySchema,
} from '@gharkhana/validation';

export const providerRouter: Router = Router();

// Public discovery endpoints
providerRouter.get('/', (req, res, next) =>
  providerController.listProviders(req, res, next)
);

// Provider current user profile
providerRouter.get('/me/profile', authenticate, requireRole('PROVIDER'), (req, res, next) =>
  providerController.getMyProviderProfile(req, res, next)
);

providerRouter.get('/:id', (req, res, next) =>
  providerController.getProviderById(req, res, next)
);

// Protected provider management endpoints
providerRouter.patch(
  '/:id',
  authenticate,
  requireRole('PROVIDER', 'ADMIN'),
  validate(updateProviderProfileSchema),
  (req, res, next) => providerController.updateProfile(req, res, next)
);

providerRouter.post(
  '/:id/verification',
  authenticate,
  requireRole('PROVIDER'),
  validate(submitDocumentSchema),
  (req, res, next) => providerController.submitVerificationDocument(req, res, next)
);

providerRouter.post(
  '/:id/service-areas',
  authenticate,
  requireRole('PROVIDER', 'ADMIN'),
  validate(createServiceAreaSchema),
  (req, res, next) => providerController.addServiceArea(req, res, next)
);

providerRouter.patch(
  '/:id/service-areas/:areaId',
  authenticate,
  requireRole('PROVIDER', 'ADMIN'),
  validate(updateServiceAreaSchema),
  (req, res, next) => providerController.updateServiceArea(req, res, next)
);

providerRouter.delete(
  '/:id/service-areas/:areaId',
  authenticate,
  requireRole('PROVIDER', 'ADMIN'),
  (req, res, next) => providerController.deleteServiceArea(req, res, next)
);

providerRouter.put(
  '/:id/cutoff-policies',
  authenticate,
  requireRole('PROVIDER', 'ADMIN'),
  validate(updateCutoffPolicySchema),
  (req, res, next) => providerController.updateCutoffPolicy(req, res, next)
);

