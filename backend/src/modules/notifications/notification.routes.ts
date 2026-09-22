import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { registerDeviceTokenSchema } from '@gharkhana/validation';

export const notificationRouter: Router = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', (req, res, next) =>
  notificationController.listNotifications(req, res, next)
);
notificationRouter.patch('/:id/read', (req, res, next) =>
  notificationController.markRead(req, res, next)
);
notificationRouter.post('/read-all', (req, res, next) =>
  notificationController.markAllRead(req, res, next)
);
notificationRouter.post(
  '/device-tokens',
  validateBody(registerDeviceTokenSchema),
  (req, res, next) => notificationController.registerDeviceToken(req, res, next)
);
