import { Router } from 'express';
import { locationController } from './location.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { createLocationSchema } from '@gharkhana/validation';

export const locationRouter: Router = Router();

// Mount on /locations
locationRouter.get('/user/all', authenticate, (req, res, next) =>
  locationController.listLocations(req, res, next)
);

locationRouter.post('/', authenticate, validateBody(createLocationSchema), (req, res, next) =>
  locationController.createLocation(req, res, next)
);

locationRouter.patch('/:id', authenticate, (req, res, next) =>
  locationController.updateLocation(req, res, next)
);

locationRouter.delete('/:id', authenticate, (req, res, next) =>
  locationController.deleteLocation(req, res, next)
);

locationRouter.get('/:id/serviceability', authenticate, (req, res, next) =>
  locationController.checkServiceability(req, res, next)
);
