import { Router } from 'express';
import { deliveryController } from './delivery.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { assignDeliverySchema, deliveryFailureSchema } from '@gharkhana/validation';

export const deliveryRouter: Router = Router();

deliveryRouter.use(authenticate);

deliveryRouter.get('/', (req, res, next) => deliveryController.listDeliveries(req, res, next));
deliveryRouter.get('/:id', (req, res, next) => deliveryController.getDeliveryById(req, res, next));
deliveryRouter.post('/:id/accept', validateBody(assignDeliverySchema), (req, res, next) =>
  deliveryController.acceptDelivery(req, res, next)
);
deliveryRouter.post('/:id/picked-up', (req, res, next) =>
  deliveryController.markPickedUp(req, res, next)
);
deliveryRouter.post('/:id/delivered', (req, res, next) =>
  deliveryController.markDelivered(req, res, next)
);
deliveryRouter.post('/:id/failed', validateBody(deliveryFailureSchema), (req, res, next) =>
  deliveryController.markFailed(req, res, next)
);
deliveryRouter.post('/:id/cancel', (req, res, next) =>
  deliveryController.cancelDelivery(req, res, next)
);
